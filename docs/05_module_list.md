# 5. Functional Module List

| No. | Module | Main deliverables |
|---:|---|---|
| 1 | Authentication & Authorization | Registration, login, JWT, password hashing, RBAC, protected APIs, provider verification |
| 2 | Customer Management | Customer profile, addresses, favorites, account status, history |
| 3 | Service Category & Management | Categories, subcategories, service listing/details, pricing, duration, status |
| 4 | Service Provider Management | Provider profile, documents, Admin approval, areas, hours, availability, reviews |
| 5 | Booking & Appointment Management | Slot validation, booking ID, create/cancel/reschedule, status tracking, double-booking prevention |
| 6 | Technician Management | Technician records, provider association, job assignment, status, arrival, evidence, history |
| 7 | Payment & Invoice Management | Price/commission/discount calculation, sandbox payment, receipts, refunds, earnings |
| 8 | Notification & Communication | In-app notification center, booking/payment/job alerts, announcements |
| 9 | Rating, Review & Complaint Management | Ratings, reviews, provider responses, complaints and resolution |
| 10 | Analytics & Reporting Dashboard | Role-based metrics, charts, monthly reports, CSV export |

## Suggested database entities from the project brief
users, customers, service_providers, technicians, addresses, service_categories, services, provider_services, service_areas, availability_slots, bookings, booking_assignments, booking_images, payments, invoices, coupons, reviews, complaints, notifications, provider_earnings.

The detailed columns, keys, relationships, indexes and normalization will be completed in Phase 3.


## Implementation evidence note
The backend project has progressed across authentication, customer, service, provider, booking, technician, payment, notification, review, complaint and analytics areas. This list describes the business scope; verify each module in the current UI and APIs before marking its end-to-end implementation complete. A payment gateway integration, cloud file-storage integration or other third-party service must not be described as complete without working configuration and test evidence.
