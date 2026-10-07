# KTWS Academy OS — independent deployment

This is the separate Academy application prepared for the owner's Cloudflare account and `academy.ktworldsolutions.com`. It uses its own email/password sessions, D1 school database and encrypted R2 file storage. Base44 and ChatGPT authentication are not used. The existing preview has not been replaced and this package has not been deployed remotely.

## Cloudflare deployment

Use Node 24 and an authenticated Wrangler session belonging to the school's Cloudflare account. Do not paste API tokens or passwords into chat.

1. `npm install`
2. `npx wrangler login`
3. `npx wrangler d1 create ktws-academy-school`. Copy the returned database ID into `cloudflare/wrangler.jsonc`, replacing the explicit placeholder. This must be a NEW Academy database; never use the transportation OS database.
4. `npx wrangler r2 bucket create ktws-academy-school-files`
5. `npx wrangler d1 execute ktws-academy-school --remote --config cloudflare/wrangler.jsonc --file cloudflare/schema.sql`
6. Generate a new 32-byte random hex encryption key privately. Store it with `npx wrangler secret put RECORDS_ENCRYPTION_KEY --config cloudflare/wrangler.jsonc`. Preserve a secure backup; losing it makes uploaded documents unreadable. Never reuse or rotate the existing OS key for this application.
7. `npm run build:cloudflare`, then `npm run deploy:cloudflare`. The configured custom domain creates the Cloudflare domain binding. Do not use the old ChatGPT CNAME instructions. Ensure the domain is in this Cloudflare account and review any existing record conflict first.
8. `node scripts/setup-cloudflare-owner.mjs your-owner-email@example.com`. Open the private one-use link in your browser within 30 minutes and set your password. No owner bootstrap HTTP endpoint is exposed.
9. Add real campuses and active staff records with email, role and campus assignments. Generate each employee's activation link from the staff page and share it privately through your normal channel. Links expire after 30 minutes. Disabling a staff record removes access.

The owner account setup is for a fresh database only. A repeated setup fails rather than resetting an owner. If deployment fails after a partial setup, inspect the new D1 database before retrying.

## Validation and launch work

`npm run build` and `npm test` verify the portable Node adapter, native account activation, sign-in, campus restrictions, instructor transfers, encrypted documents, contract attachment, inactive staff blocking, same-origin enforcement and logout. `npm run build:cloudflare` prepares the Worker; `npx wrangler deploy --dry-run --config cloudflare/wrangler.jsonc` checks packaging. `python scripts/test-cloudflare.py` exercises a disposable local Worker/D1 instance.

Before staff use the remote deployment, repeat a real instructor/admissions account walkthrough on the actual domain, verify document upload/download, schedule a D1 backup/export and R2 retention process, and load real campus/program settings. No real students or employee credentials are included here. Source-copy migration from the existing preview is not automatic; its records and encrypted files need a deliberate secure migration if they contain live data.

SMS requires Twilio secrets `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`; email requires `RESEND_API_KEY`, `SCHOOL_EMAIL_FROM`. Without these the application refuses to send and reports that the service is disconnected. No messages have been sent. TPR remains a tracked export/submission workflow; it is not a certified direct FMCSA submission integration. Contract completion accepts uploaded signed evidence; no third-party e-signature provider is connected. Financial records do not imply live card processing or accounting integration. No autonomous AI agent service has been provisioned.

## Optional portable server

`npm run build`, set `PUBLIC_ORIGIN`, `RECORDS_ENCRYPTION_KEY`, `ACADEMY_DATA_DIR`, and `NODE_ENV=production`; run `npm run setup-owner -- owner@example.com`, then `npm start`. The Dockerfile runs this adapter and needs a persistent `/data` volume. Cloudflare is the primary requested target.

## Current verification result (2026-10-07)

Portable server build and functional tests: PASS. Training/admissions/attendance rule tests: PASS. Cloudflare frontend/Worker build and deployment dry run: PASS. Actual local Worker execution: BLOCKED by this environment's `uv_interface_addresses` system error before the Worker started; native password hashing inside workerd remains unverified here. Remote deployment and real-domain acceptance testing remain outstanding because Cloudflare account access is blocked. This package must not be represented as an employee-ready live service until those checks succeed.

## Connected operations and student success

The Operations & student success workspace adds six connected views to the independent Academy application:

- Daily operations: location-specific attendance recording coverage, current evidence flags, renewal/vehicle deadlines, balance follow-ups and scheduled appointments. Missing marks do not count as absences.
- Support cases: existing task records with a responsible person, support plan, due date, next review and completion outcome. Instructor-generated follow-ups can be managed without creating a duplicate. The API rejects duplicate open signal cases and mismatched campus links.
- Skill matrix: current classroom, yard and road competency evidence, recorded instruction hours and graduation evidence gaps.
- Capacity and campuses: enrolled seats, open seats, active students, saved ready-vehicle counts and overdue work. Vehicle deadline flags remain separate from its readiness status.
- Career outcomes: staff-reported applications, interviews, offers, job starts, follow-up dates and 30/90-day retention responses. Private career fields are excluded from instructor/front-desk student projections.
- Progress reports: reviewed text exports with period attendance, recorded hours, assessments, latest training focus and proficiency evidence. Identity numbers, screening results, uploaded files, payments and support case notes are excluded. Latest instructor notes are opt-in. Internal manager handoffs are separate exports for authorized school staff.

These features use the existing records schema and optimistic concurrency/audit system. No database migration is needed beyond the existing schema. Managers, enrollment specialists and admin assistants can manage cases and career records; instructors can review daily operations, competencies and progress reports for their authorized campuses. Flags are explicit rules, not predictive AI, and never automatically make enrollment, fitness or graduation decisions. Exports are downloaded locally, not emailed or submitted to an agency. SMS/email/e-signature/direct TPR integrations remain separate provider setup work.

Validation: `npm run build`, `npm run build:cloudflare`, `npm test`. The operations tests cover corrected attendance, latest/future evidence, duplicate case matching, campus capacity and report privacy. API integration tests cover role restrictions, duplicate open cases, linked-campus consistency, mandatory closure outcomes and private career projections.

## Growth and partnership workflows

`Growth & partnerships` connects existing organization records to an outreach pipeline, saved contact history, source-linked referral intake, recruiting events and actual lead/student attribution. Contacts are logged as actions already performed; this module sends no calls or emails. A referral can create a lead and employee contact task in one atomic save, or connect to an existing lead while preserving its original attribution. Contact permission is recorded before an admissions handoff. Preferred classes do not reserve seats.

Recruiting events are appointment records in the existing school calendar, using the same time/owner/room conflict checks. Event lead capture retains the event/source link. Completing an event requires outcome notes and can create a reviewed follow-up case. Budgets and actual costs are manual tracking fields, not payments or ledger entries. Conversion reports use actual linked student records with an explicit all-time/current-campus scope. Potential partner seats are estimates.

`Operations & student success → Student plans` gathers the student's current location, latest dated training focus for each area, recorded hours and configured targets, upcoming bookings (including admissions appointments linked through the original lead), open student assignments and graduation evidence gaps. Managers and enrollment/admin staff can assign a next-step support plan. Instructors retain limited training-focused navigation and data access.

New referral records use the existing record store; no schema migration is required. API checks enforce same-campus source/class/event links, immutable contact history, employee actor stamps, retained referral connections, duplicate handoff protection and existing role/campus boundaries. `npm test` includes growth unit tests, authenticated API tests and populated/empty React rendering checks for all eleven operations/growth views.

### Agency contact availability
Growth & partnerships includes a Contact follow-ups desk with active organization owners, due/upcoming/missing follow-up dates, contact absence ranges, backup contacts, availability notes and relationship notes. Absence dates are inclusive and do not suppress overdue tasks or automatically change next contact dates. Saving directory notes does not claim an outreach occurred or send a message.
