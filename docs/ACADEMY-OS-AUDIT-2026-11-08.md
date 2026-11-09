# Academy OS operational audit — 2026-11-08

## Scope and evidence
- Reviewed repository code, production deployment workflow, API route registration, staff timeclock, payroll reporting, campus workflow scheduler, school search privacy, TPR submission controls and official FMCSA TPR Web Services Development Handbook v1.2.
- The last deployed version prior to this audit was c18e6bafcdfb73d70e53c1a1ec2cb945e3c11ccd; production workflow 42509700752 reported success, including live release SHA/anonymous denial smoke checks.
- Automated quality tests and Cloudflare bundling exercise source and simulated data; they **do not demonstrate a complete real-user click-through**. No student, employee, payroll, or FMCSA live submission record was created for this review.
- Existing single-employee timeclock, finance, integrations and student portal features were inspected at the source level. This audit is not a legal payroll certification, a regulatory audit, or formal pentest.

## Issues identified and fixes in this audit
1. **High — Wrong workweek on East Coast punch:** timeclock POST previously used UTC date to determine locked payroll week; close to midnight the Eastern week can differ. Changed to America/New_York and regression-checked against overnight shift fixture.
2. **High — Timesheet approval could bypass outstanding corrections:** approval did not query pending requests and rejected legitimate completed shifts spanning Sunday-to-Monday because it required the first punch within the UTC week to be clock-in. Approval now requires zero outstanding corrections, completed paid intervals, valid transition sequence and Eastern week accounting. Approval remains human-only.
3. **High — Cross-campus payroll data exposure:** correction request GET returned all requests for any employee shared with an authorized campus manager, even requests from another campus. Filtered by actual or proposed punch work campus.
4. **High — Federal driver identity mismatch:** TPR submit preflight previously accepted a typed first/last name, issuing state or Class A/B code inconsistent with the school student record. Added identity and program consistency gates. Live transmission still requires the provider's credentials, test acceptance and explicit enablement; no government submissions were attempted.
5. **Medium — AI provider data leakage risk:** arbitrary status/phase text could be included in the supposedly anonymous AI evidence. External model input now whitelists categorical values; the UI reports whether any categorized metadata was sent even if the provider fails.
6. **Coverage — scheduler idempotency:** added a real (in-memory, no production data) schema-driven run exercising creation, audit, campus scoping, same-day repeat and next-day no-duplicate behavior.

## Release and functional verification matrix
| Area | Existing evidence | Still required for signoff |
|---|---|---|
| Cloudflare hosting, release SHA | Existing production workflow and public health checks | New audit release deployed with matching SHA |
| Public authentication and CSRF default-deny | Existing release smoke checks | Authenticated session tests for each role |
| Class/ELDT/student lifecycle | Curriculum, student portal, attendance, theory and graduation tests | Scripted enrollment-to-graduation journey with fictional student in isolated staging |
| Yard and fleet safety | Dispatch, staff qualification, vehicle defect and overlap unit tests | Real UI scheduling and conflict/defect simulations in staging |
| Admissions and funding | Admissions and partnership unit tests | Real lead appointment/funding workflow with test-only records |
| Time clock | Timeclock component, API route and payroll interval tests | Real sign-in, punch/break and correction approval by two separate test accounts |
| Cross-campus payroll | Overtime unit tests; improved local-week and correction guards | Effective-dated rate/bonuses/classification/tax and external payroll signoff |
| Scheduled workflow | New isolated end-to-end scheduler DB test | Observe cron on staging after owner enables one rule; confirm email/SMS absent |
| School AI search | Permission checks, category-only external evidence; optional integration | Test with all roles and actual provider credentials; provider availability and billing |
| FMCSA TPR | Reviewed official provider handbook, key-signing tests, preflight and fail-closed gates | Provider-generated credentials securely installed; test payload/response validated against FMCSA test environment; explicit owner signoff; real receipt reconciliation |
| Files, document center, announcements | Existing modules and tests | R2 storage, encryption/decryption recovery drill, upload/download with fictional documents |
| Partner/student portals | Existing tests and role projection | Real browser login and consent/revocation checks |
| Accessibility/mobile | Build and server render checks | Device testing, screenreader/keyboard walkthrough; WCAG assessment |
| Backups/disaster recovery | D1 Time Travel bookmark step | Documented restore rehearsal without production data loss |

## Release criteria
- No production student/employee records used in automated integration tests.
- All GitHub quality gate checks must pass, followed by Cloudflare production deployment and matching release SHA smoke checks.
- No external FMCSA transmission or payroll disbursement from tests.
- User account role is **not changed**.
- Treat all untested authenticated workflows as **pending staging acceptance**, not already finished.

## Payroll completion review — 2026-11-09

Preserved the newer integrated employee clock, correction requests, campus payroll, saved pay-rate audit and owner demo. Added visible provisional overtime columns, explicit approved straight-time subtotal and draft-export labeling, and clarified that meal buttons stop paid time while paid breaks remain clocked in. Hardened both CSV exports against formula injection, including whitespace prefixes. The production smoke check now requires anonymous access to timeclock, payroll report and punch correction routes to return 401. No schema or student record changes in this follow-up.

Outstanding: authenticated production acceptance by employee and manager; effective-dated rates and immutable historical payroll snapshots; payroll-provider reconciliation. The module remains a reviewed worksheet, not a payroll disbursement service.

Potential next investments beyond existing modules (proposals, not completed): equipment outage recovery with rental/vendor quotes and owner purchasing decisions; capacity forecasting that simulates loss of a truck or instructor; a dedicated learning/support case handoff tying barriers and recovery plans to a staff owner; automated service-error alerts and rehearsed recovery evidence. Extend existing fleet, dispatch, support and readiness screens rather than creating competing modules.

## Seven-role preview workspace — 2026-11-09

The owner Preview menu opens an isolated fictional workspace for Owner, Regional admin, Campus manager, Admin assistant, Enrollment specialist, Front desk and Instructor. Navigation and starting pages follow the existing role configuration. Instructor attendance, admissions, calendar, tasks, dispatch, lesson checkoffs, daily review, insights, school knowledge and student views reuse the real presentation components with local-only state. API-backed modules use explicitly illustrative examples; they do not connect to payroll, invitations, messaging or file services. Preview exit preserves the parent workspace and real account permissions. Student avatars skip remote photo reads in this preview.

Verified: seven-role menu/start-page/shortcut checks, fictional campus filtering, SSR for all seven roles, full regression suite and Cloudflare dry run. Browser QA switched every role, inspected instructor/front-desk/owner views and confirmed exit callback. This is a product demonstration, not authenticated authorization acceptance for all employee accounts.
