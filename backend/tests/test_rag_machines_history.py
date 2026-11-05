"""Inventory-driven machine picker and the conversation History section."""
import pytest

from app.core.security import get_password_hash
from app.models.equipment import Equipment
from app.models.user import User, UserRole
from rag_fixtures import C1_MANUAL, V60_MANUAL, chat, login, upload


@pytest.fixture
def admin(client):
    return login(client, "admin@medequip.com", "AdminPass123!")


@pytest.fixture
def nurse(client):
    return login(client, "nurse@medequip.com", "NursePass123!")


@pytest.fixture
def machines(db_session):
    rows = [
        Equipment(machine_id="VEN-1", machine_name="Respironics V60 Ventilator", category="Ventilators",
                  manufacturer="Philips", model="V60", department="ICU"),
        Equipment(machine_id="VEN-2", machine_name="Servo-u ICU Ventilator", category="Ventilators",
                  department="ICU"),
        Equipment(machine_id="MON-1", machine_name="GE Carescape B650", category="Patient Monitors",
                  department="ICU"),
    ]
    db_session.add_all(rows)
    db_session.flush()
    return {r.machine_id: r for r in rows}


@pytest.fixture
def manuals(client, admin):
    assert upload(client, admin, content=V60_MANUAL.encode()).status_code == 201
    assert upload(client, admin, content=C1_MANUAL.encode(), manufacturer="Hamilton", model="Hamilton C1",
                  title="C1 Operator Guide", document_type="ERROR_CODE_REFERENCE").status_code == 201


# ---------------------------------------------------------------- machine picker
def test_machines_lists_every_inventory_machine(client, nurse, machines):
    res = client.get("/api/rag/machines", headers=nurse)
    assert res.status_code == 200
    codes = {m["machine_id"] for m in res.json()}
    assert {"VEN-1", "VEN-2", "MON-1"} <= codes


def test_machines_match_manuals_to_machine(client, nurse, machines, manuals):
    by_code = {m["machine_id"]: m for m in client.get("/api/rag/machines", headers=nurse).json()}

    v60 = by_code["VEN-1"]
    assert [(x["manufacturer"], x["equipment_model"]) for x in v60["matched_models"]] == [("Philips", "Respironics V60")]
    assert len(v60["category_models"]) == 2  # V60 + C1 manuals are both Ventilators

    servo = by_code["VEN-2"]
    assert servo["matched_models"] == [] and len(servo["category_models"]) == 2

    monitor = by_code["MON-1"]
    assert monitor["matched_models"] == [] and monitor["category_models"] == []


def test_manual_uploaded_for_machine_matches_only_that_machine(client, admin, nurse, db_session):
    # The admin form fills manufacturer/model from the inventory record (model = machine name).
    db_session.add_all([
        Equipment(machine_id="INF-1", machine_name="Alaris System Infusion Pump", category="Infusion Pumps",
                  manufacturer="Certified Med OEM", model="Standard Series"),
        Equipment(machine_id="INF-2", machine_name="BD Alaris System", category="Infusion Pumps",
                  manufacturer="Certified Med OEM", model="Standard Series"),
    ])
    db_session.flush()
    assert upload(client, admin, content=V60_MANUAL.encode(), category="Infusion Pumps",
                  manufacturer="Certified Med OEM", model="BD Alaris System",
                  title="BD Alaris System User Manual").status_code == 201

    by_code = {m["machine_id"]: m for m in client.get("/api/rag/machines", headers=nurse).json()}
    assert [x["equipment_model"] for x in by_code["INF-2"]["matched_models"]] == ["BD Alaris System"]
    assert by_code["INF-1"]["matched_models"] == []


def test_machines_requires_authentication(client):
    assert client.get("/api/rag/machines").status_code == 401


# ---------------------------------------------------------------- history section
def test_history_includes_machine_and_last_status(client, nurse, machines, manuals):
    eq = machines["VEN-1"]
    conv = chat(client, nurse, "What does error E05 mean?", error_code="E05", equipment_id=eq.id).json()
    row = client.get("/api/rag/history", headers=nurse).json()[0]
    assert row["id"] == conv["conversation_id"]
    assert row["machine_name"] == "Respironics V60 Ventilator" and row["machine_code"] == "VEN-1"
    assert row["last_answer_status"] == conv["answer"]["answer_status"]


def test_history_search_and_machine_filter(client, nurse, machines, manuals):
    a = chat(client, nurse, "What does error E05 mean?", error_code="E05", equipment_id=machines["VEN-1"].id).json()
    b = chat(client, nurse, "How do I power on the ventilator?", equipment_id=machines["VEN-2"].id).json()

    def ids(params):
        return [h["id"] for h in client.get("/api/rag/history", headers=nurse, params=params).json()]

    assert ids({"q": "power on"}) == [b["conversation_id"]]
    assert ids({"q": "e05"}) == [a["conversation_id"]]
    assert ids({"equipment_id": machines["VEN-1"].id}) == [a["conversation_id"]]
    assert set(ids({})) == {a["conversation_id"], b["conversation_id"]}


def test_delete_conversation(client, nurse, manuals, db_session):
    conv_id = chat(client, nurse, "What does error E05 mean?", error_code="E05").json()["conversation_id"]

    db_session.add(User(full_name="Nurse B", email="nurseb@medequip.com", password_hash=get_password_hash("Pass123!"),
                        role=UserRole.NURSE_DOCTOR, is_active=True))
    db_session.flush()
    other = login(client, "nurseb@medequip.com", "Pass123!")
    assert client.delete(f"/api/rag/history/{conv_id}", headers=other).status_code == 404

    assert client.delete(f"/api/rag/history/{conv_id}", headers=nurse).status_code == 204
    assert client.get(f"/api/rag/history/{conv_id}", headers=nurse).status_code == 404
    assert client.get("/api/rag/history", headers=nurse).json() == []
