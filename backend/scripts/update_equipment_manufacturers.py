"""Replace placeholder manufacturer/model values ("Certified Med OEM" / "Standard Series")
on existing inventory rows with the real details from app/database/equipment_catalog.py.

Only placeholder values are touched; anything an admin has already edited is left alone.
Safe to run more than once.

    python scripts/update_equipment_manufacturers.py            # apply
    python scripts/update_equipment_manufacturers.py --dry-run  # preview only
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.equipment_catalog import EQUIPMENT_DETAILS, PLACEHOLDER_MANUFACTURERS, PLACEHOLDER_MODELS
from app.database.session import SessionLocal
from app.models.equipment import Equipment


def main(dry_run: bool) -> None:
    db = SessionLocal()
    try:
        print(f"[INFO] Database: {db.bind.url.render_as_string(hide_password=True)}")
        changed = 0
        for eq in db.query(Equipment).order_by(Equipment.machine_id).all():
            details = EQUIPMENT_DETAILS.get(eq.machine_id)
            if not details:
                print(f"  - {eq.machine_id}: no catalog entry, left as is ({eq.manufacturer} / {eq.model})")
                continue
            updates = {}
            if (eq.manufacturer or "").strip() in PLACEHOLDER_MANUFACTURERS:
                updates["manufacturer"] = details["manufacturer"]
            if (eq.model or "").strip() in PLACEHOLDER_MODELS:
                updates["model"] = details["model"]
            if not updates:
                print(f"  = {eq.machine_id}: already set ({eq.manufacturer} / {eq.model})")
                continue
            print(f"  * {eq.machine_id} {eq.machine_name}: "
                  f"{eq.manufacturer} / {eq.model} -> {updates.get('manufacturer', eq.manufacturer)} / {updates.get('model', eq.model)}")
            for field, value in updates.items():
                setattr(eq, field, value)
            changed += 1
        if dry_run:
            db.rollback()
            print(f"[DRY RUN] {changed} machine(s) would be updated.")
        else:
            db.commit()
            print(f"[OK] {changed} machine(s) updated.")
    finally:
        db.close()


if __name__ == "__main__":
    main(dry_run="--dry-run" in sys.argv)
