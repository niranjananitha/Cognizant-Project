def test_service_request_workflow(client):
    # 1. Login Admin & Engineer
    admin_res = client.post("/api/auth/login", json={"email": "admin@medequip.com", "password": "AdminPass123!"})
    admin_headers = {"Authorization": f"Bearer {admin_res.json()['access_token']}"}

    eng_res = client.post("/api/auth/login", json={"email": "engineer@medequip.com", "password": "EngPass123!"})
    eng_headers = {"Authorization": f"Bearer {eng_res.json()['access_token']}"}

    # 2. Create equipment
    equip_res = client.post("/api/equipment", json={
        "machine_id": "TEST-DEF-02",
        "machine_name": "Test Defibrillator",
        "category": "Defibrillators",
        "department": "ER",
        "status": "AVAILABLE"
    }, headers=admin_headers)
    equip_id = equip_res.json()["id"]

    # 3. Raise Service Request
    sr_res = client.post("/api/service-requests", json={
        "equipment_id": equip_id,
        "issue": "Capacitor charge failure",
        "priority": "HIGH",
        "observed_symptoms": "Delayed charge time"
    }, headers=admin_headers)
    assert sr_res.status_code == 201
    sr = sr_res.json()
    sr_id = sr["id"]
    assert sr["status"] == "RAISED"

    # 4. Acknowledge as Engineer
    ack_res = client.post(f"/api/service-requests/{sr_id}/acknowledge", headers=eng_headers)
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "ACKNOWLEDGED"

    # 5. Complete Service as Engineer
    comp_res = client.post(f"/api/service-requests/{sr_id}/complete", headers=eng_headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "COMPLETED"
