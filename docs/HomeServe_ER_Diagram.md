# HomeServe – Entity Relationship Diagram (ERD)

This ERD documents the HomeServe Home Services Booking SaaS database based on the model structure discussed for the project.

## 1. ER Diagram

```mermaid
erDiagram
    USERS {
        int id PK
        string full_name
        string email UK
        string phone
        string hashed_password
        string role
        string status
        datetime created_at
    }

    CUSTOMERS {
        int id PK
        int user_id FK
        string name
        string email
        string phone
        string city
        string status
    }

    SERVICE_PROVIDERS {
        int id PK
        int user_id FK
        string business_name
        string description
        string address
        string city
        string verification_status
        float base_price
    }

    SERVICES {
        int id PK
        string name
        string category
        string description
        float price
        string duration
        string status
    }

    BOOKINGS {
        int id PK
        string booking_code UK
        int user_id FK
        int provider_id FK
        string customer
        string service
        date date
        string time_slot
        float amount
        string status
    }

    PAYMENTS {
        int id PK
        string payment_code UK
        int user_id FK
        int provider_id FK
        string booking_id
        float amount
        string method
        string status
        float commission_amount
        float provider_earning
    }

    COMMISSION_SETTINGS {
        int id PK
        float commission_percentage
        datetime updated_at
    }

    TECHNICIANS {
        int id PK
        int user_id FK
        int provider_id FK
        string skills
        int experience
        string availability
        string status
    }

    TECHNICIAN_JOBS {
        int id PK
        int technician_id FK
        int booking_id FK
        string job_status
        string arrival_status
        string remarks
        datetime assigned_at
        datetime completed_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        string title
        string message
        string notification_type
        string is_read
    }

    REVIEWS {
        int id PK
        int user_id FK
        int provider_id FK
        int booking_id FK
        int rating
        string comment
    }

    INVOICES {
        int id PK
        string invoice_number UK
        int payment_id FK
        string booking_id
        float subtotal
        float discount
        float tax
        float total_amount
        string status
    }

    COMPLAINTS {
        int id PK
        int user_id FK
        int booking_id FK
        string subject
        string description
        string status
        string admin_response
    }

    USERS ||--o| CUSTOMERS : has
    USERS ||--o| SERVICE_PROVIDERS : has
    USERS ||--o| TECHNICIANS : has
    USERS ||--o{ BOOKINGS : creates
    USERS ||--o{ PAYMENTS : makes
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ COMPLAINTS : submits

    SERVICE_PROVIDERS ||--o{ BOOKINGS : receives
    SERVICE_PROVIDERS ||--o{ TECHNICIANS : employs
    SERVICE_PROVIDERS ||--o{ PAYMENTS : earns
    SERVICE_PROVIDERS ||--o{ REVIEWS : receives

    TECHNICIANS ||--o{ TECHNICIAN_JOBS : assigned
    BOOKINGS ||--o{ TECHNICIAN_JOBS : contains
    BOOKINGS ||--o{ REVIEWS : gets
    BOOKINGS ||--o{ COMPLAINTS : has

    PAYMENTS ||--o{ INVOICES : generates
```

## 2. Main table relationships

| Parent table | Child table | Relationship |
|---|---|---|
| Users | Customers | One-to-One (intended profile relationship) |
| Users | Service Providers | One-to-One (intended profile relationship) |
| Users | Technicians | One-to-One (intended profile relationship) |
| Users | Bookings | One-to-Many |
| Users | Payments | One-to-Many |
| Users | Notifications | One-to-Many |
| Users | Reviews | One-to-Many |
| Users | Complaints | One-to-Many |
| Service Providers | Bookings | One-to-Many |
| Service Providers | Technicians | One-to-Many |
| Service Providers | Payments | One-to-Many |
| Service Providers | Reviews | One-to-Many |
| Technicians | Technician Jobs | One-to-Many |
| Bookings | Technician Jobs | One-to-Many |
| Bookings | Reviews | One-to-Many |
| Bookings | Complaints | One-to-Many |
| Payments | Invoices | One-to-Many |

## 3. Recommended database improvements

Review these fields against the actual SQLAlchemy models before applying migrations:

1. `bookings.service` is represented as text in this diagram. Consider replacing it with `service_id` as a foreign key to `services.id`.
2. `payments.booking_id` is represented as text. Consider changing it to an integer foreign key referencing `bookings.id`.
3. `invoices.booking_id` is represented as text. Consider changing it to an integer foreign key referencing `bookings.id`.
4. `services.category` is represented as text. If categories need independent management, create a `service_categories` table and reference it with `category_id`.
5. Confirm that each profile table's `user_id` has a unique constraint if each user can have only one profile of that type.

## 4. Important note

This is a documentation draft based on the model/table structure described for the project. Before submitting it as the definitive database ERD, compare every table and field with the current SQLAlchemy model files and the live database schema. The relationship lines above should be treated as confirmed only where matching foreign-key constraints exist in the code.
