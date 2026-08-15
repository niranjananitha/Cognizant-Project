import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings

def create_database():
    db_url = settings.DATABASE_URL
    print(f"[INFO] Current configured DATABASE_URL: {db_url}")

    if "mysql" in db_url:
        create_mysql_database(db_url)
    elif "postgresql" in db_url:
        create_postgresql_database(db_url)
    else:
        print("[INFO] SQLite database configured. SQLite files are created automatically.")

def create_mysql_database(db_url: str):
    try:
        import pymysql
        # Example: mysql+pymysql://root:root@localhost:3306/medequip
        parts = db_url.split("://")[1]
        creds, rest = parts.split("@")
        user_pass = creds.split(":")
        user = user_pass[0]
        password = user_pass[1] if len(user_pass) > 1 else ""

        host_port, db_name = rest.split("/")
        if ":" in host_port:
            host, port = host_port.split(":")
            port = int(port)
        else:
            host, port = host_port, 3306

        print(f"[INFO] Connecting to MySQL server at {host}:{port} as user '{user}'...")
        conn = pymysql.connect(
            host=host,
            user=user,
            password=password,
            port=port
        )
        cursor = conn.cursor()
        
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` DEFAULT CHARACTER SET utf8mb4;")
        print(f"[SUCCESS] MySQL database '{db_name}' created or verified successfully!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[WARNING] Could not automatically create MySQL database: {e}")
        print("[INFO] The server will fallback to SQLite automatically if MySQL is unavailable.")

def create_postgresql_database(db_url: str):
    try:
        import psycopg
        parts = db_url.split("://")[1]
        creds, rest = parts.split("@")
        user, password = creds.split(":")
        host_port, db_name = rest.split("/")
        
        if ":" in host_port:
            host, port = host_port.split(":")
        else:
            host, port = host_port, "5432"

        print(f"[INFO] Connecting to PostgreSQL server at {host}:{port} as user '{user}'...")
        conn = psycopg.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=host,
            port=port,
            autocommit=True
        )
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        if not cursor.fetchone():
            cursor.execute(f'CREATE DATABASE "{db_name}"')
            print(f"[SUCCESS] PostgreSQL database '{db_name}' created successfully!")
        else:
            print(f"[INFO] PostgreSQL database '{db_name}' already exists.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[WARNING] Could not automatically create PostgreSQL database: {e}")

if __name__ == "__main__":
    create_database()
