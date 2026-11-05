"""Knowledge Base Manager API: admin-only management, processing status, isolation."""
import pytest

from app.core.security import get_password_hash
from app.models.knowledge import KnowledgeChunk
from app.models.user import User, UserRole
from rag_fixtures import V60_MANUAL, encrypt_pdf, login, make_pdf, upload


@pytest.fixture
def admin(client):
    return login(client, "admin@medequip.com", "AdminPass123!")


@pytest.fixture
def nurse(client):
    return login(client, "nurse@medequip.com", "NursePass123!")


@pytest.fixture
def other_hospital(client, db_session):
    for email, role in (("admin2@other.org", UserRole.HOSPITAL_ADMIN), ("nurse2@other.org", UserRole.NURSE_DOCTOR)):
        db_session.add(User(full_name=email, email=email, password_hash=get_password_hash("Pass123!"),
                            role=role, hospital_id="HOSP-002", is_active=True))
    db_session.flush()
    return {"admin": login(client, "admin2@other.org", "Pass123!"),
            "nurse": login(client, "nurse2@other.org", "Pass123!")}


def test_admin_uploads_txt_manual(client, admin):
    res = upload(client, admin, content=V60_MANUAL.encode())
    assert res.status_code == 201, res.text
    doc = res.json()
    assert doc["status"] == "READY"
    assert doc["page_count"] == 3
    assert doc["chunk_count"] >= 5
    assert doc["equipment_model"] == "Respironics V60"
    assert doc["version"] == "2.0"
    assert doc["uploaded_by_name"] == "Dr. Sarah Chen"
    assert doc["hospital_id"] == "HOSP-001"


def test_admin_uploads_pdf_manual(client, admin):
    pdf = make_pdf(["V60 QUICK GUIDE\nIntro text for the quick guide.",
                    "SECTION 4 ALARMS\nE05 LOW BATTERY\n1. Check the AC power cord connection."])
    res = upload(client, admin, content=pdf, filename="v60.pdf", title="V60 Quick Guide")
    assert res.status_code == 201, res.text
    doc = res.json()
    assert doc["status"] == "READY" and doc["page_count"] == 2

    detail = client.get(f"/api/knowledge/documents/{doc['id']}", headers=admin).json()
    e05 = [c for c in detail["chunks"] if "E5" in c["error_codes"]]
    assert e05 and e05[0]["page_number"] == 2


def test_upload_without_text_is_marked_failed(client, admin):
    res = upload(client, admin, content=b"   \n  ", filename="scan.txt")
    assert res.status_code == 201
    assert res.json()["status"] == "FAILED"
    assert "No extractable text" in res.json()["processing_error"]


def test_restricted_pdf_manual_upload_is_processed(client, admin):
    # Opens without a password (encrypted only to restrict editing/printing).
    pdf = encrypt_pdf(make_pdf(V60_MANUAL.split("\f")), user_password="")
    res = upload(client, admin, content=pdf, filename="v60.pdf")
    assert res.status_code == 201, res.text
    assert res.json()["status"] == "READY"
    assert res.json()["page_count"] == 3


def test_password_protected_pdf_upload_is_marked_failed(client, admin):
    pdf = encrypt_pdf(make_pdf(V60_MANUAL.split("\f")), user_password="open-me")
    res = upload(client, admin, content=pdf, filename="v60.pdf")
    assert res.status_code == 201, res.text
    assert res.json()["status"] == "FAILED"
    assert "needs a password" in res.json()["processing_error"]


def test_upload_validation(client, admin):
    assert upload(client, admin, content=b"abc", filename="manual.docx").status_code == 400
    assert upload(client, admin, content=V60_MANUAL.encode(), model="  ").status_code == 422
    assert upload(client, admin, content=V60_MANUAL.encode()).status_code == 201
    assert upload(client, admin, content=V60_MANUAL.encode()).status_code == 409  # exact duplicate


def test_document_management_is_admin_only(client, admin, nurse):
    doc_id = upload(client, admin, content=V60_MANUAL.encode()).json()["id"]
    assert upload(client, nurse, content=V60_MANUAL.encode()).status_code == 403
    assert client.delete(f"/api/knowledge/documents/{doc_id}", headers=nurse).status_code == 403
    assert client.get(f"/api/knowledge/documents/{doc_id}", headers=nurse).status_code == 403
    # Nurses can list available (READY) manuals
    listed = client.get("/api/knowledge/documents", headers=nurse)
    assert listed.status_code == 200 and listed.json()["total"] == 1
    assert client.get("/api/knowledge/documents").status_code == 401


def test_delete_removes_chunks(client, admin, db_session):
    doc_id = upload(client, admin, content=V60_MANUAL.encode()).json()["id"]
    assert db_session.query(KnowledgeChunk).filter_by(document_id=doc_id).count() > 0
    res = client.delete(f"/api/knowledge/documents/{doc_id}", headers=admin)
    assert res.status_code == 200 and res.json()["chunks_removed"] > 0
    assert db_session.query(KnowledgeChunk).filter_by(document_id=doc_id).count() == 0
    assert client.get(f"/api/knowledge/documents/{doc_id}", headers=admin).status_code == 404


def test_replace_supersedes_old_version(client, admin):
    old_id = upload(client, admin, content=V60_MANUAL.encode()).json()["id"]
    updated = V60_MANUAL.replace("below 20 percent", "below 15 percent")
    res = client.post(f"/api/knowledge/documents/{old_id}/replace", headers=admin,
                      files={"file": ("v60_v3.txt", updated.encode(), "text/plain")}, data={"version": "3.0"})
    assert res.status_code == 201, res.text
    assert res.json()["version"] == "3.0" and res.json()["status"] == "READY"

    docs = client.get("/api/knowledge/documents?include_inactive=true", headers=admin).json()["items"]
    old = next(d for d in docs if d["id"] == old_id)
    assert old["status"] == "SUPERSEDED" and old["is_active"] is False and old["chunk_count"] == 0
    active = client.get("/api/knowledge/documents", headers=admin).json()
    assert active["total"] == 1 and active["items"][0]["version"] == "3.0"


def test_catalog_lists_models(client, admin, nurse):
    upload(client, admin, content=V60_MANUAL.encode())
    catalog = client.get("/api/knowledge/catalog", headers=nurse).json()["categories"]
    assert catalog[0]["equipment_category"] == "Ventilators"
    assert catalog[0]["models"][0]["equipment_model"] == "Respironics V60"


def test_hospital_document_isolation(client, admin, other_hospital):
    doc_id = upload(client, admin, content=V60_MANUAL.encode()).json()["id"]
    assert client.get("/api/knowledge/documents", headers=other_hospital["admin"]).json()["total"] == 0
    assert client.get(f"/api/knowledge/documents/{doc_id}", headers=other_hospital["admin"]).status_code == 404
    assert client.delete(f"/api/knowledge/documents/{doc_id}", headers=other_hospital["admin"]).status_code == 404
    assert client.get("/api/knowledge/catalog", headers=other_hospital["nurse"]).json()["categories"] == []
