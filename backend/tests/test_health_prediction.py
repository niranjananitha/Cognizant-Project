def test_health_assessment_endpoint(client):
    # 1. Login to get token
    login_res = client.post("/api/auth/login", json={"email": "nurse@medequip.com", "password": "NursePass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create equipment (as admin)
    admin_login = client.post("/api/auth/login", json={"email": "admin@medequip.com", "password": "AdminPass123!"})
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    
    equip_res = client.post("/api/equipment", json={
        "machine_id": "TEST-MON-99",
        "machine_name": "Test Patient Monitor",
        "category": "Patient Monitors",
        "department": "ICU",
        "location": "ICU - Bed 02",
        "status": "AVAILABLE"
    }, headers=admin_headers)
    equip_id = equip_res.json()["id"]

    # 3. Health assessment (as nurse)
    assessment_payload = {
        "operating_temperature_c": 43.5,
        "system_pressure_cmh2o": 14.2,
        "total_operating_hours": 12450,
        "recent_downtime_hours": 12,
        "backup_battery_voltage_v": 10.4,
        "flow_rate_lmin": 45.0,
        "system_error_code": "ERR-042-T",
        "clinical_notes": "Compressor motor vibration"
    }

    res = client.post(f"/api/equipment/{equip_id}/health-assessment", json=assessment_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["equipment_id"] == equip_id
    assert "risk_score" in data
    assert "risk_level" in data
    assert "recommended_fix" in data
