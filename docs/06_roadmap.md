# 6. Development Roadmap and Current Progress

| Phase | Work | Exit condition | Current position (17 Nov 2026) |
|---|---|---|---|
| 1 | Requirements, user stories, workflows and scope | Planning documents reviewed | Planning package prepared; use this document as the scope baseline. |
| 2 | React UI/UX and responsive frontend | Role screens and navigation render correctly | React/Vite frontend project exists; complete screen coverage should be verified. |
| 3 | MySQL schema and ER diagram | Tables, keys, constraints and relationships verified | SQLAlchemy models and MySQL database are in use; attach a final physical ERD from the actual schema. |
| 4 | FastAPI backend and REST APIs | APIs persist data and pass endpoint tests | Core FastAPI modules and API endpoints have been developed; continue regression testing. |
| 5 | React–FastAPI integration | Main role workflows work end-to-end | Integration and production API-base-URL verification remain to be confirmed. |
| 6 | Unit, API, integration and UI testing | Full test report produced; critical defects fixed | Pytest test suite is being assembled/run; attach the final complete `pytest -v` result. |
| 7 | Security hardening | RBAC, ownership checks, secrets and input controls verified | JWT and role-based API protection are part of the backend; complete the security evidence checklist. |
| 8 | Git/GitHub and documentation | Repository, README and safe configuration examples ready | GitHub repository created: https://github.com/shefalipatel485/HomeServe |
| 9 | Cloud deployment | Frontend, backend and production database work together | Backend deployed on Render: https://homeserve-uprh.onrender.com. Frontend production URL and full-stack connectivity require final verification. |

## Recommended remaining sequence
1. Verify each React screen against its corresponding FastAPI endpoint.
2. Configure the production frontend API base URL and CORS origin.
3. Verify JWT login and role permissions for all four roles.
4. Verify the customer booking lifecycle from creation through provider/technician updates and completion.
5. Verify payment-record workflow without claiming real gateway processing unless sandbox integration is working.
6. Run the full automated test suite against the dedicated test database, never the production database.
7. Generate the physical ER diagram from the actual database schema.
8. Complete security checks and capture screenshots/evidence.
9. Verify the deployed frontend, backend and database together, then update the final live URLs.

## Backend development order (reference)
1. Environment and FastAPI setup.
2. Database connection and SQLAlchemy setup.
3. User model and authentication.
4. Role and permission enforcement.
5. Categories and services.
6. Provider onboarding and verification.
7. Customer profiles.
8. Availability and bookings.
9. Technician assignment and job lifecycle.
10. Payments and invoice records.
11. Notifications.
12. Reviews and complaints.
13. Analytics and reporting.
14. Automated tests and security review.
