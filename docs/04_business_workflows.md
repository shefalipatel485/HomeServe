# 4. Business Workflows

## 4.1 Provider onboarding
1. Provider registers and submits profile and verification documents.
2. Application is stored with Pending status.
3. Admin reviews submitted information.
4. Admin approves or rejects the application and records the decision.
5. Only approved providers can publish active services and receive bookings.

## 4.2 Customer booking
1. Customer logs in.
2. Customer browses or searches active services.
3. Customer selects a service and an approved provider.
4. Customer selects an available date/time slot and address.
5. Customer enters problem description and optional reference images.
6. Backend validates provider/service status and slot availability.
7. Backend creates a unique booking record using transaction-safe logic.
8. Booking begins in Pending status.
9. Provider accepts or rejects the request.
10. Customer sees the current booking status.

## 4.3 Job assignment and completion
1. Provider accepts a booking.
2. Provider assigns one of their active technicians.
3. Technician sees the assigned job.
4. Technician accepts the assignment and marks arrival.
5. Technician updates job to In Progress.
6. Technician uploads completion images and remarks.
7. Technician marks work completed.
8. Booking is updated to Completed according to permitted state transitions.
9. Customer can submit an eligible review or complaint.

## 4.4 Payment workflow
1. Backend calculates service amount, discount, commission and final payable amount.
2. Payment record is created as Pending.
3. Customer completes a sandbox/test payment.
4. Backend verifies the gateway result/signature before marking Paid.
5. Failed attempts remain Failed and do not mark booking as paid.
6. Refunds are recorded with appropriate status and audit information.
7. Invoice/receipt is generated from persisted transaction data.

## 4.5 Complaint workflow
1. Customer raises a complaint against an eligible booking.
2. Complaint is stored as Open/Pending.
3. Admin reviews and updates status.
4. Resolution notes and status changes are stored.
5. Customer can view the complaint progress.

## 4.6 Booking state transition rules
- Pending -> Confirmed or Rejected or Cancelled
- Confirmed -> Provider Assigned or Cancelled
- Provider Assigned -> In Progress or Cancelled (subject to policy)
- In Progress -> Completed
- Completed -> no further operational status change; review/complaint remains possible
- Rejected and Cancelled are terminal for the initial release

All transitions must be validated by FastAPI. The frontend must not be trusted to enforce workflow rules by itself.
