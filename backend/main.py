from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from jwt.exceptions import InvalidTokenError
from database import engine, Base, get_db
from datetime import datetime, timedelta, timezone
from pwdlib import PasswordHash
import models
import schemas
import jwt
import uuid
import os
import uuid

from fastapi import UploadFile, File
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, extract
from datetime import date
# ================= DATABASE =================

Base.metadata.create_all(bind=engine)

password_hash = PasswordHash.recommended()


# ================= JWT CONFIGURATION =================

SECRET_KEY = "homeserve-secret-key-change-later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

security = HTTPBearer()


def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ================= JWT AUTHENTICATION =================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

        user_id = int(user_id)

    except (InvalidTokenError, ValueError, TypeError):

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    current_user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not current_user:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    if current_user.status != "Active":

        raise HTTPException(
            status_code=403,
            detail="Your account is not active"
        )

    return current_user


# ================= ROLE BASED ACCESS =================

def role_required(allowed_roles: list):

    def check_role(
        current_user: models.User = Depends(get_current_user)
    ):

        if current_user.role not in allowed_roles:

            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this resource"
            )

        return current_user

    return check_role


# ================= FASTAPI APP =================

app = FastAPI(
    title="HomeServe API",
    description="Home Services Management System",
    version="1.0.0"
)

# ==========================
# BOOKING IMAGE UPLOAD
# ==========================

UPLOAD_DIR = os.path.join(
    os.path.dirname(__file__),
    "uploads",
    "bookings"
)

os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=os.path.join(
        os.path.dirname(__file__),
        "uploads"
    )),
    name="uploads"
)
# ==========================
# CORS CONFIGURATION
# ==========================

origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    ).split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= BASIC APIs =================

@app.get("/")
def home():

    return {
        "message": "Welcome to HomeServe Backend API",
        "status": "Running Successfully"
    }


@app.get("/health")
def health_check():

    return {
        "status": "Healthy",
        "application": "HomeServe"
    }


@app.get("/api/database-test")
def database_test():

    try:

        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "Success",
            "message": "MySQL Database Connected Successfully!"
        }

    except Exception as e:

        return {
            "status": "Error",
            "message": str(e)
        }


# =====================================================
# SERVICES CRUD APIs
# =====================================================

@app.post(
    "/api/services",
    response_model=schemas.ServiceResponse
)
def create_service(
    service: schemas.ServiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    new_service = models.Service(**service.model_dump())

    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    return new_service


@app.get(
    "/api/services",
    response_model=list[schemas.ServiceResponse]
)
def get_services(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    return db.query(models.Service).all()


@app.get(
    "/api/services/{service_id}",
    response_model=schemas.ServiceResponse
)
def get_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    service = db.query(models.Service).filter(
        models.Service.id == service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found"
        )

    return service


@app.put(
    "/api/services/{service_id}",
    response_model=schemas.ServiceResponse
)
def update_service(
    service_id: int,
    service_data: schemas.ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    service = db.query(models.Service).filter(
        models.Service.id == service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found"
        )

    update_data = service_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(service, key, value)

    db.commit()
    db.refresh(service)

    return service


@app.delete("/api/services/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    service = db.query(models.Service).filter(
        models.Service.id == service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found"
        )

    db.delete(service)
    db.commit()

    return {"message": "Service deleted successfully"}

# =====================================================
# AUTOMATIC NOTIFICATION HELPER
# =====================================================

def send_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "General"
):

    notification = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read="Unread"
    )

    db.add(notification)
    db.flush()

    return notification

# =====================================================
# BOOKING IMAGE UPLOAD API
# =====================================================

@app.post("/api/bookings/upload-image")
async def upload_booking_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):

    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]

    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG, PNG and WEBP images are allowed"
        )

    content = await file.read()

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size must be less than 5 MB"
        )

    filename = f"{uuid.uuid4().hex}{extension}"

    file_path = os.path.join(
        UPLOAD_DIR,
        filename
    )

    with open(file_path, "wb") as image_file:
        image_file.write(content)

    return {
        "message": "Image uploaded successfully",
        "image_url": f"/uploads/bookings/{filename}"
    }
# =====================================================
# BOOKINGS CRUD APIs
# =====================================================

@app.post(
    "/api/bookings",
    response_model=schemas.BookingResponse
)


# =====================================================
# BOOKINGS CRUD APIs
# =====================================================

@app.post(
    "/api/bookings",
    response_model=schemas.BookingResponse
)
def create_booking(
    booking: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    if current_user.role not in ["Customer", "Super Admin"]:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to create bookings"
        )

    provider_id = booking.provider_id

    if provider_id is not None:

        provider = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.id == provider_id
        ).first()

        if not provider:
            raise HTTPException(
                status_code=404,
                detail="Provider not found"
            )

        if provider.verification_status != "Approved":
            raise HTTPException(
                status_code=400,
                detail="Provider is not approved"
            )

        if booking.time_slot:
            existing_booking = db.query(models.Booking).filter(
                models.Booking.provider_id == provider_id,
                models.Booking.date == booking.date,
                models.Booking.time_slot == booking.time_slot,
                models.Booking.status != "Cancelled"
            ).first()

            if existing_booking:
                raise HTTPException(
                    status_code=409,
                    detail="This provider is already booked for the selected date and time slot"
                )

    new_booking = models.Booking(
        booking_code="BK" + uuid.uuid4().hex[:8].upper(),
        customer=booking.customer,
        user_id=current_user.id if current_user.role == "Customer" else None,
        service=booking.service,
        provider_id=provider_id,
        date=booking.date,
        time_slot=booking.time_slot,
        address=booking.address,
        description=booking.description,
        reference_image_url=booking.reference_image_url,
        amount=booking.amount,
        status=booking.status
    )

    db.add(new_booking)
    db.flush()

    send_notification(
        db=db,
        user_id=current_user.id,
        title="Booking Created",
        message=(
            f"Your booking {new_booking.booking_code} "
            f"for {new_booking.service} has been created successfully."
        ),
        notification_type="Booking"
    )

    db.commit()
    db.refresh(new_booking)

    return new_booking


@app.get(
    "/api/bookings",
    response_model=list[schemas.BookingResponse]
)
def get_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    return db.query(models.Booking).order_by(
        models.Booking.id.desc()
    ).all()

@app.get(
    "/api/bookings/{booking_id}",
    response_model=schemas.BookingResponse
)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    return booking


@app.put(
    "/api/bookings/{booking_id}",
    response_model=schemas.BookingResponse
)
@app.put("/api/bookings/{booking_id}", response_model=schemas.BookingResponse)
def update_booking(
    booking_id: int,
    booking_data: schemas.BookingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    # Role and ownership validation
    if current_user.role == "Customer":
        if booking.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You cannot update another customer's booking"
            )

    elif current_user.role != "Super Admin":
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to update bookings"
        )

    old_status = booking.status

    update_data = booking_data.model_dump(exclude_unset=True)

    # Determine final booking details
    new_provider_id = update_data.get(
        "provider_id", booking.provider_id
    )

    new_date = update_data.get("date", booking.date)

    new_time_slot = update_data.get(
        "time_slot", booking.time_slot
    )

    # Validate Provider
    if new_provider_id is not None:

        provider = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.id == new_provider_id
        ).first()

        if not provider:
            raise HTTPException(
                status_code=404,
                detail="Provider not found"
            )

        if provider.verification_status != "Approved":
            raise HTTPException(
                status_code=400,
                detail="Provider is not approved"
            )

    # Prevent duplicate booking during reschedule
    if new_provider_id is not None and new_time_slot:

        existing_booking = db.query(models.Booking).filter(
            models.Booking.provider_id == new_provider_id,
            models.Booking.date == new_date,
            models.Booking.time_slot == new_time_slot,
            models.Booking.status != "Cancelled",
            models.Booking.id != booking_id
        ).first()

        if existing_booking:
            raise HTTPException(
                status_code=409,
                detail="This provider is already booked for the selected date and time slot"
            )

    # Apply updates
    for key, value in update_data.items():
        setattr(booking, key, value)

    # Send notification
    if old_status != booking.status:

        send_notification(
            db=db,
            user_id=booking.user_id or current_user.id,
            title="Booking Status Updated",
            message=(
                f"Booking {booking.booking_code} status changed "
                f"from {old_status} to {booking.status}."
            ),
            notification_type="Booking"
        )

    elif "date" in update_data or "time_slot" in update_data:

        send_notification(
            db=db,
            user_id=booking.user_id or current_user.id,
            title="Booking Rescheduled",
            message=(
                f"Booking {booking.booking_code} has been rescheduled "
                f"to {booking.date} at {booking.time_slot or 'Time not selected'}."
            ),
            notification_type="Booking"
        )

    db.commit()
    db.refresh(booking)

    return booking
@app.delete("/api/bookings/{booking_id}")
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    db.delete(booking)
    db.commit()

    return {"message": "Booking deleted successfully"}


# =====================================================
# CUSTOMERS CRUD APIs
# =====================================================

@app.post(
    "/api/customers",
    response_model=schemas.CustomerResponse
)
def create_customer(
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    # Role Validation
    if current_user.role not in ["Customer", "Super Admin"]:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to create customer profiles"
        )

    # Customer can create only their own profile
    if current_user.role == "Customer":
        if customer.email.lower() != current_user.email.lower():
            raise HTTPException(
                status_code=403,
                detail="You can create only your own customer profile"
            )

        user_id = current_user.id

    else:
        # Super Admin: link an existing Customer account if email matches
        linked_user = db.query(models.User).filter(
            models.User.email == customer.email,
            models.User.role == "Customer"
        ).first()

        user_id = linked_user.id if linked_user else None

    # Check duplicate email
    existing_customer = db.query(models.Customer).filter(
        models.Customer.email == customer.email
    ).first()

    if existing_customer:
        raise HTTPException(
            status_code=400,
            detail="Customer with this email already exists"
        )

    # Check duplicate user profile
    if user_id is not None:
        existing_profile = db.query(models.Customer).filter(
            models.Customer.user_id == user_id
        ).first()

        if existing_profile:
            raise HTTPException(
                status_code=400,
                detail="Customer profile already exists"
            )

    new_customer = models.Customer(
        **customer.model_dump(),
        user_id=user_id
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return new_customer


@app.get(
    "/api/customers",
    response_model=list[schemas.CustomerResponse]
)
def get_customers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    return db.query(models.Customer).order_by(
        models.Customer.id.desc()
    ).all()


@app.get(
    "/api/customers/{customer_id}",
    response_model=schemas.CustomerResponse
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return customer


@app.put(
    "/api/customers/{customer_id}",
    response_model=schemas.CustomerResponse
)
def update_customer(
    customer_id: int,
    customer_data: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    update_data = customer_data.model_dump(exclude_unset=True)

    if "email" in update_data:

        existing_customer = db.query(models.Customer).filter(
            models.Customer.email == update_data["email"],
            models.Customer.id != customer_id
        ).first()

        if existing_customer:
            raise HTTPException(
                status_code=400,
                detail="Email already belongs to another customer"
            )

    for key, value in update_data.items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)

    return customer


@app.delete("/api/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    db.delete(customer)
    db.commit()

    return {"message": "Customer deleted successfully"}


# =====================================================
# PAYMENTS CRUD APIs
# JWT AUTHENTICATION ENABLED
# =====================================================

@app.post(
    "/api/payments",
    response_model=schemas.PaymentResponse
)

def create_payment(
    payment: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    if current_user.role not in ["Customer", "Super Admin"]:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to create payments"
        )

    booking = db.query(models.Booking).filter(
        models.Booking.booking_code == payment.booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    # Verify booking ownership
    if current_user.role == "Customer" and booking.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot pay for another customer's booking"
        )

    provider_id = booking.provider_id
    commission_rate = 0
    commission_amount = 0
    provider_earning = 0

    # Commission Calculation
    if payment.status in ["Paid", "Completed"] and provider_id:

        setting = db.query(models.CommissionSetting).order_by(
            models.CommissionSetting.id.desc()
        ).first()

        commission_rate = (
            setting.commission_percentage if setting else 0
        )

        commission_amount = round(
            payment.amount * commission_rate / 100, 2
        )

        provider_earning = round(
            payment.amount - commission_amount, 2
        )

    new_payment = models.Payment(
        payment_code="PAY" + uuid.uuid4().hex[:8].upper(),
        customer=payment.customer,
        booking_id=payment.booking_id,
        user_id=booking.user_id,
        provider_id=provider_id,
        date=payment.date,
        amount=payment.amount,
        method=payment.method,
        status=payment.status,
        commission_rate=commission_rate,
        commission_amount=commission_amount,
        provider_earning=provider_earning
    )

    db.add(new_payment)
    db.flush()

    send_notification(
        db=db,
        user_id=current_user.id,
        title="Payment Created",
        message=(
            f"Payment {new_payment.payment_code} "
            f"of Rs. {new_payment.amount} has been created. "
            f"Current status: {new_payment.status}."
        ),
        notification_type="Payment"
    )

    db.commit()
    db.refresh(new_payment)

    return new_payment

@app.get(
    "/api/payments",
    response_model=list[schemas.PaymentResponse]
)
def get_payments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    return db.query(models.Payment).order_by(
        models.Payment.id.desc()
    ).all()


@app.get(
    "/api/payments/{payment_id}",
    response_model=schemas.PaymentResponse
)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    payment = db.query(models.Payment).filter(
        models.Payment.id == payment_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    return payment


@app.put(
    "/api/payments/{payment_id}",
    response_model=schemas.PaymentResponse
)
@app.put(
    "/api/payments/{payment_id}",
    response_model=schemas.PaymentResponse
)
def update_payment(
    payment_id: int,
    payment_data: schemas.PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    payment = db.query(models.Payment).filter(
        models.Payment.id == payment_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    old_status = payment.status

    update_data = payment_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(payment, key, value)

    if payment.status in ["Paid", "Completed"]:

        booking = db.query(models.Booking).filter(
            models.Booking.booking_code == payment.booking_id
        ).first()

        if booking:
            payment.provider_id = booking.provider_id

        if payment.provider_id:

            setting = db.query(
                models.CommissionSetting
            ).order_by(
                models.CommissionSetting.id.desc()
            ).first()

            commission_rate = (
                setting.commission_percentage if setting else 0
            )

            payment.commission_rate = commission_rate

            payment.commission_amount = round(
                payment.amount * commission_rate / 100, 2
            )

            payment.provider_earning = round(
                payment.amount - payment.commission_amount, 2
            )

    if old_status != payment.status:

        send_notification(
            db=db,
            user_id=current_user.id,
            title="Payment Status Updated",
            message=(
                f"Payment {payment.payment_code} status changed "
                f"from {old_status} to {payment.status}."
            ),
            notification_type="Payment"
        )

    db.commit()
    db.refresh(payment)

    return payment


@app.delete("/api/payments/{payment_id}")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    payment = db.query(models.Payment).filter(
        models.Payment.id == payment_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    db.delete(payment)
    db.commit()

    return {"message": "Payment deleted successfully"}


# =====================================================
# AUTHENTICATION APIs
# =====================================================

@app.post("/api/auth/register")
def register_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email.lower()
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    if user.phone:

        existing_phone = db.query(models.User).filter(
            models.User.phone == user.phone
        ).first()

        if existing_phone:
            raise HTTPException(
                status_code=400,
                detail="Phone number already registered"
            )

    allowed_roles = [
        "Customer",
        "Service Provider",
        "Technician"
    ]

    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    hashed_password = password_hash.hash(user.password)

    # Customer and Service Provider can login.
    # Provider verification is handled separately.
    account_status = (
        "Active"
        if user.role in ["Customer", "Service Provider"]
        else "Pending"
    )

    new_user = models.User(
        full_name=user.full_name,
        email=user.email.lower(),
        phone=user.phone,
        hashed_password=hashed_password,
        role=user.role,
        status=account_status
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automatically create pending provider profile
    if user.role == "Service Provider":

        new_provider = models.ServiceProvider(
            user_id=new_user.id,
            business_name=new_user.full_name,
            city="Not Provided",
            verification_status="Pending"
        )

        db.add(new_provider)
        db.commit()

    return {
        "message": "Registration successful",
        "user": schemas.UserResponse.model_validate(new_user)
    }


@app.post("/api/auth/login")
def login_user(
    user: schemas.UserLogin,
    db: Session = Depends(get_db)
):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email.lower()
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not password_hash.verify(
        user.password,
        existing_user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if existing_user.status != "Active":
        raise HTTPException(
            status_code=403,
            detail="Your account is pending admin verification"
        )

    access_token = create_access_token({
        "sub": str(existing_user.id),
        "role": existing_user.role
    })

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": schemas.UserResponse.model_validate(existing_user)
    }


@app.get("/api/auth/me")
def get_logged_in_user(
    current_user: models.User = Depends(get_current_user)
):

    return {
        "message": "Authentication successful",
        "user": schemas.UserResponse.model_validate(current_user)
    }


# =====================================================
# SERVICE PROVIDER MANAGEMENT APIs
# =====================================================

# CREATE / COMPLETE PROVIDER PROFILE

@app.post(
    "/api/providers",
    response_model=schemas.ProviderResponse
)
def create_provider_profile(
    provider: schemas.ProviderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Service Provider"])
    )
):

    if provider.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only create your own provider profile"
        )

    existing_provider = db.query(
        models.ServiceProvider
    ).filter(
        models.ServiceProvider.user_id == current_user.id
    ).first()

    if existing_provider:

        raise HTTPException(
            status_code=400,
            detail="Provider profile already exists"
        )

    new_provider = models.ServiceProvider(
        **provider.model_dump(),
        verification_status="Pending"
    )

    db.add(new_provider)
    db.commit()
    db.refresh(new_provider)

    return new_provider


# GET OWN PROVIDER PROFILE

@app.get(
    "/api/providers/me",
    response_model=schemas.ProviderResponse
)
def get_my_provider_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Service Provider"])
    )
):

    provider = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.user_id == current_user.id
    ).first()

    if not provider:
        raise HTTPException(
            status_code=404,
            detail="Provider profile not found"
        )

    return provider


# UPDATE OWN PROVIDER PROFILE

@app.put(
    "/api/providers/me",
    response_model=schemas.ProviderResponse
)
def update_my_provider_profile(
    provider_data: schemas.ProviderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Service Provider"])
    )
):

    provider = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.user_id == current_user.id
    ).first()

    if not provider:
        raise HTTPException(
            status_code=404,
            detail="Provider profile not found"
        )

    update_data = provider_data.model_dump(exclude_unset=True)

    # Provider cannot change verification status or rejection reason
    update_data.pop("verification_status", None)
    update_data.pop("rejection_reason", None)

    for key, value in update_data.items():
        setattr(provider, key, value)

    db.commit()
    db.refresh(provider)

    return provider


# ADMIN - GET ALL PROVIDERS

@app.get(
    "/api/providers",
    response_model=list[schemas.ProviderResponse]
)
def get_all_providers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    return db.query(models.ServiceProvider).order_by(
        models.ServiceProvider.id.desc()
    ).all()


# ADMIN - GET SINGLE PROVIDER

@app.get(
    "/api/providers/{provider_id}",
    response_model=schemas.ProviderResponse
)
def get_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    provider = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.id == provider_id
    ).first()

    if not provider:
        raise HTTPException(
            status_code=404,
            detail="Service Provider not found"
        )

    return provider


# ADMIN - APPROVE PROVIDER

@app.put(
    "/api/providers/{provider_id}/approve",
    response_model=schemas.ProviderResponse
)
def approve_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    provider = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.id == provider_id
    ).first()

    if not provider:
        raise HTTPException(
            status_code=404,
            detail="Service Provider not found"
        )

    provider.verification_status = "Approved"
    provider.rejection_reason = None

    db.commit()
    db.refresh(provider)

    return provider


# ADMIN - REJECT PROVIDER

@app.put(
    "/api/providers/{provider_id}/reject"
)
def reject_provider(
    provider_id: int,
    rejection_reason: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    provider = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.id == provider_id
    ).first()

    if not provider:
        raise HTTPException(
            status_code=404,
            detail="Service Provider not found"
        )

    provider.verification_status = "Rejected"
    provider.rejection_reason = rejection_reason

    db.commit()
    db.refresh(provider)

    return {
        "message": "Service Provider rejected successfully",
        "provider_id": provider.id,
        "verification_status": provider.verification_status,
        "rejection_reason": provider.rejection_reason
    }


# ADMIN - DELETE PROVIDER

@app.delete("/api/providers/{provider_id}")
def delete_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    provider = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.id == provider_id
    ).first()

    if not provider:
        raise HTTPException(
            status_code=404,
            detail="Service Provider not found"
        )

    db.delete(provider)
    db.commit()

    return {
        "message": "Service Provider deleted successfully"
    }
# =====================================================
# TECHNICIAN MANAGEMENT APIs
# =====================================================

# CREATE TECHNICIAN PROFILE

@app.post(
    "/api/technicians",
    response_model=schemas.TechnicianResponse
)
def create_technician(
    technician: schemas.TechnicianCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin", "Service Provider"])
    )
):

    technician_user = db.query(models.User).filter(
        models.User.id == technician.user_id,
        models.User.role == "Technician"
    ).first()

    if not technician_user:
        raise HTTPException(
            status_code=404,
            detail="Technician user not found"
        )

    existing = db.query(models.Technician).filter(
        models.Technician.user_id == technician.user_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Technician profile already exists"
        )

    provider_id = technician.provider_id

    if current_user.role == "Service Provider":

        provider = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.user_id == current_user.id
        ).first()

        if not provider:
            raise HTTPException(
                status_code=404,
                detail="Provider profile not found"
            )

        if provider.verification_status != "Approved":
            raise HTTPException(
                status_code=403,
                detail="Your provider account is not approved"
            )

        provider_id = provider.id

    elif provider_id is not None:

        provider = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.id == provider_id
        ).first()

        if not provider:
            raise HTTPException(
                status_code=404,
                detail="Provider not found"
            )

    new_technician = models.Technician(
        user_id=technician.user_id,
        provider_id=provider_id,
        skills=technician.skills,
        experience=technician.experience,
        availability=technician.availability,
        status=technician.status
    )

    technician_user.status = "Active"

    db.add(new_technician)
    db.commit()
    db.refresh(new_technician)

    return new_technician


# GET ALL TECHNICIANS

@app.get(
    "/api/technicians",
    response_model=list[schemas.TechnicianResponse]
)
def get_technicians(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin", "Service Provider"])
    )
):

    query = db.query(models.Technician)

    if current_user.role == "Service Provider":

        provider = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.user_id == current_user.id
        ).first()

        if not provider:
            raise HTTPException(
                status_code=404,
                detail="Provider profile not found"
            )

        query = query.filter(
            models.Technician.provider_id == provider.id
        )

    return query.order_by(
        models.Technician.id.desc()
    ).all()


# GET SINGLE TECHNICIAN

@app.get(
    "/api/technicians/{technician_id}",
    response_model=schemas.TechnicianResponse
)
def get_technician(
    technician_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    technician = db.query(models.Technician).filter(
        models.Technician.id == technician_id
    ).first()

    if not technician:
        raise HTTPException(
            status_code=404,
            detail="Technician not found"
        )

    if current_user.role == "Service Provider":

        provider = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.user_id == current_user.id
        ).first()

        if not provider or technician.provider_id != provider.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

    elif current_user.role == "Technician":

        if technician.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

    elif current_user.role != "Super Admin":

        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return technician


# UPDATE TECHNICIAN

@app.put(
    "/api/technicians/{technician_id}",
    response_model=schemas.TechnicianResponse
)
def update_technician(
    technician_id: int,
    technician_data: schemas.TechnicianUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin", "Service Provider"])
    )
):

    technician = db.query(models.Technician).filter(
        models.Technician.id == technician_id
    ).first()

    if not technician:
        raise HTTPException(
            status_code=404,
            detail="Technician not found"
        )

    if current_user.role == "Service Provider":

        provider = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.user_id == current_user.id
        ).first()

        if not provider or technician.provider_id != provider.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

        if technician_data.provider_id is not None:
            raise HTTPException(
                status_code=403,
                detail="Provider assignment cannot be changed here"
            )

    update_data = technician_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(technician, key, value)

    db.commit()
    db.refresh(technician)

    return technician


# DELETE TECHNICIAN

@app.delete("/api/technicians/{technician_id}")
def delete_technician(
    technician_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin", "Service Provider"])
    )
):

    technician = db.query(models.Technician).filter(
        models.Technician.id == technician_id
    ).first()

    if not technician:
        raise HTTPException(
            status_code=404,
            detail="Technician not found"
        )

    if current_user.role == "Service Provider":

        provider = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.user_id == current_user.id
        ).first()

        if not provider or technician.provider_id != provider.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

    technician_user = db.query(models.User).filter(
        models.User.id == technician.user_id
    ).first()

    if technician_user:
        technician_user.status = "Pending"

    db.delete(technician)
    db.commit()

    return {
        "message": "Technician deleted successfully"
    }


# =====================================================
# TECHNICIAN JOB ASSIGNMENT APIs
# =====================================================

# ASSIGN BOOKING TO TECHNICIAN

@app.post(
    "/api/technician-jobs",
    response_model=schemas.TechnicianJobResponse
)
def assign_technician_job(
    job: schemas.TechnicianJobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin", "Service Provider"])
    )
):

    technician = db.query(models.Technician).filter(
        models.Technician.id == job.technician_id
    ).first()

    if not technician:
        raise HTTPException(
            status_code=404,
            detail="Technician not found"
        )

    booking = db.query(models.Booking).filter(
        models.Booking.id == job.booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if technician.status != "Active":
        raise HTTPException(
            status_code=400,
            detail="Technician is not active"
        )

    if technician.availability != "Available":
        raise HTTPException(
            status_code=400,
            detail="Technician is not available"
        )

    if current_user.role == "Service Provider":

        provider = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.user_id == current_user.id
        ).first()

        if not provider or technician.provider_id != provider.id:
            raise HTTPException(
                status_code=403,
                detail="You cannot assign this technician"
            )

    existing_job = db.query(models.TechnicianJob).filter(
        models.TechnicianJob.booking_id == job.booking_id,
        models.TechnicianJob.job_status.notin_(
            ["Completed", "Cancelled"]
        )
    ).first()

    if existing_job:
        raise HTTPException(
            status_code=400,
            detail="Booking already has an active technician assignment"
        )

    new_job = models.TechnicianJob(
        technician_id=job.technician_id,
        booking_id=job.booking_id
    )

    technician.availability = "Busy"
    booking.status = "Assigned"

    db.add(new_job)

    # Notify assigned technician
    send_notification(
        db=db,
        user_id=technician.user_id,
        title="New Job Assigned",
        message=(
            f"You have been assigned booking {booking.booking_code} "
            f"for service {booking.service}."
        ),
        notification_type="Technician Job"
    )

    # Notify the user who created the assignment
    send_notification(
        db=db,
        user_id=current_user.id,
        title="Technician Assigned",
        message=(
            f"Technician has been assigned to booking "
            f"{booking.booking_code}."
        ),
        notification_type="Technician Job"
    )

    db.commit()
    db.refresh(new_job)

    return new_job


# GET TECHNICIAN JOBS

@app.get(
    "/api/technician-jobs",
    response_model=list[schemas.TechnicianJobResponse]
)
def get_technician_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    query = db.query(models.TechnicianJob)

    if current_user.role == "Technician":

        technician = db.query(models.Technician).filter(
            models.Technician.user_id == current_user.id
        ).first()

        if not technician:
            raise HTTPException(
                status_code=404,
                detail="Technician profile not found"
            )

        query = query.filter(
            models.TechnicianJob.technician_id == technician.id
        )

    elif current_user.role == "Service Provider":

        provider = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.user_id == current_user.id
        ).first()

        if not provider:
            raise HTTPException(
                status_code=404,
                detail="Provider profile not found"
            )

        technician_ids = db.query(
            models.Technician.id
        ).filter(
            models.Technician.provider_id == provider.id
        ).subquery()

        query = query.filter(
            models.TechnicianJob.technician_id.in_(technician_ids)
        )

    elif current_user.role != "Super Admin":

        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return query.order_by(
        models.TechnicianJob.id.desc()
    ).all()


# UPDATE TECHNICIAN JOB STATUS

@app.put(
    "/api/technician-jobs/{job_id}",
    response_model=schemas.TechnicianJobResponse
)
def update_technician_job(
    job_id: int,
    job_data: schemas.TechnicianJobUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    job = db.query(models.TechnicianJob).filter(
        models.TechnicianJob.id == job_id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Technician job not found"
        )

    technician = db.query(models.Technician).filter(
        models.Technician.id == job.technician_id
    ).first()

    if current_user.role == "Technician":

        if not technician or technician.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

    elif current_user.role == "Service Provider":

        provider = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.user_id == current_user.id
        ).first()

        if not provider or not technician or technician.provider_id != provider.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

    elif current_user.role != "Super Admin":

        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    old_status = job.job_status

    update_data = job_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(job, key, value)

    booking = db.query(models.Booking).filter(
        models.Booking.id == job.booking_id
    ).first()

    if job.job_status == "Completed":

        job.completed_at = datetime.now(timezone.utc)

        if technician:
            technician.availability = "Available"

        if booking:
            booking.status = "Completed"

    elif job.job_status == "Cancelled":

        if technician:
            technician.availability = "Available"

        if booking:
            booking.status = "Cancelled"

    # Notify the other party when job status changes
    if old_status != job.job_status:

        if current_user.role == "Technician":

            provider = None

            if technician and technician.provider_id:
                provider = db.query(models.ServiceProvider).filter(
                    models.ServiceProvider.id == technician.provider_id
                ).first()

            if provider:

                send_notification(
                    db=db,
                    user_id=provider.user_id,
                    title="Technician Job Status Updated",
                    message=(
                        f"Technician updated booking "
                        f"{booking.booking_code if booking else job.booking_id} "
                        f"status to {job.job_status}."
                    ),
                    notification_type="Technician Job"
                )

        elif technician:

            send_notification(
                db=db,
                user_id=technician.user_id,
                title="Job Status Updated",
                message=(
                    f"Your assigned job status has been changed "
                    f"to {job.job_status}."
                ),
                notification_type="Technician Job"
            )

    db.commit()
    db.refresh(job)

    return job
# ================= NOTIFICATION APIs =================


# CREATE NOTIFICATION - SUPER ADMIN
@app.post("/api/notifications", response_model=schemas.NotificationResponse)
def create_notification(
    notification: schemas.NotificationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(role_required(["Super Admin"]))
):
    user = db.query(models.User).filter(
        models.User.id == notification.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    new_notification = models.Notification(
        user_id=notification.user_id,
        title=notification.title,
        message=notification.message,
        notification_type=notification.notification_type,
        is_read="Unread"
    )

    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    return new_notification


# GET NOTIFICATIONS - LOGGED IN USER
@app.get("/api/notifications", response_model=list[schemas.NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(
        models.Notification.created_at.desc()
    ).all()


# MARK NOTIFICATION AS READ
@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = "Read"

    db.commit()

    return {
        "message": "Notification marked as read"
    }


# DELETE NOTIFICATION - SUPER ADMIN
@app.delete("/api/notifications/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(role_required(["Super Admin"]))
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return {
        "message": "Notification deleted successfully"
    }
# ================= REVIEW APIs =================


# CREATE REVIEW
@app.post("/api/reviews", response_model=schemas.ReviewResponse)
def create_review(
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5"
        )

    provider = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.id == review.provider_id
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    booking = db.query(models.Booking).filter(
        models.Booking.id == review.booking_id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    new_review = models.Review(
        user_id=current_user.id,
        provider_id=review.provider_id,
        booking_id=review.booking_id,
        rating=review.rating,
        comment=review.comment
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return new_review


# GET ALL REVIEWS OR FILTER BY PROVIDER
@app.get("/api/reviews", response_model=list[schemas.ReviewResponse])
def get_reviews(
    provider_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Review)

    if provider_id is not None:
        query = query.filter(
            models.Review.provider_id == provider_id
        )

    return query.order_by(
        models.Review.created_at.desc()
    ).all()


# GET PROVIDER AVERAGE RATING
@app.get("/api/providers/{provider_id}/rating")
def get_provider_rating(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from sqlalchemy import func

    result = db.query(
        func.avg(models.Review.rating),
        func.count(models.Review.id)
    ).filter(
        models.Review.provider_id == provider_id
    ).first()

    return {
        "provider_id": provider_id,
        "average_rating": round(float(result[0] or 0), 2),
        "total_reviews": result[1]
    }


# ================= COMPLAINT APIs =================


# CREATE COMPLAINT
@app.post("/api/complaints", response_model=schemas.ComplaintResponse)
def create_complaint(
    complaint: schemas.ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if complaint.booking_id is not None:
        booking = db.query(models.Booking).filter(
            models.Booking.id == complaint.booking_id
        ).first()

        if not booking:
            raise HTTPException(
                status_code=404,
                detail="Booking not found"
            )

    new_complaint = models.Complaint(
        user_id=current_user.id,
        booking_id=complaint.booking_id,
        subject=complaint.subject,
        description=complaint.description,
        status="Open"
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return new_complaint


# GET COMPLAINTS
@app.get("/api/complaints", response_model=list[schemas.ComplaintResponse])
def get_complaints(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Complaint)

    if current_user.role != "Super Admin":
        query = query.filter(
            models.Complaint.user_id == current_user.id
        )

    return query.order_by(
        models.Complaint.created_at.desc()
    ).all()


# UPDATE COMPLAINT - SUPER ADMIN ONLY
@app.put("/api/complaints/{complaint_id}",
         response_model=schemas.ComplaintResponse)
def update_complaint(
    complaint_id: int,
    complaint: schemas.ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(role_required(["Super Admin"]))
):
    existing_complaint = db.query(models.Complaint).filter(
        models.Complaint.id == complaint_id
    ).first()

    if not existing_complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    existing_complaint.status = complaint.status
    existing_complaint.admin_response = complaint.admin_response

    db.commit()
    db.refresh(existing_complaint)

    return existing_complaint


# DELETE COMPLAINT - SUPER ADMIN ONLY
@app.delete("/api/complaints/{complaint_id}")
def delete_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(role_required(["Super Admin"]))
):
    complaint = db.query(models.Complaint).filter(
        models.Complaint.id == complaint_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    db.delete(complaint)
    db.commit()

    return {"message": "Complaint deleted successfully"}
# =====================================================
# ANALYTICS & REPORTING APIs
# SUPER ADMIN ONLY
# =====================================================

@app.get("/api/analytics/overview")

def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    from sqlalchemy import func

    # ================= TOTAL COUNTS =================

    total_customers = db.query(models.Customer).count()

    total_providers = db.query(models.ServiceProvider).count()

    total_technicians = db.query(models.Technician).count()

    total_services = db.query(models.Service).count()

    total_bookings = db.query(models.Booking).count()

    # ================= BOOKING STATUS =================

    pending_bookings = db.query(models.Booking).filter(
        models.Booking.status == "Pending"
    ).count()

    completed_bookings = db.query(models.Booking).filter(
        models.Booking.status == "Completed"
    ).count()

    cancelled_bookings = db.query(models.Booking).filter(
        models.Booking.status == "Cancelled"
    ).count()

    # ================= PROVIDER STATUS =================

    approved_providers = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.verification_status == "Approved"
    ).count()

    pending_providers = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.verification_status == "Pending"
    ).count()

    rejected_providers = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.verification_status == "Rejected"
    ).count()

    # ================= PAYMENT ANALYTICS =================

    paid_statuses = ["Paid", "Completed"]

    total_payments = db.query(models.Payment).count()

    pending_payments = db.query(models.Payment).filter(
        models.Payment.status == "Pending"
    ).count()

    completed_payments = db.query(models.Payment).filter(
        models.Payment.status.in_(paid_statuses)
    ).count()

    total_revenue = db.query(
        func.sum(models.Payment.amount)
    ).filter(
        models.Payment.status.in_(paid_statuses)
    ).scalar() or 0

    total_commission = db.query(
        func.sum(models.Payment.commission_amount)
    ).filter(
        models.Payment.status.in_(paid_statuses)
    ).scalar() or 0

    total_provider_earnings = db.query(
        func.sum(models.Payment.provider_earning)
    ).filter(
        models.Payment.status.in_(paid_statuses)
    ).scalar() or 0

    # ================= CUSTOMER ANALYTICS =================

    total_reviews = db.query(models.Review).count()

    average_rating = db.query(
        func.avg(models.Review.rating)
    ).scalar() or 0

    total_complaints = db.query(models.Complaint).count()

    open_complaints = db.query(models.Complaint).filter(
        models.Complaint.status == "Open"
    ).count()

    # ================= PROVIDER PERFORMANCE =================

    providers = db.query(models.ServiceProvider).all()

    provider_performance = []

    for provider in providers:

        user = db.query(models.User).filter(
            models.User.id == provider.user_id
        ).first()

        rating_result = db.query(
            func.avg(models.Review.rating),
            func.count(models.Review.id)
        ).filter(
            models.Review.provider_id == provider.id
        ).first()

        provider_performance.append({

            "provider_id": provider.id,

            "business_name": provider.business_name,

            "owner_name": user.full_name if user else "Unknown",

            "city": provider.city,

            "verification_status": provider.verification_status,

            "average_rating": round(
                float(rating_result[0] or 0), 2
            ),

            "total_reviews": rating_result[1]

        })

    # ================= FINAL RESPONSE =================

    return {

        "customers": {
            "total": total_customers
        },

        "providers": {
            "total": total_providers,
            "approved": approved_providers,
            "pending": pending_providers,
            "rejected": rejected_providers
        },

        "technicians": {
            "total": total_technicians
        },

        "services": {
            "total": total_services
        },

        "bookings": {
            "total": total_bookings,
            "pending": pending_bookings,
            "completed": completed_bookings,
            "cancelled": cancelled_bookings
        },

        "payments": {
            "total": total_payments,
            "pending": pending_payments,
            "completed": completed_payments
        },

        "revenue": {
            "total_revenue": round(float(total_revenue), 2),
            "total_commission": round(float(total_commission), 2),
            "provider_earnings": round(
                float(total_provider_earnings), 2
            )
        },

        "reviews": {
            "total": total_reviews,
            "average_rating": round(float(average_rating), 2)
        },

        "complaints": {
            "total": total_complaints,
            "open": open_complaints
        },

        "provider_performance": provider_performance

    }# ================= INVOICE MANAGEMENT =================

@app.post("/api/invoices", response_model=schemas.InvoiceResponse)
def create_invoice(
    invoice: schemas.InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    payment = db.query(models.Payment).filter(
        models.Payment.id == invoice.payment_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    existing_invoice = db.query(models.Invoice).filter(
        models.Invoice.payment_id == invoice.payment_id
    ).first()

    if existing_invoice:
        raise HTTPException(
            status_code=400,
            detail="Invoice already generated for this payment"
        )

    if invoice.discount < 0 or invoice.tax < 0:
        raise HTTPException(
            status_code=400,
            detail="Discount and tax cannot be negative"
        )

    calculated_total = round(
        invoice.subtotal - invoice.discount + invoice.tax, 2
    )

    if invoice.subtotal < 0 or calculated_total < 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid invoice amount"
        )

    new_invoice = models.Invoice(
        invoice_number="INV-" + uuid.uuid4().hex[:10].upper(),
        payment_id=invoice.payment_id,
        booking_id=invoice.booking_id,
        customer_name=invoice.customer_name,
        service_name=invoice.service_name,
        subtotal=invoice.subtotal,
        discount=invoice.discount,
        tax=invoice.tax,
        total_amount=calculated_total,
        status="Generated"
    )

    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)

    return new_invoice


@app.get("/api/invoices", response_model=list[schemas.InvoiceResponse])
def get_invoices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    return db.query(models.Invoice).order_by(
        models.Invoice.id.desc()
    ).all()


@app.get("/api/invoices/{invoice_id}", response_model=schemas.InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == invoice_id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found"
        )

    return invoice


@app.put("/api/invoices/{invoice_id}/status")
def update_invoice_status(
    invoice_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == invoice_id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found"
        )

    allowed_statuses = ["Generated", "Paid", "Cancelled"]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid invoice status"
        )

    invoice.status = status

    db.commit()
    db.refresh(invoice)

    return {
        "message": "Invoice status updated successfully",
        "invoice": invoice
    }


@app.delete("/api/invoices/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == invoice_id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found"
        )

    db.delete(invoice)
    db.commit()

    return {
        "message": "Invoice deleted successfully"
    }
# =====================================================
# COMMISSION SETTINGS APIs
# =====================================================

# GET COMMISSION SETTINGS - SUPER ADMIN

@app.get("/api/commission")
def get_commission_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    setting = db.query(
        models.CommissionSetting
    ).order_by(
        models.CommissionSetting.id.desc()
    ).first()

    if not setting:
        setting = models.CommissionSetting(
            commission_percentage=0
        )

        db.add(setting)
        db.commit()
        db.refresh(setting)

    return setting


# UPDATE COMMISSION SETTINGS - SUPER ADMIN

@app.put("/api/commission")
def update_commission_settings(
    data: schemas.CommissionSettingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    setting = db.query(
        models.CommissionSetting
    ).order_by(
        models.CommissionSetting.id.desc()
    ).first()

    if not setting:
        setting = models.CommissionSetting(
            commission_percentage=data.commission_percentage
        )

        db.add(setting)

    else:
        setting.commission_percentage = data.commission_percentage

    db.commit()
    db.refresh(setting)

    return {
        "message": "Commission percentage updated successfully",
        "commission_percentage": setting.commission_percentage
    }


# =====================================================
# TOTAL COMMISSION ANALYTICS - SUPER ADMIN
# =====================================================

@app.get("/api/analytics/commission")
def get_commission_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    from sqlalchemy import func

    paid_statuses = ["Paid", "Completed"]

    total_revenue = db.query(
        func.sum(models.Payment.amount)
    ).filter(
        models.Payment.status.in_(paid_statuses)
    ).scalar() or 0

    total_commission = db.query(
        func.sum(models.Payment.commission_amount)
    ).filter(
        models.Payment.status.in_(paid_statuses)
    ).scalar() or 0

    total_provider_earnings = db.query(
        func.sum(models.Payment.provider_earning)
    ).filter(
        models.Payment.status.in_(paid_statuses)
    ).scalar() or 0

    return {
        "total_revenue": round(float(total_revenue), 2),
        "total_commission": round(float(total_commission), 2),
        "total_provider_earnings": round(
            float(total_provider_earnings), 2
        )
    }


# =====================================================
# SERVICE PROVIDER EARNINGS
# =====================================================

@app.get("/api/provider/earnings")
def get_provider_earnings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Service Provider"])
    )
):

    from sqlalchemy import func

    provider = db.query(models.ServiceProvider).filter(
        models.ServiceProvider.user_id == current_user.id
    ).first()

    if not provider:
        raise HTTPException(
            status_code=404,
            detail="Provider profile not found"
        )

    paid_statuses = ["Paid", "Completed"]

    payments = db.query(models.Payment).filter(
        models.Payment.provider_id == provider.id,
        models.Payment.status.in_(paid_statuses)
    ).all()

    total_revenue = sum(p.amount for p in payments)
    total_commission = sum(
        p.commission_amount or 0 for p in payments
    )
    total_earnings = sum(
        p.provider_earning or 0 for p in payments
    )

    return {
        "provider_id": provider.id,
        "total_revenue": round(total_revenue, 2),
        "total_commission": round(total_commission, 2),
        "total_earnings": round(total_earnings, 2),
        "total_payments": len(payments)
    }

# ==========================================
# MODULE 10 - ANALYTICS & REPORTING
# ==========================================


# 1. BOOKING ANALYTICS

@app.get("/api/analytics/bookings")
def booking_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    total = db.query(models.Booking).count()

    pending = db.query(models.Booking).filter(
        models.Booking.status == "Pending"
    ).count()

    completed = db.query(models.Booking).filter(
        models.Booking.status == "Completed"
    ).count()

    cancelled = db.query(models.Booking).filter(
        models.Booking.status == "Cancelled"
    ).count()

    return {
        "total_bookings": total,
        "pending": pending,
        "completed": completed,
        "cancelled": cancelled
    }


# 2. REVENUE & PAYMENT ANALYTICS

@app.get("/api/analytics/revenue")
def revenue_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    payments = db.query(models.Payment)

    total_payments = payments.count()

    completed_payments = payments.filter(
        models.Payment.status.in_(["Completed", "Paid"])
    )

    pending_payments = payments.filter(
        models.Payment.status == "Pending"
    ).count()

    total_revenue = db.query(
        func.coalesce(
            func.sum(models.Payment.amount), 0
        )
    ).filter(
        models.Payment.status.in_(["Completed", "Paid"])
    ).scalar()

    total_commission = db.query(
        func.coalesce(
            func.sum(models.Payment.commission_amount), 0
        )
    ).filter(
        models.Payment.status.in_(["Completed", "Paid"])
    ).scalar()

    provider_earnings = db.query(
        func.coalesce(
            func.sum(models.Payment.provider_earning), 0
        )
    ).filter(
        models.Payment.status.in_(["Completed", "Paid"])
    ).scalar()

    return {
        "total_payments": total_payments,
        "completed_payments": completed_payments.count(),
        "pending_payments": pending_payments,
        "total_revenue": float(total_revenue or 0),
        "total_commission": float(total_commission or 0),
        "provider_earnings": float(provider_earnings or 0)
    }


# 3. MONTHLY REVENUE ANALYTICS

@app.get("/api/analytics/monthly-revenue")
def monthly_revenue_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    results = db.query(
        extract("year", models.Payment.date).label("year"),
        extract("month", models.Payment.date).label("month"),
        func.sum(models.Payment.amount).label("revenue"),
        func.count(models.Payment.id).label("total_payments")
    ).filter(
        models.Payment.status.in_(["Completed", "Paid"])
    ).group_by(
        extract("year", models.Payment.date),
        extract("month", models.Payment.date)
    ).order_by(
        extract("year", models.Payment.date),
        extract("month", models.Payment.date)
    ).all()

    return [
        {
            "year": int(row.year),
            "month": int(row.month),
            "revenue": float(row.revenue or 0),
            "total_payments": row.total_payments
        }
        for row in results
    ]


# 4. PROVIDER EARNINGS REPORT

@app.get("/api/analytics/provider-earnings")
def provider_earnings_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    results = db.query(
        models.ServiceProvider.id,
        models.ServiceProvider.business_name,
        func.coalesce(
            func.sum(models.Payment.provider_earning), 0
        ).label("total_earnings"),
        func.count(models.Payment.id).label("total_payments")
    ).outerjoin(
        models.Payment,
        models.Payment.provider_id == models.ServiceProvider.id
    ).group_by(
        models.ServiceProvider.id,
        models.ServiceProvider.business_name
    ).all()

    return [
        {
            "provider_id": row.id,
            "business_name": row.business_name,
            "total_earnings": float(row.total_earnings or 0),
            "total_payments": row.total_payments
        }
        for row in results
    ]


# 5. SERVICE-WISE BOOKING REPORT

@app.get("/api/analytics/services")
def service_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    results = db.query(
        models.Service.name,
        models.Service.category,
        func.count(models.Booking.id).label("total_bookings")
    ).outerjoin(
        models.Booking,
        models.Booking.service == models.Service.name
    ).group_by(
        models.Service.id,
        models.Service.name,
        models.Service.category
    ).all()

    return [
        {
            "service": row.name,
            "category": row.category,
            "total_bookings": row.total_bookings
        }
        for row in results
    ]


# 6. DATE-WISE BOOKING REPORT

@app.get("/api/analytics/date-report")
def date_wise_analytics(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    bookings = db.query(
        models.Booking.date,
        func.count(models.Booking.id).label("total_bookings")
    ).filter(
        models.Booking.date >= start_date,
        models.Booking.date <= end_date
    ).group_by(
        models.Booking.date
    ).order_by(
        models.Booking.date
    ).all()

    payments = db.query(
        models.Payment.date,
        func.sum(models.Payment.amount).label("revenue")
    ).filter(
        models.Payment.date >= start_date,
        models.Payment.date <= end_date,
        models.Payment.status.in_(["Completed", "Paid"])
    ).group_by(
        models.Payment.date
    ).order_by(
        models.Payment.date
    ).all()

    revenue_map = {
        row.date: float(row.revenue or 0)
        for row in payments
    }

    return [
        {
            "date": str(row.date),
            "total_bookings": row.total_bookings,
            "revenue": revenue_map.get(row.date, 0)
        }
        for row in bookings
    ]


# 7. PROVIDER PERFORMANCE REPORT

@app.get("/api/analytics/provider-performance")
def provider_performance_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        role_required(["Super Admin"])
    )
):

    providers = db.query(
        models.ServiceProvider
    ).all()

    result = []

    for provider in providers:

        owner = db.query(models.User).filter(
            models.User.id == provider.user_id
        ).first()

        rating = db.query(
            func.avg(models.Review.rating)
        ).filter(
            models.Review.provider_id == provider.id
        ).scalar()

        review_count = db.query(
            models.Review
        ).filter(
            models.Review.provider_id == provider.id
        ).count()

        booking_count = db.query(
            models.Booking
        ).filter(
            models.Booking.provider_id == provider.id
        ).count()

        result.append({
            "provider_id": provider.id,
            "business_name": provider.business_name,
            "owner_name": owner.full_name if owner else "",
            "city": provider.city,
            "verification_status": provider.verification_status,
            "average_rating": round(float(rating or 0), 2),
            "total_reviews": review_count,
            "total_bookings": booking_count
        })

    return result