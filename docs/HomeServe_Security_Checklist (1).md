# HomeServe – Security Checklist

**Project:** HomeServe – Home Services Booking SaaS  
**Backend:** FastAPI  
**Database:** MySQL  
**ORM:** SQLAlchemy  
**Authentication:** JWT-based authentication (verify against the current implementation)

> **How to use this checklist:** Mark an item `[x]` only after you have implemented it and tested it. Items are initially unchecked because this document does not independently verify the current source code or deployment configuration. Do not include real passwords, API keys, JWT secrets, or customer data in this document or in GitHub.

---

## 1. Authentication and password security

- [ ] Passwords are never stored in plain text.
- [ ] Passwords are hashed with a modern password-hashing algorithm such as Argon2id or bcrypt, using a maintained library.
- [ ] Password verification uses the library's verify function; passwords are not compared as plain text.
- [ ] Registration validates email format and applies appropriate password rules.
- [ ] Duplicate account registration is handled safely.
- [ ] Login errors do not reveal whether an email or password was incorrect.
- [ ] JWT signing secret is strong, private, and loaded from environment variables.
- [ ] JWT expiration (`exp`) is configured and validated.
- [ ] JWT signature and allowed algorithm are validated on every protected request.
- [ ] Tokens are not logged or exposed in error messages.
- [ ] Logout/token revocation or short token lifetime is considered and documented.
- [ ] Refresh tokens, if implemented, are stored and rotated securely.

## 2. Authorization and role-based access

- [ ] Protected endpoints require authentication.
- [ ] Role checks are enforced on the server, not only hidden in the frontend.
- [ ] Super Admin endpoints are accessible only to authorized admin accounts.
- [ ] Customers can access only their own profile, bookings, payments, reviews, and complaints.
- [ ] Service Providers can access only their own provider profile and permitted bookings.
- [ ] Technicians can access only jobs assigned to them and the information needed to perform them.
- [ ] A user cannot change their own role or privilege through a registration/profile request.
- [ ] Object-level ownership checks are performed using database records on every read, update, and delete.
- [ ] Changing an ID in a URL or request body cannot expose another user's data.
- [ ] Administrative actions are restricted and auditable.

## 3. API and input validation

- [ ] Request bodies are validated with Pydantic schemas.
- [ ] Required fields, data types, lengths, ranges, and allowed values are validated.
- [ ] Unknown or unexpected fields are rejected or safely ignored according to a documented policy.
- [ ] Database queries use SQLAlchemy parameterized operations; raw SQL is not built by concatenating user input.
- [ ] Pagination and sensible maximum page sizes are applied to list endpoints.
- [ ] Uploads, if supported, validate file size, extension, and actual content type.
- [ ] API error responses do not expose stack traces, SQL statements, secrets, or internal file paths.
- [ ] Rate limiting is applied to login, registration, password reset, and other sensitive endpoints.
- [ ] CORS allows only the required frontend origins in production.
- [ ] Production API documentation endpoints are restricted or intentionally exposed.

## 4. Database security

- [ ] Database credentials are stored in environment variables or a secrets manager.
- [ ] The database is not exposed publicly unless there is a specific secured requirement.
- [ ] The application uses a least-privilege database account.
- [ ] Foreign keys and appropriate unique constraints are configured.
- [ ] Sensitive data is not unnecessarily collected or stored.
- [ ] Database backups are created regularly.
- [ ] Backup restoration is tested periodically.
- [ ] Database connections use TLS when connecting across an untrusted network.
- [ ] Database errors are not returned directly to API clients.
- [ ] Schema changes are managed through reviewed migrations.

## 5. Payments and financial data

- [ ] Payment processing uses a trusted payment gateway.
- [ ] Card numbers, CVV values, and other sensitive card data are not stored by the application.
- [ ] Payment success is confirmed using a verified gateway callback/webhook, not only a frontend response.
- [ ] Webhook signatures are verified.
- [ ] Payment and refund operations are checked for authorization and correct booking ownership.
- [ ] Duplicate payment requests are protected against using idempotency controls where supported.
- [ ] Amounts and currency are validated on the server.
- [ ] Commission and provider-earning calculations are performed on the server.
- [ ] Payment secrets and gateway keys are kept out of source control and logs.

## 6. Application configuration and deployment

- [ ] `DEBUG` mode is disabled in production.
- [ ] HTTPS is enabled for the deployed application.
- [ ] Production secrets are configured outside the repository.
- [ ] `.env` files, credentials, private keys, and local database files are excluded through `.gitignore`.
- [ ] A safe example environment file (for example, `.env.example`) contains placeholders only.
- [ ] Dependencies are pinned or locked and checked for known vulnerabilities.
- [ ] The application runs with only the permissions it needs.
- [ ] Security headers are configured at the application or reverse-proxy layer as appropriate.
- [ ] Production error handling does not reveal internal implementation details.
- [ ] Development/test services and sample credentials are not exposed in production.

## 7. Privacy, logging, and monitoring

- [ ] Logs do not contain passwords, JWTs, API keys, payment secrets, or full sensitive personal data.
- [ ] Authentication failures and suspicious access attempts are logged safely.
- [ ] Important admin, payment, booking, and account changes have an audit trail.
- [ ] Access to logs and backups is restricted.
- [ ] Personal data is visible only to roles that need it.
- [ ] Data retention and deletion requirements are documented.
- [ ] Security incidents have a documented reporting and response process.

## 8. Testing and verification

- [ ] Unauthenticated requests to protected endpoints return `401 Unauthorized`.
- [ ] Authenticated users without the required role receive `403 Forbidden`.
- [ ] Customer A cannot read or modify Customer B's records.
- [ ] A provider cannot access another provider's bookings or earnings.
- [ ] A technician cannot access jobs assigned to another technician.
- [ ] Invalid, expired, and tampered JWTs are rejected.
- [ ] SQL injection-style input is tested on search and filter endpoints.
- [ ] Invalid and oversized request payloads are tested.
- [ ] CORS behavior is tested using an unapproved origin.
- [ ] Payment webhook signature and duplicate-event handling are tested.
- [ ] Automated tests cover authentication, authorization, and ownership rules.
- [ ] Dependency and configuration scans are run before release.

---

## 9. Suggested evidence for project submission

Attach or link evidence for the checks that have actually been completed:

| Evidence | What to include |
|---|---|
| Authentication | Password hashing code and successful/failed login test |
| JWT security | Token expiry/invalid-token test results |
| Role authorization | Postman tests for Admin, Customer, Provider, and Technician |
| Ownership checks | Test showing one user cannot access another user's booking |
| API validation | Tests for missing, invalid, and oversized inputs |
| Database | Redacted configuration example and schema/migration evidence |
| CORS and HTTPS | Production configuration or deployment screenshots |
| Payment security | Gateway test-mode result and webhook verification evidence, if payments are implemented |
| Automated tests | Test report with passed/failed counts |
| Dependency security | Dependency scan report |

## 10. Security review sign-off

| Field | Details |
|---|---|
| Project | HomeServe – Home Services Booking SaaS |
| Reviewed by | ______________________________ |
| Review date | ______________________________ |
| Application version / commit | ______________________________ |
| Open critical issues | ______________________________ |
| Open high-priority issues | ______________________________ |
| Final status | Not reviewed / In progress / Verified |

**Important:** This checklist is a security review template, not a security certification. Complete the checks, fix identified issues, and retain test evidence before marking the project secure or submitting it as verified.
