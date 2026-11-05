"""Idempotent, additive schema upgrades for existing databases.

`Base.metadata.create_all` creates new tables but never adds columns to tables that
already exist. This helper adds the few columns introduced after the initial schema
so an existing `medequip.db` keeps working without a manual migration.
Only ADD COLUMN operations are performed - nothing is dropped or rewritten."""
import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger("medequip")

# table -> [(column, DDL fragment)]
_ADDITIVE_COLUMNS = {
    "users": [
        ("hospital_id", "VARCHAR(50) NOT NULL DEFAULT 'HOSP-001'"),
    ],
}


def apply_additive_upgrades(engine: Engine) -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table, columns in _ADDITIVE_COLUMNS.items():
            if table not in existing_tables:
                continue
            present = {c["name"] for c in inspector.get_columns(table)}
            for name, ddl in columns:
                if name not in present:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
                    logger.info(f"🛠️ Schema upgrade: added {table}.{name}")
