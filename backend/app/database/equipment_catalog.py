"""Real manufacturer / model details for the hospital's seeded inventory, keyed by machine_id.

Used by scripts/seed_database.py for new databases and by
scripts/update_equipment_manufacturers.py to fix databases seeded with placeholders."""

# Placeholder values older seeds wrote for every machine.
PLACEHOLDER_MANUFACTURERS = {"Certified Med OEM", "Certified Provider", ""}
PLACEHOLDER_MODELS = {"Standard Series", ""}

EQUIPMENT_DETAILS = {
    "VEN-2023-8472": {"manufacturer": "Philips Healthcare", "model": "Respironics V60"},
    "MX700-04": {"manufacturer": "Philips Healthcare", "model": "IntelliVue MX700"},
    "DEF-402-B": {"manufacturer": "Mindray Medical", "model": "BeneHeart D3"},
    "INF-3301-P": {"manufacturer": "BD CareFusion", "model": "Alaris System"},
    "MRI-102": {"manufacturer": "Siemens Healthineers", "model": "MAGNETOM 3.0T"},
    "MON-B650-01": {"manufacturer": "GE HealthCare", "model": "CARESCAPE B650"},
    "DEF-ZOL-03": {"manufacturer": "Zoll Medical", "model": "R Series / AED Plus"},
    "INF-ALR-05": {"manufacturer": "BD CareFusion", "model": "Alaris System"},
    "IMG-CARM-07": {"manufacturer": "GE HealthCare", "model": "OEC 3D"},
    "IMG-XRAY-08": {"manufacturer": "Siemens Healthineers", "model": "Mobilett Elara Max"},
    "IMG-US-09": {"manufacturer": "Fujifilm Sonosite", "model": "Sonosite Ultrasound"},
}
