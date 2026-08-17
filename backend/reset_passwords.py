from app.database.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
hash_val = get_password_hash('Password123!')
print("Generated hash:", hash_val)

db.query(User).update({'password_hash': hash_val})
db.commit()

users = db.query(User).all()
for u in users:
    print(u.email, u.password_hash)
