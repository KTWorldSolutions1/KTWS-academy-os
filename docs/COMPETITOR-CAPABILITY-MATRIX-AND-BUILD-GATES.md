# Academy OS: one premium operating system for CDL schools

Owner direction: combine the strongest **categories of capability** found in specialized CDL training software, career-college SIS systems, Salesforce-style student relationship platforms and embedded LMS products, while keeping Lone Star's eight plain-language navigation sections. **Do not copy competitors' code, content, certification claims, or UI assets.**

Last reviewed: 2026-10-14. This document distinguishes deployed code, unverified live operations and proposed features.

## Competitive-capability matrix and accountable build queue

| Workstream | Current Academy OS baseline | Missing / follow-on work | Done means |
| --- | --- | --- | --- |
| Admissions CRM | Lead capture, event intake, campus-scoped referrals, appointments, stages, dedupe, enrollment handoff | Verified public application portal, smart consent-aware nurture, waitlists, tour self-booking and employer referral APIs | Fictional website applicant completes accepted enrollment on all three campuses without retyping and without unsolicited messages. |
| Student 360 | **New:** consolidated stage, training, drive vs observation hours, skills, next lessons, evidence gaps, accessible only from scoped records | Longitudinal communication timeline, standardized support plans, student-authorized data access, transfer workflow | Every displayed metric links to the exact evidence and staff permitted for that campus. |
| Daily operations | **New:** manager-planned instructor/student/vehicle assignments, collision rejection, vehicle defect holds, manager clearance; staff scheduling and daily work focus | Recurring instructor availability, yard stations, state-approved road routes, substitution approvals, capacity planner, dispatch notifications | On fictional campus, a truck defect suspends its future assignments; the manager reassigns safely, preserving history. |
| ELDT training / LMS | Instructor attendance, append-only corrections, rubric skill evaluations, versioned quiz answers, lessons, 80% theory threshold, separate BTW driving/observation and night evidence | Complete school-approved curriculum unit map; secure student login, lessons, accessibility and multilingual support; retake policy and content versioning | A fictional student advances theory → yard → road with defensible instructor evidence, remediation, locked assessments, and no automatic hours. |
| TPR / regulatory evidence | **New:** evidence review for theory, range and public road; local TPR confirmation tracking; management-only official submission attestation | FMCSA Training Provider **Web Service** onboarding/certificates, sample sandbox submissions, resilient exact-once outbound queue, corrections, receipts and reconciliation; separately approved NC/TX requirements | Official provider credentials are authorized; the sandbox round-trip and approved production record are accepted by FMCSA and source receipts match the school record. **Not connected today.** |
| Sponsor / WIOA | Funding tracking, agency portal with student-specific release grants, employer-specific contingent letter review | Authorization amount and coverage, attendance milestones, deliverable/reimbursement packets, agency billing, expiration escalation | No released reports exceed authorization; sponsor payments and requested hours have traceable support. |
| Student finance | Manual tuition ledger and financing contact/funding stages | Stripe/other processor with reconciled verified webhooks, approved adjustments/refunds, aged receivables, signed contract cross-check | Replay of a payment event creates exactly one receipt; ledger ties to actual settled funds. |
| Student & employer portals | Agency-representative portal, internal student progress reports, employer relationship/career outcome tracking | Separate student account and job portal with explicit consent and scope, internship/employer applicant intake, interview scheduler, 30/90-day checks | A student can access ONLY their records, revoke authorized disclosures and see accurate account/schedule status. |
| Fleet / safety | Truck records, service reminders, new instructor-origin defect reports, manager repair clearance, dispatch holds | Pre/post-trip inspection templates, defect photos and approvals, periodic mileage/service histories, incidents/near misses, insurance audits | Out-of-service trucks cannot be scheduled through any entry point, and every release has a qualified reviewer trail. |
| Staff operations | Staff invitations, campus roles, weekly shifts and hours, instructor check-in | Credentials with expiration evidence; substitution chain and shift handoff; evaluations; onboarding/offboarding procedures | Employee exit invalidates access, preserved records remain attributable, assignments re-route. |
| Communications | Local drafts, email/SMS API pathways gated by consent/opt-outs | Provider account approval, webhook delivery evidence, quiet-hours/STOP handling, unified inbox, reminder rules | Provider-delivered opt-in message is tracked end-to-end without sending duplicate or opted-out messages. |
| Data / owner intelligence | Three-campus records, manager report, control dashboard and role-scoped daily actions | Funnel analytics with denominators, class profitability, time to first contact, cohort outcomes, forecasting explicitly marked as estimates | Owner drill-down across Greensboro, Mansfield and Dallas matches read-only source records. |
| AI | Local business drafting and a privacy-gated OpenAI endpoint awaiting credentials | Read-only campus-aware copilot with record citations, token controls, human-approved task plans, usage and cost limits | AI cites authorized school records, never reveals other-campus students and cannot submit training/financial decisions autonomously. |
| Integrations | GitHub/Cloudflare CI, D1/R2, proposed provider interfaces | Versioned event/outbox integration layer, Salesforce API adapter if actually requested, webhook signatures, per-campus mapping, dead-letter replay, provider outage status | Simulated duplicate/out-of-order events cannot change financial, training or identity truth; live access only after approval. |

## Nonnegotiable product principles

1. **Eight top-level sections stay.** Add a task under the closest existing section; never return to a sprawling sidebar. On iPhones use large touch targets and the bottom dock, on Dell/Windows use keyboard search and high-density views.
2. **One source of truth.** Lead converts to enrollment; enrollment links to class; instructor actual logs feed student progress, evidence preflight, graduation review, WIOA packet and outcome tracking. Do not give unrelated departments duplicate editable copies.
3. **Actual vs planned vs verified** are separate states. A scheduled lesson is not attendance, an observed drive is not student-operated time, a manually tracked FMCSA submission is not a verified official receipt, a job discussion is not a guaranteed hire, and recording tuition is not proof of payment.
4. **Least privilege with audit.** Owner sees campuses authorized across school network; campus staff work only in assigned locations; sensitive student files and disclosures require narrow consent. No anonymous/public student search.
5. **A failed safety or compliance rule blocks unsafe transitions**, with explicit reason, source and manager resolution; it must not silently credit training or auto-complete regulatory forms.
6. **No provider mythology.** Third-party integrations are only connected when authenticated, tested and accepted; no blanket claims of FMCSA approval, free theory acceptance, automated TPR submission, or legally enforceable e-signatures.
7. **Human-first design.** Typical flows should finish in 2–3 clear taps with readable words and source-linked warnings, for instructors, managers, admissions, and case managers with different experience levels.

## Approved architecture direction

- Separate **read** and **write** permissions, application roles and campus scope at the Worker API, not only in React.
- Protect student uploads by R2 encryption with recoverable school-controlled keys, audit and tenant-bound document metadata.
- Keep actual training evidence append-only with source identity, date, phase, unit, instructor, attendance, proficiency and corrections.
- Plan later integrations through versioned event records with signed webhooks, dedupe keys, safe replay and external reconciliation. Keep secrets only in Cloudflare secrets or other approved vaults.
- Enable student accounts only after identity, parental/consent applicability, role and ownership, retention, breach response and backup/restore acceptance are approved.
- Regulatory configuration is **per registered campus**; do not assume North Carolina and Texas have identical state-specific training, instructor and licensing requirements.
- P0 testing uses fictional data; no production protected student uploads until key recovery and isolated D1/R2 restore drills and owner acceptance.

## Release gates

**Gate A — Technical deployment:** CI tests + server build + Cloudflare production job for the exact main SHA, with public health-revision match.

**Gate B — Security acceptance:** Three-campus fictional data round-trip, owner and every employee role, redactions, revoked sessions, synthetic encrypted file upload/download, safety hold, calendar overlaps and external partner grant revocation, plus backup/key restore.

**Gate C — School operations:** Alisha and Manny review UX, staffing, cohort weeks and approval language; instructor practices attendance, yard/range and public-road evidence; the owner signs off regulatory/retention policies.

**Gate D — Providers:** Authorized credentials, contracts and sandbox acceptance for FMCSA, e-signature, messaging, payments and optional AI. Only the verified feature is then labeled Connected.

A green CI check **never** satisfies Gates B, C or D automatically.
