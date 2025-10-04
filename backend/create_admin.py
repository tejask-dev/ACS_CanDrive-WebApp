from database import SessionLocal, init_db
from models import Admin
from passlib.context import CryptContext

init_db()
db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")
username = "ACS_CanDrive"
password = "Assumption_raiders"

existing = db.query(Admin).filter(Admin.username == username).first()
if not existing:
    admin = Admin(
        username=username,
        password_hash=pwd_context.hash(password),
        role="admin"
    )
    db.add(admin)
    db.commit()
    print("Admin created!")
else:
    print("Admin already exists.")
db.close()