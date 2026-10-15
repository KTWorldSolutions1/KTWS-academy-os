# Academy OS — what “finished for now” means

**Owner version, reviewed October 15, 2026.** This is the build-and-acceptance contract for Lone Star Truck Driving Academy at Greensboro NC, Mansfield TX and Dallas TX. This is a work plan, **not** a certificate of compliance or permission to use real student data.

## Three different milestones

| Milestone | Definition | Status |
| --- | --- | --- |
| 1. Software ready to explore | School staff can open a deployed application with fictional/practice records, eight understandable menus and working role-aware workflows | Built and automated tests passing on the previously deployed revision; verify each new release separately |
| 2. Employee-ready operations | Alisha, Manny, campus managers, admissions, instructors and the owner each complete a written test script at their assigned campus, with actual staff sign-in and fictional data; failures are fixed | **Not signed off in production** |
| 3. Approved for protected real student data | The existing production encryption key is recoverable under school control, D1+R2 backup/restore are proven in isolation, internal role/consent and regulatory policies are approved, and three-campus acceptance is signed | **Blocked**; student file uploads and student invitations remain disabled |

**The first version can be considered complete for school evaluation when all P0 software issues have passing tests and each campus signs off on fictional end-to-end tests.** School operations involving real confidential data remain separate from this milestone.

## P0 — completion before live protected-data workflows

| What we must prove | Acceptance evidence | Accountable owner | Current limitation |
| --- | --- | --- | --- |
| Three-campus readiness | Greensboro, Mansfield and Dallas active in provider and school records; official NC/TX location, site, yard and instructor authorizations verified from original sources | School owners/managers | Automated database existence is not government approval |
| Whole-school lifecycle | One fictional lead → inquiry → approved enrollment → assigned cohort → classroom + theory test → yard/range → BTW road → testing week → graduation → documented employment outcome in each campus | Campus manager + instructors | Automated tests exist; authenticated walkthrough not signed off |
| Records and permissions | Role-specific school employee accounts correctly see only their assigned campus and permitted sensitive information; student and agency portals denied unless authorized | School owner + security witness | Production negative-access tests not signed |
| Encrypted documents and recovery | Existing production key safely held by two school custodians, verified recovery; Cloudflare D1 and R2 independently backed up and restored to an isolated test environment with a fictitious upload | School owner + technical witness | **Critical blocker:** original key escrow not verified. Never rotate or overwrite it as a shortcut |
| Privacy and consent | Signed retention, student/agency release, privacy, incident/complaint, sharing and data ownership policies; opt-outs honored | School leadership/legal review | Approval and delivery testing pending |
| State/Federal compliance | Verify Class A program requirements with actual North Carolina/Texas school regulators, each registered FMCSA location, training/permit rules, student records, tests and site credentials | School operators | School checklist and manual TPR tracking cannot certify compliance |
| Practical usability | Alisha/Manny/admissions/instructors complete phone and Dell scenarios with no unexplained jargon, errors or hidden menu choices; confirm accessible color, keyboard and readable mobile text | School leadership | Human usability evaluation pending |
| Secure release | All PRs have green CI; production Cloudflare job succeeds on exact main SHA; public health revision matches and unauthenticated data remains inaccessible | Engineering | Confirm exact SHA for each release; public checks do not validate authenticated workflows |

## P1 — full product features that can ship after P0 without changing eight menus

1. **Admissions:** applicant-facing verified enrollment, waitlist, self-booked tours, repeat inquiry recovery and explicit consent-aware follow-ups.
2. **Training:** fully versioned ELDT unit maps approved per location; theory modules/student study library and instructor checkoff evidence; scoped student dashboard, approved retakes, remediation and road/yard skill progression.
3. **Daily operations:** recurring instructor availability, yard stations, substitution approvals, actual per-route driving logs, truck defect photos/repair evidence and service schedules. A planned lesson never credits training hours.
4. **Workforce and career:** WIOA authorization amounts/dates, billing milestone packets, employer contingent letter evidence, graduate 30/90-day follow-ups and verified placements. Do not promise graduates employment.
5. **School management:** staffed phone/Dell home screens, analytics with dates/denominators, campus comparisons, audit-ready owner reports, staff coaching and quality cases, human-approved workflow rules.
6. **Communication:** verified email/SMS delivery receipts, quiet hours and recipient STOP webhooks, opt-in messaging. No message from the system until approved providers and consenting test recipients are verified.
7. **Student portal:** controlled, limited self-service with only their records, schedules, progress and study material, independent login, revocation and verified documents. Existing code is intentionally disabled until the school authorizes it.
8. **Finance:** verified payments, refunds and funder invoicing backed by reconciliation. A manual tuition entry does not equal a bank settlement.

## P2 — external integration gates, not automatic project blockers for local school evaluation

- **FMCSA TPR direct web service:** Obtain official provider onboarding, technical specification, testing credentials and approval. Test the correct API/XML schema, error/correction handling, receipts and retry-safe submission. Until then, school staff submit through the official TPR portal and manually record the verified reference. The agency requires certifications to be entered by the second business day after successful training completion; holiday/eligibility handling must be checked with FMCSA.
- **AI:** Add school-approved OpenAI API key as Cloudflare secret and separate billing; test with fictional school information. Do not send protected student records without additional governance and provider review.
- **Text/email:** Owner-approved Twilio and Resend sender credentials, registered sending configuration, opt-in and unsubscribe tests.
- **E-signatures:** Contract with an approved signature provider and verify signer identification, legal jurisdiction, storage and audit receipts; existing uploaded signatures do not constitute a connected e-signature service.
- **Payments and accounting:** Processor/business merchant account, verified webhook signing, idempotent ledger and refund approval; optional Salesforce integration only if the school decides a second master system is worth the expense.

## Scope and branding

The user interface stays organized into **Home, Students, Admissions, Training, Team, Partners, Payments, School Setup**. New capabilities appear under the closest task area, not as more top-level sidebar items. Use plain language and an Apple-inspired, original, touch-friendly design on iPhones; Dell/Windows keyboard controls and browser support remain first-class.

The goal is **one source of truth**, not importing five competitors or mirroring Salesforce records and creating disagreements. Keep lead → student → school program → instructor evidence → graduation and placement linked through auditable source IDs.

## How to close a milestone

Every change needs: assigned owner, software implementation, automated regression tests, production release at a known commit, fictional campus walkthrough, human reviewer and dated evidence. For real student data, additionally require original encryption key custody and independently successful Cloudflare restore. **No green check in GitHub, screenshot or staff assertion alone satisfies that last requirement.**

The application’s **School Setup → Get Started** page now contains an owner-only internal acceptance tracker for 15 schoolwide and campus-specific checks. It records original source/date and responsible owner identity, but it cannot activate disabled features or issue government approvals. The actual school operator must do the verification.
