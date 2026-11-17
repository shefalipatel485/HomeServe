# 1. Software Requirement Specification (SRS)

## 1.1 Project overview
**Project name:** HomeServe – Home Services Booking SaaS Platform

**Purpose:** Provide a centralized platform where customers can discover home services, select service providers, book appointments, track jobs, make test payments, and submit reviews. Service providers manage services and bookings. Technicians handle assigned jobs. Super Admin oversees platform operations.

## 1.2 Business problem
The business brief identifies these problems:
- Customers have difficulty finding verified service providers.
- Providers struggle to acquire customers.
- Manual booking by phone is time-consuming.
- Customers cannot reliably track request status.
- Payment records are difficult to maintain.
- Providers lack a centralized schedule and earnings view.
- Business owners lack booking and revenue visibility.

## 1.3 Business goals
- Centralize service discovery and booking.
- Support multiple customers and service providers.
- Provide controlled provider verification.
- Track booking lifecycle and job completion.
- Maintain payment and commission records.
- Provide role-based dashboards and reports.

## 1.4 User roles
### Super Admin
Manage customers, providers, provider verification, service categories/listings, bookings, payments/commissions, complaints/disputes, coupons/offers, reports/analytics, and subscription plans.

### Customer
Register/login, manage profile and addresses, browse/search services, view provider profiles/ratings, check availability, book appointments, select date/time, provide address/details/images, track/cancel bookings under rules, make payments, view history/receipts, submit reviews, and raise complaints.

### Service Provider
Register, submit identity/verification documents, manage provider profile/services/categories/descriptions/pricing/service areas/working hours/availability, accept or reject booking requests, assign technicians, update service status, view relevant booking/customer details, upload before/after images, view reviews, and track earnings/history.

### Technician
Login, view assigned jobs and relevant booking/location details, accept assigned jobs, update job status, mark arrival, upload completion images, add remarks, and view job history.

## 1.5 Functional requirements
### FR-01 Authentication and authorization
- Register and login users.
- Support role selection subject to server-side rules.
- Validate email/mobile input.
- Provide secure password reset.
- Hash passwords; never store plaintext passwords.
- Issue and validate JWT access tokens.
- Enforce role-based permissions on protected APIs.
- Support logout/token invalidation strategy.
- Support provider verification workflow.

### FR-02 Customer management
- Create and update customer profile.
- Add and manage multiple addresses.
- Browse/search/filter services.
- View booking/service history.
- Manage favorite providers.
- Allow Admin to manage account status.

### FR-03 Service category and service management
- Create categories and subcategories.
- Create/edit service descriptions, images, pricing and duration.
- Set service availability/status.
- Search and filter services.
- Include the brief's example categories: Electrical, Plumbing, AC Repair & Maintenance, Home Cleaning, Painting, Carpentry, Appliance Repair, Pest Control.

### FR-04 Provider management
- Provider registration and profile creation.
- Upload verification documents.
- Admin approve/reject workflow.
- Configure service locations/areas, pricing, working hours and availability.
- Display provider ratings/reviews.

### FR-05 Booking and appointment management
- Select service and provider.
- Select preferred date/time and available slot.
- Select service address and enter problem description.
- Upload reference images.
- Generate unique booking ID.
- Confirm, cancel and reschedule bookings.
- Maintain booking history.
- Prevent double booking through backend/database transaction and constraints.
- Booking states: Pending, Confirmed, Provider Assigned, In Progress, Completed, Cancelled, Rejected.

### FR-06 Technician management
- Add technicians and associate them with providers.
- Assign technicians to bookings.
- Show assigned jobs.
- Update job status and arrival time.
- Upload completion images and remarks.
- Maintain job history and performance information.

### FR-07 Payment and invoice management
- Calculate service charge, commission, discount and final amount.
- Support advance/pending payment records.
- Maintain payment history and transaction records.
- Generate invoice/receipt.
- Track refunds and provider earnings.
- Integrate Razorpay Test Mode or Stripe Test Mode only for sandbox testing.
- Payment states: Pending, Paid, Failed, Refunded.
- Payment status must not be changed by an unauthorized client request.

### FR-08 Notifications and communication
- In-app notification center.
- Booking confirmation/cancellation alerts.
- Technician assignment alerts.
- Appointment reminders.
- Service completion and payment alerts.
- Review requests and Admin announcements.
- Email/SMS integration is optional.

### FR-09 Ratings, reviews and complaints
- Customers submit ratings and reviews.
- Display provider average ratings.
- Admin monitors reviews.
- Customers create complaints/support requests.
- Admin reviews and tracks complaint resolution.
- Maintain complaint history.
- Providers may respond to reviews.

### FR-10 Analytics and reporting
- Admin metrics: customers, providers, technicians, bookings, pending/completed/cancelled bookings, revenue, commission, provider earnings, popular categories, monthly bookings and customer growth.
- Provider metrics: total/today/pending/completed bookings, earnings, average rating and monthly revenue.
- Customer metrics: upcoming/previous bookings, pending payments, favorites and booking status.
- Graphical reports and CSV export.

## 1.6 Non-functional requirements
- **Security:** hashed passwords, JWT, backend RBAC, input validation, ORM parameterized queries, secure secrets, HTTPS in production, upload validation, protected endpoints.
- **Reliability:** consistent booking/payment state transitions and transaction-safe booking creation.
- **Performance:** pagination, search/filtering, indexed database fields where appropriate.
- **Usability:** responsive UI, clear validation/errors, loading states and accessible navigation.
- **Maintainability:** modular FastAPI routers/services/models/schemas and reusable React components.
- **Compatibility:** modern desktop and mobile browsers.
- **Observability:** application logs and useful, non-sensitive error responses.
- **Testability:** APIs testable through Postman and automated tests.

## 1.7 Constraints and assumptions
- Payment integration is sandbox/test mode for the project.
- Cloud database and hosting accounts/credentials will be supplied by the project owner during deployment.
- Cloudinary or equivalent storage credentials will be configured outside source code.
- Email/SMS delivery is optional; in-app notifications are required.
- Exact subscription-plan business rules are not specified in the brief and will be defined before implementation if that feature is included.
- Final database schema and relationships will be designed in Phase 3.

## 1.8 Out of scope for the initial build
- Real-money payment settlement.
- Guaranteed identity verification through a third-party government API.
- Native Android/iOS apps.
- Automated dispatch optimization or live GPS tracking unless separately approved.


## 1.9 Implementation baseline and status (17 November 2026)
This SRS remains the planning baseline. The current application uses a React/Vite frontend, Python FastAPI backend, SQLAlchemy ORM and MySQL/MariaDB database. The backend has been deployed at https://homeserve-uprh.onrender.com and the source repository is https://github.com/shefalipatel485/HomeServe.

The backend has progressed across the core business areas, and automated tests are being developed with Pytest. The final consolidated test result has not been confirmed in this document. The frontend production URL, complete React-to-FastAPI end-to-end integration and production database connectivity must be added only after successful verification.

Payment gateway processing, Cloudinary storage, email/SMS delivery, Playwright end-to-end tests, coupons, subscriptions, favorites and other optional items remain requirements or possible extensions unless their working implementation is separately demonstrated. Do not present them as completed features solely because they appear in the initial requirements.
