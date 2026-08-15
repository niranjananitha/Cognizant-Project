def test_register_and_login(client):
    # Register
    reg_payload = {
        "full_name": "Test Nurse",
        "email": "testnurse@medequip.com",
        "password": "Password123!",
        "role": "NURSE_DOCTOR",
        "department": "ICU"
    }
    response = client.post("/api/auth/register", json=reg_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testnurse@medequip.com"
    assert data["role"] == "NURSE_DOCTOR"

    # Login
    login_payload = {
        "email": "testnurse@medequip.com",
        "password": "Password123!"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
