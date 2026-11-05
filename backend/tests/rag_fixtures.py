"""Shared fixtures/helpers for the Equipment Assistance RAG tests.

The manual text below is synthetic test data written for these tests; it is not
copied from any real manufacturer document."""
import io
from typing import List, Optional

V60_MANUAL = """VENTILATOR V60 OPERATOR MANUAL
Test edition for automated tests.
\f
SECTION 4 ALARMS AND ERROR CODES
E05 LOW BATTERY
The internal battery charge is below 20 percent and the ventilator is running on battery power.
Operator troubleshooting:
1. Check that the AC power cord is firmly connected to the ventilator and the wall outlet.
2. Confirm the AC power indicator on the front panel is lit.
3. Connect the ventilator to an outlet on the emergency power circuit.
4. Remove the rear cover and replace the internal fuse.
If the alarm persists after AC power is restored, contact biomedical engineering.

E12 CIRCUIT DISCONNECT
The ventilator detected a patient circuit disconnection or large leak.
Operator troubleshooting:
1. Check the patient circuit connections at the ventilator outlet and at the patient interface.
2. Reconnect any loose tubing and confirm the exhalation port is not blocked.
3. Do not open the ventilator housing.

E31 INTERNAL FAULT
The ventilator detected an internal technical fault. Ventilation performance may be affected.
Remove the ventilator from service and use backup ventilation per hospital protocol.
\f
SECTION 2 OPERATING THE VENTILATOR
2.1 Power On
To start the ventilator press the ON/OFF key on the front panel and wait for the power-on self test to complete.
The self test checks the alarm speaker, the display and the blower before therapy can start.
2.2 Battery Operation
The internal battery provides backup power when AC power is lost. Battery status is shown on the display.
"""

C1_MANUAL = """VENTILATOR C1 OPERATOR GUIDE
SECTION 7 ERROR MESSAGES
E05 OXYGEN SUPPLY PRESSURE LOW
The oxygen inlet pressure is below the minimum supply pressure.
1. Check the oxygen hose connection to the wall outlet.
2. Verify the oxygen supply valve is open.
"""


def make_pdf(pages: List[str]) -> bytes:
    """Build a minimal multi-page text PDF (Helvetica) without extra dependencies."""
    out = io.BytesIO()
    out.write(b"%PDF-1.4\n")
    offsets = {}
    n = len(pages)
    page_ids = [4 + 2 * i for i in range(n)]
    content_ids = [5 + 2 * i for i in range(n)]

    def add(num: int, body: bytes):
        offsets[num] = out.tell()
        out.write(f"{num} 0 obj\n".encode() + body + b"\nendobj\n")

    add(1, b"<< /Type /Catalog /Pages 2 0 R >>")
    kids = " ".join(f"{p} 0 R" for p in page_ids)
    add(2, f"<< /Type /Pages /Kids [{kids}] /Count {n} >>".encode())
    add(3, b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    for i, text in enumerate(pages):
        ops = ["BT", "/F1 11 Tf", "14 TL", "50 780 Td"]
        for line in text.split("\n"):
            esc = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            ops.append(f"({esc}) Tj T*")
        ops.append("ET")
        stream = "\n".join(ops).encode("latin-1")
        add(page_ids[i], (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] "
            f"/Resources << /Font << /F1 3 0 R >> >> /Contents {content_ids[i]} 0 R >>").encode())
        add(content_ids[i], f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream")
    xref = out.tell()
    total = 3 + 2 * n
    out.write(f"xref\n0 {total + 1}\n0000000000 65535 f \n".encode())
    for k in range(1, total + 1):
        out.write(f"{offsets[k]:010d} 00000 n \n".encode())
    out.write(f"trailer\n<< /Size {total + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
    return out.getvalue()


def login(client, email: str, password: str) -> dict:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def upload(client, headers, *, content: bytes, filename: str = "manual.txt",
           category: str = "Ventilators", manufacturer: str = "Philips",
           model: str = "Respironics V60", title: str = "V60 Operator Manual",
           document_type: str = "USER_MANUAL", version: str = "2.0"):
    return client.post(
        "/api/knowledge/upload",
        headers=headers,
        files={"file": (filename, content, "text/plain" if filename.endswith(".txt") else "application/pdf")},
        data={"equipment_category": category, "manufacturer": manufacturer, "equipment_model": model,
              "title": title, "document_type": document_type, "version": version},
    )


def chat(client, headers, question: str, *, category: str = "Ventilators",
         model: Optional[str] = "Respironics V60", error_code: Optional[str] = None,
         conversation_id: Optional[int] = None, equipment_id: Optional[int] = None):
    body = {"question": question, "equipment_category": category}
    if model:
        body["equipment_model"] = model
    if error_code:
        body["error_code"] = error_code
    if conversation_id:
        body["conversation_id"] = conversation_id
    if equipment_id:
        body["equipment_id"] = equipment_id
    return client.post("/api/rag/chat", headers=headers, json=body)


class FakeLLM:
    """Stands in for LLMService. Records prompts; returns a canned dict or raises."""
    provider = "nvidia"

    def __init__(self, response=None, error: Optional[Exception] = None):
        self.response = response
        self.error = error
        self.calls = []

    @property
    def is_configured(self) -> bool:
        return True

    def chat_json(self, messages):
        self.calls.append(messages)
        if self.error:
            raise self.error
        return self.response(messages) if callable(self.response) else self.response
