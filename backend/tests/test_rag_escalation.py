"""Scenario F: escalation from the chatbot into the existing service workqueue."""
import pytest

from app.core.security import get_password_hash
from app.models.equipment import Equipment
from app.models.user import User, UserRole
from rag_fixtures import V60_MANUAL, chat, login, upload


@pytest.fixture
def setup(client, db_session):
    admin = login(client, "admin@medequip.com", "AdminPass123!")
    nurse = login(client, "nurse@medequip.com", "NursePass123!")
    engineer = login(client, "engineer@medequip.com", "EngPass123!")
    upload(client, admin, content=V60_MANUAL.encode())
    device = Equipment(machine_id="VEN-TEST-01", machine_name="Respironics V60 Ventilator",
                       category="Ventilators", department="Intensive Care (ICU)")
    db_session.add(device)
    db_session.flush()
    return {"admin": admin, "nurse": nurse, "engineer": engineer, "device_id": device.id}


def escalate(client, headers, device_id, conversation_id=None, description="E05 persists after reconnecting AC power.",
             safety=False, priority="MEDIUM"):
    return client.post("/api/service-requests", headers=headers, json={
        "equipment_id": device_id,
        "issue": "[Equipment Assistance] E05 - LOW BATTERY not resolved",
        "priority": priority,
        "observed_symptoms": description,
        "escalation": {
            "conversation_id": conversation_id,
            "error_code": "E05",
            "nurse_description": description,
            "troubleshooting_attempted": ["Checked AC power cord", "Confirmed AC indicator"],
            "troubleshooting_outcome": "NOT_RESOLVED",
            "patient_safety_concern": safety,
        },
    })


def test_scenario_f_escalation_creates_ticket(client, setup):
    s = setup
    conv = chat(client, s["nurse"], "Low battery error", error_code="E05", equipment_id=s["device_id"]).json()
    res = escalate(client, s["nurse"], s["device_id"], conv["conversation_id"])
    assert res.status_code == 201, res.text
    t = res.json()
    assert t["ticket_number"].startswith("SR-")
    assert t["status"] == "RAISED" and t["display_status"] == "NEW"
    assert t["priority"] == "HIGH"  # ventilator = life-support floor
    e = t["escalation"]
    assert e["hospital_id"] == "HOSP-001"
    assert e["department"] == "Intensive Care (ICU)"
    assert e["equipment_model"] == "Respironics V60" and e["manufacturer"] == "Philips"
    assert e["error_code"] == "E05"
    assert e["troubleshooting_attempted"] == ["Checked AC power cord", "Confirmed AC indicator"]
    assert e["troubleshooting_outcome"] == "NOT_RESOLVED"
    # manual references derived server-side from the conversation
    assert e["manual_references"] and e["manual_references"][0]["document_title"] == "V60 Operator Manual"
    assert "E05 LOW BATTERY" in e["identified_issue"]


def test_safety_critical_escalation_is_critical(client, setup):
    res = escalate(client, setup["nurse"], setup["device_id"], description="Smoke coming from the ventilator housing")
    assert res.status_code == 201
    assert res.json()["priority"] == "CRITICAL" and res.json()["escalation"]["safety_critical"] is True
    res2 = escalate(client, setup["nurse"], setup["device_id"], safety=True)
    assert res2.json()["priority"] == "CRITICAL"


def test_ticket_status_tracking_through_lifecycle(client, setup):
    s = setup
    sr = escalate(client, s["nurse"], s["device_id"]).json()
    sr_id = sr["id"]

    # Engineer sees it in the existing workqueue
    queue = client.get("/api/service-requests?source=CHATBOT", headers=s["engineer"]).json()
    assert any(i["id"] == sr_id for i in queue["items"])
    mine = client.get("/api/service-requests?raised_by_me=true", headers=s["nurse"]).json()
    assert [i["id"] for i in mine["items"]] == [sr_id]

    assert client.post(f"/api/service-requests/{sr_id}/verify", headers=s["nurse"]).status_code == 409
    assert client.post(f"/api/service-requests/{sr_id}/acknowledge", headers=s["engineer"]).json()["display_status"] == "ACKNOWLEDGED"
    assert client.post(f"/api/service-requests/{sr_id}/start-diagnosis", headers=s["engineer"]).json()["display_status"] == "IN_PROGRESS"
    assert client.post(f"/api/service-requests/{sr_id}/complete", headers=s["engineer"]).json()["display_status"] == "RESOLVED"

    verified = client.post(f"/api/service-requests/{sr_id}/verify", headers=s["nurse"])
    assert verified.status_code == 200 and verified.json()["display_status"] == "VERIFIED"

    tracked = client.get(f"/api/service-requests/{sr_id}", headers=s["nurse"]).json()
    assert tracked["display_status"] == "VERIFIED" and tracked["escalation"]["verified_at"]

    closed = client.patch(f"/api/service-requests/{sr_id}", headers=s["engineer"], json={"status": "CLOSED"})
    assert closed.json()["display_status"] == "CLOSED"


def test_escalation_hospital_isolation(client, setup, db_session):
    sr_id = escalate(client, setup["nurse"], setup["device_id"]).json()["id"]
    db_session.add(User(full_name="Eng 2", email="eng2@other.org", password_hash=get_password_hash("Pass123!"),
                        role=UserRole.MAINTENANCE_ENGINEER, hospital_id="HOSP-002", is_active=True))
    db_session.flush()
    other = login(client, "eng2@other.org", "Pass123!")
    assert client.get(f"/api/service-requests/{sr_id}", headers=other).status_code == 404
    assert client.post(f"/api/service-requests/{sr_id}/acknowledge", headers=other).status_code == 404
    queue = client.get("/api/service-requests?source=CHATBOT", headers=other).json()
    assert queue["total"] == 0


def test_escalation_validation(client, setup):
    bad = client.post("/api/service-requests", headers=setup["nurse"], json={
        "equipment_id": setup["device_id"], "issue": "x",
        "escalation": {"nurse_description": "no"}})
    assert bad.status_code == 422
    assert escalate(client, setup["nurse"], setup["device_id"], conversation_id=99999).status_code == 404


def test_plain_service_requests_unchanged(client, setup):
    res = client.post("/api/service-requests", headers=setup["admin"], json={
        "equipment_id": setup["device_id"], "issue": "Routine check", "priority": "LOW"})
    assert res.status_code == 201
    assert res.json()["priority"] == "LOW" and res.json()["escalation"] is None
