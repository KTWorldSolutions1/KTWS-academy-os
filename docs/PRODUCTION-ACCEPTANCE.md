# Academy OS production acceptance and operational backlog

Updated 2026-10-14. Status labels: **Verified** = observed in live UI; **Implemented, unverified** = code exists, end-to-end production behavior not confirmed; **Not implemented** = no live integration. Never interpret a menu or sample record as proof of operational readiness.

## Verified in production
- GitHub Actions production release succeeded and administrator signed in.
- Greensboro, Mansfield TX, and Dallas TX were created by administrator and appear in Add Student campus selector.
- Add Student form opens; no student save/retrieval acceptance test yet.

## P0 — Must pass before using actual student PII
- [ ] Create clearly labeled fictional test student in each campus, save, reload, edit, confirm revision, delete/retire test data with auditable retention approach.
- [ ] Verify enrollment -> class -> classroom -> yard -> road -> testing week -> graduation; five-week Class A program, week five testing.
- [ ] Test daily attendance including not-recorded vs absent, late, corrections and immutable audit evidence.
- [ ] Verify individual daily driver training logs: date, instructor, phase, vehicle, student-operated driving vs observation, hours, correction provenance; regulatory thresholds require jurisdictional verification.
- [ ] Test student uploads, encrypted R2 storage, retrieval, verified status, and inability to read across campuses.
- [ ] Test employee invitations, password/session/logout, campus scopes, restricted student fields, owner-only actions, and API authorization (not just UI).
- [ ] Review document handling, data retention, backups/restore, incident response, and consent before real PII.

## P1 — School workflows from operations conversations
- [ ] Admissions leads, tours, enrollment, class capacity, funding authorizations, payments, promotions and 20 extra hours if needed.
- [ ] Instructor onboarding/credential verification, student yard/road phase transfers, skill matrices, 80% theory threshold, assessments and graduation signoff.
- [ ] Greensboro, Mansfield, Dallas independent campus reporting and cross-campus owner view.
- [ ] Staff scheduling/timekeeping, full-time expectation and meal-break handling, leave/absence, credential expiry, employee offboarding.
- [ ] Equipment readiness: yard/vehicles/inspections, truck approvals, instructor licensing and site approval tracked separately for NC/TX; do not mark approved without documentary evidence.
- [ ] Agency/WIOA/Voc Rehab sponsorship, authorized progress reporting, external partner portal with explicit restricted scope.
- [ ] Employer partnerships (USA Truck, PAM, Publix, Pepsi/Coke, others), MOUs, contingent offers, referrals, placement and outcomes.
- [ ] Events: 2026-10-17 health fair, 2026-10-31 Truck-or-Treat, 2026-11-06 grand opening, 2026-11-20 community resource/second-chance fair; task owners, outreach, lead source, event follow-up.
- [ ] Automated weekly manager reports, operational risks and approvals.

## P2 — External services and legal/compliance verification
- [ ] OpenAI provider: live API integration NOT implemented. Key creation/billing and secret installation require authorized account holder; do not send student PII to provider before explicit policy/consent review. Role and campus enforcement server-side, prompt-injection/data minimization tests, audit, cost caps.
- [ ] Email/SMS providers: code paths exist; configure Resend/Twilio credentials and test with opted-in test recipients. No credentials in repository.
- [ ] E-signature: provider not integrated; signed-file manual workflow is not equivalent to a verified e-signature integration.
- [ ] FMCSA TPR: no live integration; verify school workflow, TPR account authority, CLP/testing and state-specific rules with regulators.
- [ ] WIOA external partner portal: not complete; don't advertise it as operational.
- [ ] Formal NC/TX regulatory review of instructor, yard, curriculum, drug screen, record retention and student testing rules.
- [ ] Backups, restore drill, performance/mobile accessibility, audit log retention, alerts, recovery.

## Deployment and release verification
- Deployment requires GitHub Actions academy-production workflow to run; a GitHub commit alone does not mean the live site updated.
- Verify workflow green, authenticated GET /api/records, protected file API, role-scoped records, negative authorization tests, and browser functionality after every release.
- Do not import live student records until P0 is signed off.
