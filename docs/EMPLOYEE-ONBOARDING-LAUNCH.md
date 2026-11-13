# Employee Onboarding Center — approved scope and production gates
Decision date: 2026-11-13. Parent issue: #107. Status: **policy foundation only — not deployed**.

## Confirmed product decisions
- **Final approval:** Campus manager **for their assigned campus**. Owner may audit but does not automatically complete final onboarding. No cross-campus approval.
- **Review:** Campus manager and **authorized HR**, with separate reviewer acknowledgement and manager approval. An employee cannot self-approve. Campus manager access to personnel-checklist metadata does not confer access to bank account numbers, W-4 / NC-4 answers or I-9 identity evidence. Restricted-access grant is independently administered.
- **Invitations:** email **and** text. Both must show their real delivery outcome; if a provider is disconnected or fails, report failure, never claim sent. A manually copied secure invite remains an optional fallback only with audited issuance and verified identity.
- **Rollout:** all campuses supported, isolated by campus. Stage deployment and verify each campus independently before permitting production submissions.
- **School employment application:** separate from post-offer employee intake; HR handles the application and offer approval.

## User experience to implement
1. HR creates a contingent onboarding case after documented acceptance of employment offer.
2. An authorized manager starts an employee checklist (campus, role, start date, required form versions) and sends two-channel invitations using one-time, short-lived, hashed and revocable token.
3. Employee authenticates, confirms identity, consents and completes mobile-first personal details, federal W-4, NC-4/NC-4 EZ, I-9 Section 1, emergency contacts, restricted direct-deposit input, school policies; instructor/recruiter licensing only if applicable.
4. Employee saves draft and returns; shows per-form status with accessible field-level errors. Server-side rules guard before/after hire date, acknowledgment time, signature authenticity, audit trail and expiration.
5. Authorized HR verifies submissions, returns individual forms for correction with reason, and performs employer I-9 Section 2. Section 2 is not an employee self-service form.
6. Campus manager reviews completion evidence and formally approves activation for their assigned campus.
7. Secure export generates an ordered personnel PDF, a **separate** restricted payroll/tax packet only for explicitly entitled payroll users, and a separately retained I-9 file. Printing is logged; no sensitive content in ordinary staff/student workspace records.
8. After verified HR review, I-9 employer completion and manager final approval, staff account/time clock/payroll provisioning becomes eligible; never activate as a side-effect of invitation creation.
9. Add synthetic demo onboarding walkthrough for employee, HR reviewer and campus manager.

## Implementation order
- [x] Define documented decisions and policy helper foundation with tests on feature branch.
- [ ] Server-side D1 case/invite/form/version schema, encryption-at-rest guarantees and audit; time-limited tokens hashed at rest, CSRF/replay protection, rate limits, idempotent sends.
- [ ] External employee login/session isolation and accessible frontend.
- [ ] Double-channel delivery adapters with explicit failure/receipt state, per-provider connection validation.
- [ ] Versioned official form experiences, legally valid e-signing proof, I-9 independent workflows and retention policies.
- [ ] Restricted storage and least-privilege exports; signature/audit tamper test; staff/HR independent reviewer identity.
- [ ] Integration with HR + staffing; no role expansion from existing general staff records.
- [ ] Automated policy, API, security, PDF, accessibility and D1/R2 restore tests, with three-campus fictional employee acceptance.
- [ ] Review, merge and production deployment after acceptance; enable feature flag **only after** signed security/legal gate.

## Absolute blockers
The Academy README currently states private file uploads are disabled in production pending original encryption-key custody verification, independent disaster-recovery restoration and school acceptance. Do not touch existing encryption secrets or reopen private uploads to work around that. User's approval of the workflow **does not authorize** bypassing those production safety gates. No real employee banking details, SSNs or eligibility documentation in development, source control or demo mode.

## Regulatory checks before release
Use official IRS 2026 W-4, NCDOR NC-4/NC-4 EZ and current USCIS I-9; verify electronic form and signature compliance, I-9 dates and retention. Do not assert generic "click-to-sign" meets electronic IRS/USCIS standards. Verify current NC DMV instructor/recruiter packet before publishing it.
