from getpass import getpass
from database import SessionLocal
from pwdlib import PasswordHash
import models

password_hash = PasswordHash.recommended()

db = SessionLocal()

try:

    print("===== HomeServe Super Admin Creation =====")

    full_name = input("Enter Admin Name: ").strip()
    email = input("Enter Admin Email: ").strip().lower()
    phone = input("Enter Admin Phone: ").strip()

    existing_user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if existing_user:
        print("This email is already registered.")
    else:

        password = getpass("Enter Admin Password: ")
        confirm_password = getpass("Confirm Admin Password: ")

        if password != confirm_password:
            print("Passwords do not match.")

        else:

            new_admin = models.User(
                full_name=full_name,
                email=email,
                phone=phone if phone else None,
                hashed_password=password_hash.hash(password),
                role="Super Admin",
                status="Active"
            )

            db.add(new_admin)
            db.commit()

            print("\nSuper Admin created successfully!")

finally:
    db.close()