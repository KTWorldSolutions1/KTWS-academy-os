# Lone Star Academy OS — Production release and acceptance

Updated: 2026-10-14 (Eastern). This record distinguishes **code merged**, **CI verified**, **public deployment verified**, **authenticated operator checks**, and **approved for use with protected student data**. They are different conditions.

## Release mechanism
- GitHub Actions `.github/workflows/academy-quality.yml` builds and runs automated Node/Cloudflare quality gates for proposed commits.
- GitHub Actions `.github/workflows/academy-production.yml` supports manual release and automatically runs after a successful quality gate on the main branch. It checks out the specific tested commit and skips a superseded release when main has moved forward.
- Cloudflare Worker/D1/R2 are deployed to `academy.ktworldsolutions.com`.
- A release must pass the public HTML, unauthenticated 401 response, and `/api/health` HTTP 200 smoke checks. Newer deployments additionally validate that the public health-reported source revision matches the reviewed commit.
- A green public deployment **does not** prove authenticated student data, instructor permissions, encryption key presence, state licensing or operational approval.

## Acceptance evidence
- **Public deployment:** Previously observed successful production releases and signed-in administrator. Verify current specific latest SHA against Actions and `/api/health`; do not interpret a run whose checked-out SHA differs from main as proof of the latest release.
- **Administrator access:** Owner reported successful sign-in and student form loading.
- **Campuses:** User created Greensboro, Mansfield and Dallas records. The Add Student campus selector displayed all three in production.
- **Student records:** Add Student modal verified to open. Creating, retrieving, editing, correcting, assigning cohorts, exporting, and closing fictional student records across campuses **not yet signed off in production**.
- **API authorization:** Local automated tests exercise login, employee activation, campus isolation, role-specific redaction, authorized records, restrictive encrypted file access, document reference integrity and audit behaviors. No independent production penetration test or live employee-role acceptance recorded.
- **Training:** Code/tests cover attendance, append-only daily training logs and revisions, skill rubrics, 80% school threshold, separately configured student-driving and observation hours, classroom/yard/road and week-five testing workflows. Actual dusk-to-dawn driving evidence remains a verification/implementation item; do not infer night driving solely from clock time. The school must verify its approved NC/TX curricula and state-specific rules before enforcing numeric targets.
- **Staffing:** Weekly proposed/approved scheduling with 40-hour paid planning and break deduction, campus manager/owner role scopes and overlap detection. This is **not** Sling timesheets or payroll.
- **Leadership:** Weekly manager briefs generated from scoped records and labeled drafts; no claims of automated employer acceptance or legal approvals.
- **AI:** OpenAI-based privacy-confirmed business drafting backend and Studio UI implemented, with server-side campus scope, request caps, `store:false`, and mocked-provider tests. **NOT active until a valid OPENAI_API_KEY secret and API billing are provided; a real provider call has not been verified.** No student data retrieval is wired into AI.
- **Third parties:** Twilio/Resend messaging paths are provider-dependent, electronic signatures require an external service, WIOA representative portal now has separate authenticated case-manager access and consent/revocation code, with automated integration tests. Live account provisioning, authorized releases and external-agency acceptance have **not** been performed. FMCSA TPR is a manual tracked workflow rather than verified submission.

## Release blockers for confidential student records
1. [ ] Verify the secret `RECORDS_ENCRYPTION_KEY` is correctly configured in Cloudflare (without exposing or copying its value); verify actual authenticated encrypted R2 file upload/download.
2. [ ] Test three fictional students, one per campus, from lead to enrollment, class assignment, phase transfer, daily instructor log/correction, final assessment, testing and graduation review. Preserve evidence and remove/retire test-only records according to the documented retention process.
3. [ ] Test active campus manager, instructor, enrollment, admin assistant and front desk accounts; confirm expected API deny/allow behavior and field projection, not just hidden UI.
4. [ ] Inspect live D1/R2 backup and recovery capability; perform an authorized restore drill using disposable data.
5. [ ] Verify NC/TX school/yard/instructor licenses, student training records, drug-screen policies, CLP and testing/TPR processes with appropriate authorities. Do not imply approval from website screenshots.
6. [ ] Document school's privacy/data governance, lawful collection, student consent, retention, incident handling and approved external disclosures; confirm Lone Star business-data ownership separate from KTWS domain and repository operations.
7. [ ] Connect and test optional OpenAI, SMS, email and e-signature providers only once the relevant account owner approves credentials and billing; never commit secrets.
8. [ ] Verify the implemented WIOA representative sign-in, school-approved per-student verified information-release documents, grant expiry, restricted fields, per-campus access, revocation and audit in the live environment using fictional participants. Do not invite external agency representatives until the consent process, credentials and governance are signed off.
9. [ ] Owner acceptance record: date/time, campus, tester, scenario, evidence of pass/fail and signoff.

## How to perform owner review
Sign in to Academy OS as owner, open **Employee launch setup → Production readiness review**, and run the checks. Any automated result is a configuration signal, **not** a legal certification or a substitute for the manual acceptance steps above.

No external system is considered integrated merely because a corresponding menu or API route exists.
