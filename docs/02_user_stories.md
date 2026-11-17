# 2. User Stories and Acceptance Criteria

Format: As a [role], I want [goal], so that [benefit].

## Super Admin
1. As an Admin, I want to log in securely so that only authorized staff can access administration.
   - Acceptance: valid credentials grant access; invalid credentials are rejected; non-admin roles cannot access Admin APIs.
2. As an Admin, I want to view and manage customers so that I can control platform accounts.
   - Acceptance: list/search customer records; update allowed account status; changes persist.
3. As an Admin, I want to approve or reject provider applications so that only approved providers can publish services.
   - Acceptance: pending applications are visible; decision and optional reason are saved; provider status changes.
4. As an Admin, I want to manage categories and services so that customers see organized offerings.
   - Acceptance: create/update/deactivate category/service; invalid prices or missing required fields are rejected.
5. As an Admin, I want to monitor bookings and payment records so that I can oversee operations.
   - Acceptance: filter records; see status and totals; only authorized Admin can access.
6. As an Admin, I want to review complaints and reports so that I can resolve issues and monitor performance.
   - Acceptance: complaint status is trackable; dashboard totals are calculated from stored records.

## Customer
1. As a Customer, I want to register and log in so that I can use the platform.
   - Acceptance: valid details create an account; duplicate email/mobile is rejected; password is securely hashed.
2. As a Customer, I want to manage my profile and addresses so that I can book services at the correct location.
   - Acceptance: create/read/update/delete own addresses; cannot modify another customer's address.
3. As a Customer, I want to search services by category so that I can find the required professional.
   - Acceptance: search and category filters return matching active services.
4. As a Customer, I want to view provider profiles and reviews so that I can make an informed choice.
   - Acceptance: provider details, service details and available reviews are displayed.
5. As a Customer, I want to book a service slot so that a provider can attend my home.
   - Acceptance: booking has unique ID; valid slot can be booked; unavailable/conflicting slot is rejected.
6. As a Customer, I want to track or cancel my booking so that I know its progress.
   - Acceptance: only own bookings are visible; cancellation follows defined status rules.
7. As a Customer, I want to pay and view receipts so that I can keep payment records.
   - Acceptance: test payment updates payment record; receipt reflects transaction details.
8. As a Customer, I want to submit a review or complaint so that I can share feedback or request help.
   - Acceptance: review is linked to an eligible completed booking; complaint status is visible to its owner.

## Service Provider
1. As a Provider, I want to register and submit verification documents so that Admin can review my application.
   - Acceptance: application is stored as pending; document type/size is validated.
2. As a Provider, I want to manage services, pricing and availability so that customers can book my services.
   - Acceptance: only own services can be edited; inactive/unapproved provider listings are not bookable.
3. As a Provider, I want to accept or reject booking requests so that I can manage my workload.
   - Acceptance: valid state transitions are saved; unrelated providers cannot change the booking.
4. As a Provider, I want to assign a technician so that the job can be performed.
   - Acceptance: technician belongs to the provider; assignment is recorded.
5. As a Provider, I want to view earnings and reviews so that I can monitor performance.
   - Acceptance: totals are based on recorded transactions and eligible reviews.

## Technician
1. As a Technician, I want to log in and view my assigned jobs so that I know my work schedule.
   - Acceptance: only jobs assigned to the logged-in technician are returned.
2. As a Technician, I want to update job status and arrival time so that the customer/provider can track progress.
   - Acceptance: only allowed status transitions are accepted.
3. As a Technician, I want to upload completion photos and remarks so that there is a record of completed work.
   - Acceptance: file type/size is validated; upload is linked to the assigned job.
4. As a Technician, I want to view job history so that I can review completed assignments.
   - Acceptance: history contains only the technician's own assignments.

## Cross-role critical acceptance scenarios
- A customer cannot read another customer's booking.
- A provider cannot update another provider's service or booking.
- A technician cannot access jobs not assigned to them.
- A booking slot cannot be double-booked under concurrent requests.
- A client cannot mark a payment as Paid without verified server-side payment confirmation.
- A provider cannot become bookable until approved by Admin.
