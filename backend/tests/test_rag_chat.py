"""Chatbot behaviour: grounding, fallbacks, scenarios A-E, authorization, history."""
import pytest

from app.core.security import get_password_hash
from app.main import app
from app.models.user import User, UserRole
from app.services.llm_service import LLMUnavailableError, get_llm_service
from rag_fixtures import C1_MANUAL, V60_MANUAL, FakeLLM, chat, login, upload


@pytest.fixture
def admin(client):
    return login(client, "admin@medequip.com", "AdminPass123!")


@pytest.fixture
def nurse(client):
    return login(client, "nurse@medequip.com", "NursePass123!")


@pytest.fixture
def manuals(client, admin):
    v60 = upload(client, admin, content=V60_MANUAL.encode())
    c1 = upload(client, admin, content=C1_MANUAL.encode(), manufacturer="Hamilton", model="Hamilton C1",
                title="C1 Operator Guide", document_type="ERROR_CODE_REFERENCE")
    assert v60.status_code == 201 and c1.status_code == 201
    return {"v60": v60.json(), "c1": c1.json()}


def use_llm(fake):
    app.dependency_overrides[get_llm_service] = lambda: fake
    return fake


def grounded_response(messages):
    """A well-behaved model answer citing S1 (the E05 chunk ranks first)."""
    return {
        "context_sufficient": True, "error_code_documented": True, "troubleshooting_documented": True,
        "answer_type": "TROUBLESHOOTING",
        "summary": "E05 indicates low battery while running on battery power.",
        "error_identification": {"error_code": "E05", "description": "Low battery: charge below 20 percent.", "source_ref": "S1"},
        "explanation": "The ventilator is running on its internal battery.",
        "troubleshooting_steps": [
            {"check": "AC power cord", "action": "Check that the AC power cord is firmly connected.",
             "expected_result": "AC indicator lights", "source_ref": "S1"},
            {"check": "Outlet", "action": "Connect to an emergency power outlet.", "expected_result": "Charging", "source_ref": "[S1]"},
        ],
        "expected_outcome": "The AC power indicator is lit and the alarm clears.",
        "escalation_recommended": True, "escalation_reason": "Escalate if the alarm persists.",
        "safety_critical": False,
    }


# ---------------------------------------------------------------- Scenario A
def test_scenario_a_known_code_grounded_answer(client, nurse, manuals):
    fake = use_llm(FakeLLM(grounded_response))
    res = chat(client, nurse, "The screen shows an error, what should I do?", error_code="E05")
    assert res.status_code == 200, res.text
    a = res.json()["answer"]
    assert a["answer_status"] == "GROUNDED_ANSWER"
    assert a["llm"] == {"provider": "nvidia", "used": True, "status": "OK"}
    assert a["error_identification"]["documented"] is True
    assert a["error_identification"]["source_label"].startswith("V60 Operator Manual v2.0, p.2")
    assert len(a["troubleshooting_steps"]) == 2
    assert all(s["source_ref"] == "S1" for s in a["troubleshooting_steps"])
    assert a["sources"][0]["error_code_match"] is True and a["sources"][0]["page_number"] == 2
    assert a["if_problem_continues"] and a["safety_disclaimer"]
    # The LLM saw only retrieved V60 context
    prompt = fake.calls[0][1]["content"]
    assert "AC power cord" in prompt and "OXYGEN SUPPLY" not in prompt


def test_scenario_a_retrieval_only_without_api_key(client, nurse, manuals):
    # Default test override = LLMService with no key -> verbatim manual excerpts.
    a = chat(client, nurse, "What does this error mean?", error_code="E-05").json()["answer"]
    assert a["answer_status"] == "RETRIEVAL_ONLY"
    assert a["llm"]["status"] == "NOT_CONFIGURED" and a["llm"]["used"] is False
    actions = [s["action"] for s in a["troubleshooting_steps"]]
    assert actions[0] == "Check that the AC power cord is firmly connected to the ventilator and the wall outlet."
    assert all(s["verbatim"] for s in a["troubleshooting_steps"])
    # Unsafe manual step (internal fuse) is withheld
    assert not any("fuse" in x for x in actions)
    assert any("withheld" in w for w in a["warnings"])
    assert "E05 LOW BATTERY" in a["error_identification"]["description"]


def test_error_code_detected_in_question(client, nurse, manuals):
    a = chat(client, nurse, "What does error code E12 mean?").json()["answer"]
    assert a["retrieval"]["error_code_found"] is True
    assert "E12 CIRCUIT DISCONNECT" in a["error_identification"]["description"]


# ---------------------------------------------------------------- Scenario B
def test_scenario_b_unknown_error_code(client, nurse, manuals):
    fake = use_llm(FakeLLM(grounded_response))
    a = chat(client, nurse, "What does this mean?", error_code="E99").json()["answer"]
    assert a["answer_status"] == "ERROR_CODE_NOT_FOUND"
    assert a["error_identification"]["documented"] is False
    assert a["error_identification"]["description"] is None
    assert a["troubleshooting_steps"] == [] and a["sources"] == []
    assert a["escalation"]["recommended"] is True
    assert fake.calls == []  # the LLM is never asked to define an undocumented code


# ---------------------------------------------------------------- Scenario C
def test_scenario_c_known_code_without_procedure(client, nurse, manuals):
    a = chat(client, nurse, "What should I do about this?", error_code="E31").json()["answer"]
    assert a["answer_status"] == "NO_TROUBLESHOOTING_PROCEDURE"
    assert a["troubleshooting_steps"] == []
    assert a["error_identification"]["documented"] is True
    assert a["escalation"]["recommended"] is True


def test_scenario_c_llm_reports_no_procedure(client, nurse, manuals):
    resp = grounded_response(None) | {"troubleshooting_documented": False, "troubleshooting_steps": []}
    use_llm(FakeLLM(resp))
    a = chat(client, nurse, "Troubleshoot this", error_code="E31").json()["answer"]
    assert a["answer_status"] == "NO_TROUBLESHOOTING_PROCEDURE"
    assert a["escalation"]["recommended"] is True


# ---------------------------------------------------------------- Scenario D
def test_scenario_d_other_model_instructions_not_used(client, nurse, manuals):
    a = chat(client, nurse, "Error E05 is showing", model="Hamilton C6", error_code="E05").json()["answer"]
    assert a["answer_status"] == "NO_KNOWLEDGE_BASE"
    assert a["sources"] == [] and a["troubleshooting_steps"] == []
    assert set(a["available_models"]) == {"Respironics V60", "Hamilton C1"}
    assert "must not be used" in a["warnings"][0]


def test_scenario_d_selected_model_only(client, nurse, manuals):
    a = chat(client, nurse, "What does it mean?", model="Hamilton C1", error_code="E05").json()["answer"]
    assert {s["equipment_model"] for s in a["sources"]} == {"Hamilton C1"}
    assert "OXYGEN SUPPLY" in a["error_identification"]["description"]


def test_ambiguous_model_requires_selection(client, nurse, manuals):
    a = chat(client, nurse, "What does it mean?", model=None, error_code="E05").json()["answer"]
    assert a["answer_status"] == "MODEL_SELECTION_REQUIRED"
    assert set(a["available_models"]) == {"Respironics V60", "Hamilton C1"}
    assert a["troubleshooting_steps"] == []


# ---------------------------------------------------------------- Scenario E
def test_scenario_e_llm_unavailable_falls_back(client, nurse, manuals):
    use_llm(FakeLLM(error=LLMUnavailableError("down")))
    a = chat(client, nurse, "How do I fix this?", error_code="E05").json()["answer"]
    assert a["answer_status"] == "RETRIEVAL_ONLY"
    assert a["llm"]["status"] == "UNAVAILABLE"
    assert a["troubleshooting_steps"] and a["sources"]
    assert "unavailable" in a["summary"].lower()


# ---------------------------------------------------------------- hallucination resistance
def test_uncited_and_unsafe_llm_steps_are_removed(client, nurse, manuals):
    def bad(messages):
        r = grounded_response(messages)
        r["troubleshooting_steps"] = [
            {"action": "Check that the AC power cord is firmly connected.", "source_ref": "S1"},
            {"action": "Replace the battery pack with a new one.", "source_ref": "S9"},  # invalid citation
            {"action": "Disable the low battery alarm.", "source_ref": "S1"},           # unsafe
            {"action": "Restart in service mode.", "source_ref": None},                 # uncited
        ]
        return r
    use_llm(FakeLLM(bad))
    a = chat(client, nurse, "Help", error_code="E05").json()["answer"]
    assert a["answer_status"] == "GROUNDED_ANSWER"
    assert [s["action"] for s in a["troubleshooting_steps"]] == ["Check that the AC power cord is firmly connected."]
    assert any("did not cite" in w for w in a["warnings"])
    assert any("disabling alarms" in w for w in a["warnings"])


def test_llm_insufficient_context_returns_fallback(client, nurse, manuals):
    use_llm(FakeLLM(grounded_response(None) | {"context_sufficient": False}))
    a = chat(client, nurse, "How does the self test work?").json()["answer"]
    assert a["answer_status"] == "NO_RELEVANT_CONTEXT"
    assert a["troubleshooting_steps"] == []


def test_irrelevant_question(client, nurse, manuals):
    fake = use_llm(FakeLLM(grounded_response))
    a = chat(client, nurse, "What is on the cafeteria lunch menu today?").json()["answer"]
    assert a["answer_status"] == "NO_RELEVANT_CONTEXT"
    assert fake.calls == []


def test_empty_knowledge_base(client, nurse):
    a = chat(client, nurse, "How do I prime the pump?", category="Infusion Pumps", model="Alaris 8015").json()["answer"]
    assert a["answer_status"] == "NO_KNOWLEDGE_BASE"
    assert a["retrieval"]["documents_available"] == 0


def test_operation_question_retrieves_operating_section(client, nurse, manuals):
    a = chat(client, nurse, "How do I power on and start the ventilator self test?").json()["answer"]
    assert a["answer_status"] == "RETRIEVAL_ONLY"
    assert a["sources"][0]["section_heading"] == "2.1 Power On"
    assert a["sources"][0]["page_number"] == 3


def test_safety_critical_question_is_urgent(client, nurse, manuals):
    a = chat(client, nurse, "There is smoke and a burning smell from the ventilator", error_code="E31").json()["answer"]
    assert a["escalation"]["urgency"] == "URGENT" and a["escalation"]["recommended"] is True


# ---------------------------------------------------------------- authz / validation / history
def test_chat_requires_authentication(client):
    assert client.post("/api/rag/chat", json={"question": "hi there", "equipment_category": "Ventilators"}).status_code == 401


def test_nurse_is_authorized_to_chat(client, nurse, manuals):
    assert chat(client, nurse, "How do I power on?").status_code == 200


def test_chat_validation(client, nurse):
    assert client.post("/api/rag/chat", headers=nurse, json={"question": " ", "equipment_category": "Ventilators"}).status_code == 422
    assert client.post("/api/rag/chat", headers=nurse, json={"question": "x" * 2001, "equipment_category": "V"}).status_code == 422
    assert chat(client, nurse, "How do I power on?", equipment_id=99999).status_code == 404


def test_chat_history_persistence(client, nurse, manuals, db_session):
    first = chat(client, nurse, "What does error E05 mean?", error_code="E05").json()
    conv_id = first["conversation_id"]
    chat(client, nurse, "And error E12?", error_code="E12", conversation_id=conv_id)

    history = client.get("/api/rag/history", headers=nurse).json()
    assert history[0]["id"] == conv_id and history[0]["message_count"] == 4
    detail = client.get(f"/api/rag/history/{conv_id}", headers=nurse).json()
    roles = [m["role"] for m in detail["messages"]]
    assert roles == ["USER", "ASSISTANT", "USER", "ASSISTANT"]
    assert detail["messages"][1]["answer"]["sources"]

    # Another user (even same hospital) cannot read or append to it
    db_session.add(User(full_name="Nurse B", email="nurseb@medequip.com", password_hash=get_password_hash("Pass123!"),
                        role=UserRole.NURSE_DOCTOR, is_active=True))
    db_session.flush()
    other = login(client, "nurseb@medequip.com", "Pass123!")
    assert client.get(f"/api/rag/history/{conv_id}", headers=other).status_code == 404
    assert chat(client, other, "hello there", conversation_id=conv_id).status_code == 404


def test_hospital_isolation_in_retrieval(client, manuals, db_session):
    db_session.add(User(full_name="Other Nurse", email="n3@other.org", password_hash=get_password_hash("Pass123!"),
                        role=UserRole.NURSE_DOCTOR, hospital_id="HOSP-002", is_active=True))
    db_session.flush()
    other = login(client, "n3@other.org", "Pass123!")
    a = chat(client, other, "What does it mean?", error_code="E05").json()["answer"]
    assert a["answer_status"] == "NO_KNOWLEDGE_BASE" and a["sources"] == []
