from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Date,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func
from database import Base


# ==========================
# SERVICE MODEL
# ==========================

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    duration = Column(String(50))
    status = Column(String(20), default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==========================
# USER MODEL
# ==========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="Customer")
    status = Column(String(20), default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==========================
# SERVICE PROVIDER MODEL
# ==========================

class ServiceProvider(Base):
    __tablename__ = "service_providers"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    business_name = Column(String(150), nullable=False)
    description = Column(Text)
    address = Column(Text)
    city = Column(String(100), nullable=False)
    service_areas = Column(Text)
    document_url = Column(String(255))

    verification_status = Column(String(30), default="Pending")
    rejection_reason = Column(Text)
    base_price = Column(Float, default=0)
    working_hours = Column(String(150))
    availability = Column(String(30), default="Available")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==========================
# BOOKING MODEL
# ==========================

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_code = Column(String(50), unique=True, index=True)

    customer = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    service = Column(String(100), nullable=False)
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=True)

    date = Column(Date, nullable=False)

    time_slot = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    reference_image_url = Column(String(255), nullable=True)

    amount = Column(Float, nullable=False)
    status = Column(String(50), default="Pending")

    created_at = Column(DateTime, server_default=func.now())
# ==========================
# CUSTOMER MODEL
# ==========================

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
    Integer,
    ForeignKey("users.id"),
    nullable=True
)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    phone = Column(String(20), nullable=False)
    city = Column(String(100), nullable=False)
    status = Column(String(20), default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==========================
# PAYMENT MODEL
# ==========================

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_code = Column(String(30), unique=True, nullable=False)
    customer = Column(String(100), nullable=False)
    booking_id = Column(String(30), nullable=False)
    user_id = Column(
    Integer,
    ForeignKey("users.id"),
    nullable=True
)
    provider_id = Column(
        Integer,
        ForeignKey("service_providers.id"),
        nullable=True
    )

    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    method = Column(String(50), nullable=False)
    status = Column(String(30), default="Pending")

    commission_rate = Column(Float, default=0)
    commission_amount = Column(Float, default=0)
    provider_earning = Column(Float, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==========================
# COMMISSION SETTING MODEL
# ==========================

class CommissionSetting(Base):
    __tablename__ = "commission_settings"

    id = Column(Integer, primary_key=True, index=True)

    commission_percentage = Column(Float, nullable=False, default=0)

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


# ==========================
# TECHNICIAN MODEL
# ==========================

class Technician(Base):
    __tablename__ = "technicians"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    provider_id = Column(
        Integer,
        ForeignKey("service_providers.id"),
        nullable=True
    )

    skills = Column(Text)
    experience = Column(Integer, default=0)
    availability = Column(String(30), default="Available")
    status = Column(String(30), default="Active")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==========================
# TECHNICIAN JOB MODEL
# ==========================
# ==========================
# TECHNICIAN JOB MODEL
# ==========================

class TechnicianJob(Base):
    __tablename__ = "technician_jobs"

    id = Column(Integer, primary_key=True, index=True)

    technician_id = Column(
        Integer,
        ForeignKey("technicians.id"),
        nullable=False
    )

    booking_id = Column(
        Integer,
        ForeignKey("bookings.id"),
        nullable=False
    )

    job_status = Column(String(30), default="Assigned")
    arrival_status = Column(String(30), default="Not Arrived")
    remarks = Column(Text)
    completion_image_url = Column(String(255))

    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))


# ==========================
# NOTIFICATION MODEL
# ==========================# ==========================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="General")
    is_read = Column(String(10), default="Unread")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==========================
# REVIEW MODEL
# ==========================

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    provider_id = Column(
        Integer,
        ForeignKey("service_providers.id"),
        nullable=False
    )

    booking_id = Column(
        Integer,
        ForeignKey("bookings.id"),
        nullable=False
    )

    rating = Column(Integer, nullable=False)
    comment = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==========================
# INVOICE MODEL
# ==========================

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    booking_id = Column(String(30), nullable=False)
    customer_name = Column(String(100), nullable=False)
    service_name = Column(String(100), nullable=False)
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0)
    tax = Column(Float, default=0)
    total_amount = Column(Float, nullable=False)
    status = Column(String(30), default="Generated")

    issued_at = Column(DateTime(timezone=True), server_default=func.now())
# ==========================
# COMPLAINT MODEL
# ==========================

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    booking_id = Column(
        Integer,
        ForeignKey("bookings.id"),
        nullable=True
    )

    subject = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(30), default="Open")
    admin_response = Column(Text)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )