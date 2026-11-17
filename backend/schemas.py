from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import date, datetime


# ==========================
# SERVICE SCHEMAS
# ==========================

class ServiceCreate(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    price: float
    duration: Optional[str] = None
    status: str = "Active"


class ServiceResponse(ServiceCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[str] = None
    status: Optional[str] = None


# ==========================
# BOOKING SCHEMAS
# ==========================

# ==========================
# BOOKING SCHEMAS
# ==========================

class BookingCreate(BaseModel):
    customer: str
    service: str
    provider_id: Optional[int] = None
    date: date
    time_slot: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    reference_image_url: Optional[str] = None
    amount: float
    status: str = "Pending"


class BookingResponse(BookingCreate):
    id: int
    booking_code: str
    user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class BookingUpdate(BaseModel):
    customer: Optional[str] = None
    service: Optional[str] = None
    provider_id: Optional[int] = None
    date: Optional[date] = None
    time_slot: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    reference_image_url: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None

# ==========================
# CUSTOMER SCHEMAS
# ==========================

class CustomerCreate(BaseModel):
    name: str
    email: str
    phone: str
    city: str
    status: str = "Active"


class CustomerResponse(CustomerCreate):
    id: int
    user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    status: Optional[str] = None


# ==========================
# PAYMENT SCHEMAS
# ==========================

class PaymentCreate(BaseModel):
    customer: str
    booking_id: str
    date: date
    amount: float
    method: str
    status: str = "Pending"


class PaymentResponse(PaymentCreate):
    id: int
    payment_code: str
    user_id: Optional[int] = None
    provider_id: Optional[int] = None
    commission_rate: float = 0
    commission_amount: float = 0
    provider_earning: float = 0

    model_config = ConfigDict(from_attributes=True)


class PaymentUpdate(BaseModel):
    customer: Optional[str] = None
    booking_id: Optional[str] = None
    date: Optional[date] = None
    amount: Optional[float] = None
    method: Optional[str] = None
    status: Optional[str] = None


# ==========================
# USER SCHEMAS
# ==========================

class UserCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    password: str
    role: str = "Customer"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    status: str

    model_config = ConfigDict(from_attributes=True)


# ==========================
# SERVICE PROVIDER SCHEMAS
# ==========================

class ProviderCreate(BaseModel):
    user_id: int
    business_name: str
    description: Optional[str] = None
    address: Optional[str] = None
    city: str
    service_areas: Optional[str] = None
    document_url: Optional[str] = None
    base_price: float = 0
    working_hours: Optional[str] = None
    availability: str = "Available"


class ProviderUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    service_areas: Optional[str] = None
    document_url: Optional[str] = None
    verification_status: Optional[str] = None
    rejection_reason: Optional[str] = None
    base_price: Optional[float] = None
    working_hours: Optional[str] = None
    availability: Optional[str] = None


class ProviderResponse(BaseModel):
    id: int
    user_id: int
    business_name: str
    description: Optional[str] = None
    address: Optional[str] = None
    city: str
    service_areas: Optional[str] = None
    document_url: Optional[str] = None
    verification_status: str
    rejection_reason: Optional[str] = None
    base_price: float
    working_hours: Optional[str] = None
    availability: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================
# COMMISSION SCHEMAS
# ==========================

class CommissionSettingCreate(BaseModel):
    commission_percentage: float = Field(ge=0, le=100)


class CommissionSettingResponse(BaseModel):
    id: int
    commission_percentage: float
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================
# PROVIDER EARNINGS SCHEMA
# ==========================

class ProviderEarningsResponse(BaseModel):
    provider_id: int
    total_revenue: float
    total_commission: float
    total_earnings: float
    total_payments: int


# ==========================
# TECHNICIAN SCHEMAS
# ==========================

class TechnicianCreate(BaseModel):
    user_id: int
    provider_id: Optional[int] = None
    skills: Optional[str] = None
    experience: int = 0
    availability: str = "Available"
    status: str = "Active"


class TechnicianUpdate(BaseModel):
    provider_id: Optional[int] = None
    skills: Optional[str] = None
    experience: Optional[int] = None
    availability: Optional[str] = None
    status: Optional[str] = None


class TechnicianResponse(BaseModel):
    id: int
    user_id: int
    provider_id: Optional[int] = None
    skills: Optional[str] = None
    experience: int
    availability: str
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================
# TECHNICIAN JOB SCHEMAS
# ==========================

class TechnicianJobCreate(BaseModel):
    technician_id: int
    booking_id: int


class TechnicianJobUpdate(BaseModel):
    job_status: Optional[str] = None
    arrival_status: Optional[str] = None
    remarks: Optional[str] = None
    completion_image_url: Optional[str] = None


class TechnicianJobResponse(BaseModel):
    id: int
    technician_id: int
    booking_id: int
    job_status: str
    arrival_status: str
    remarks: Optional[str] = None
    completion_image_url: Optional[str] = None
    assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================
# NOTIFICATION SCHEMAS
# ==========================

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: str = "General"


class NotificationUpdate(BaseModel):
    is_read: str


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================
# REVIEW SCHEMAS
# ==========================

class ReviewCreate(BaseModel):
    provider_id: int
    booking_id: int
    rating: int
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    provider_id: int
    booking_id: int
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================
# COMPLAINT SCHEMAS
# ==========================

class ComplaintCreate(BaseModel):
    booking_id: Optional[int] = None
    subject: str
    description: str


class ComplaintUpdate(BaseModel):
    status: str
    admin_response: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: int
    user_id: int
    booking_id: Optional[int] = None
    subject: str
    description: str
    status: str
    admin_response: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================
# INVOICE SCHEMAS
# ==========================

class InvoiceCreate(BaseModel):
    payment_id: int
    booking_id: str
    customer_name: str
    service_name: str
    subtotal: float
    discount: float = 0
    tax: float = 0
    total_amount: float


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    payment_id: int
    booking_id: str
    customer_name: str
    service_name: str
    subtotal: float
    discount: float
    tax: float
    total_amount: float
    status: str
    issued_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)