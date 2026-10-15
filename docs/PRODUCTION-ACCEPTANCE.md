# Academy OS production acceptance and operational backlog

Updated 2026-10-14 (Eastern). **Code exists**, **CI passed**, **public Worker deployed**, **authenticated staff workflow signed off**, and **approved for confidential student data** are separate milestones. Do not treat navigation or a sample record as proof of any higher milestone.

## Evidence that has been verified
- Owner signed into the production Academy OS earlier; Greensboro, Mansfield TX and Dallas TX were created and appeared in Add Student campus dropdown. The Add Student form opens. No production saved-student end-to-end signoff is recorded.
- GitHub production workflow automatically runs after successful main-branch quality gates, checks that the tested SHA is still the current main revision, deploys Cloudflare Worker and D1 schema, verifies the public /api/health release SHA and rejects unauthenticated access. Each commit needs its **own successful release**. See docs/production-release-checklist.md for specific release history.
- 2026-10-14/15 Worker release deployed at SHA `d0ff0fe4eca5fec7dd26996c02447dbe1256735f` and confirmed a **new** high-entropy 256-bit `RECORDS_ENCRYPTION_KEY` Cloudflare secret was provisioned. A subsequent release preserved that exact existing secret without rotating it. The secret value was not printed or stored in GitHub. **School-controlled key recovery remains unresolved; do not handle real student file uploads without an approved recovery strategy.**
- Production read-only D1 document metadata inventory reported no existing registered uploads before key bootstrapping; D1 Time Travel returned an available bookmark. **Neither is a tested restore or guarantee that orphaned R2 objects do not exist.**
- The production Worker currently exposes owner-only randomized AES-GCM/R2 round-trip diagnostic under Employee launch setup → Production readiness. Its authenticated execution by the owner has **not been observed**.
- CI tests cover student training history, hour corrections, attendance, role/campus isolation, restricted documents, agency disclosure consent/grants, staffing hours, WIOA privacy, secure session login, provider-mocked OpenAI drafting, and fake-document rejection. **CI passing does not prove real-world school licensure or production employee access.**

## P0 — Must pass before using actual student personal information
- [ ] Fictional student on **each** campus: create, reload, edit, class/phase transfer, correct a daily entry, retire test record according to an approved retention procedure.
- [ ] Test all five Class A weeks (week 5 = testing) end to end: admissions/funding status, attendance, classroom, yard, student-operated road driving vs observation, manually attested qualifying night hours when school policy requires, evaluations, exam, graduation and placement outcome.
- [ ] Confirm no recorded attendance is reported as absence; instructor session updates and corrections are auditable and do not double count.
- [ ] Run authenticated owner **Run encrypted storage test** in production; verify actual authorized student-file upload/download and negative-access checks in Greensboro, Mansfield and Dallas with fictional student files. Do not use a real student's personal data.
- [ ] Test active employee accounts/roles: Owner, Campus manager, Enrollment specialist, Admin assistant, Front desk and Instructor. Confirm field redaction, restricted document access, school staff account revocation and cross-campus API denials.
- [ ] Perform audited D1/R2 backup and isolated restore drill; approve controlled, recoverable encryption-key management before protected data is accepted.
- [ ] Sign off data ownership, privacy, consent and retention policies, security incident handling, NC/TX-specific approvals and program requirements.

## Functionality implemented in code; live workflow acceptance still open
- Admissions, lead-to-enrollment, tours, cohort dates/capacity, funding-pending vs authorized, payment *manual ledger*, promotional terms and manual additional training-hour policy.
- Classroom/yard/road progress, daily attendance, individual driver-training logs and corrections, school-configured targets, 80% theory review threshold, proficiency matrices, day/night evidence, testing-week graduation review.
- Campus-specific records, three-campus owner reporting, manager brief, staff schedule planner with unpaid meal breaks, role-scoped logins and invitations, vendor and equipment readiness tracking.
- WIOA and employer relationship pipelines, MOUs, contingent-offer evidence tracking, agency-specific progress reports, referral-to-lead handoff, lead attribution for community events and placement follow-up.
- Independent **WIOA agency representative read-only portal** and manager grant administration with per-student verified information-release authorization, scoped fields, expiration, disclosure audit and revocation, including integration tests. **No agency account or student permission should be provisioned until school data-sharing policy and live acceptance tests are approved.**
- Optional OpenAI Studio draft-only backend: authorized campus, rate limit, privacy confirmation, manual business context only, no automatic student-record sending, and mocked-provider tests. **The live OpenAI service remains disconnected without an account-approved API key and API billing.**
- Owner-only technical readiness dashboard, encrypted storage canary, R2 document binding and D1 bookmark presence checks. None alone certify deployment safe for student PII.

## External integrations and regulatory dependencies not completed
- [ ] OpenAI secret and separate API billing, approved data-sharing terms and test provider responses.
- [ ] Resend/Twilio credentials and opted-in test recipients; test delivery, consent, STOP/opt-out and quiet hours.
- [ ] Verified external electronic signature service for enforceable signed agreements; manual signed-file storage is not an integration.
- [ ] FMCSA Training Provider Registry direct submission (currently tracked manually) and NCDMV/Texas DPS confirmation of CLP, training records, instructor/yard/site licensing, drug-screen requirements and skills testing rules.
- [ ] Official school consent/release templates, document retention, key escrow/recovery, secure backup/restore, production employee and partner access acceptance.
- [ ] Student/public enrollment portal and payment processor are not fully deployed; the public-facing website within Academy OS is a private preview and finance is a ledger, not payment processing.

## Deployment policy
- A merged commit is not a deployment. Require a green quality gate and production job for that **exact** SHA and check its public health revision.
- Authenticated employee/business-flow scenarios and manual regulator signoff are not covered by public health checks.
- Keep actual student PII out of unapproved flows and never represent external provider credentials, e-signatures or FMCSA submissions as connected merely because a menu exists.
