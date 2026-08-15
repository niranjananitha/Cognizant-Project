def test_create_and_get_equipment(client):
    # 1. Login to get token
    login_res = client.post("/api/auth/login", json={"email": "admin@medequip.com", "password": "AdminPass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create equipment
    equip_payload = {
        "machine_id": "TEST-VEN-01",
        "machine_name": "Test ICU Ventilator",
        "category": "Ventilators",
        "department": "Intensive Care (ICU)",
        "location": "ICU - Bed 05",
        "status": "AVAILABLE",
        "is_backup_ready": True
    }
    response = client.post("/api/equipment", json=equip_payload, headers=headers)
    assert response.status_code == 201
    equip = response.json()
    assert equip["machine_id"] == "TEST-VEN-01"

    # 3. List Equipment
    list_res = client.get("/api/equipment", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert len(items) >= 1
