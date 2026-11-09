# Academy OS requirements register

Updated 2026-11-08. This is the acceptance record for recovered requirements and the owner's newly accepted product direction. It is NOT a complete historical transcript. Sources: **C** = pasted Cohort Integration Report extract; **S** = pasted Structure CDL Curriculum inventory (summaries unless explicitly quoted); **I** = seven curriculum screenshots supplied by the owner; **N** = twelve product proposals accepted with “make it happen captain”; **R** = repository documentation used as implementation evidence, not independent proof of owner approval.

Status meanings: **Code** = implementation found, live acceptance outstanding; **New** = implemented in this change, not yet released; **Partial** = narrower than requested; **Blocked** = requires source material, provider/account access or production verification; **Open** = not implemented or not fully audited. No row is marked live-complete on code or historical assistant claims alone.

## Classroom and driver readiness
| ID | Source | Requirement and acceptance criteria | Status / evidence / next action |
|---|---|---|---|
| EDU-01 | S | Cover all 30 standard Class A theory topics; each must have an assigned lesson and real completion evidence | Code: lib/classroom-curriculum.ts, lesson checkoffs; licensed mapping outstanding |
| EDU-02 | S,I | Use actual licensed J. J. Keller course IDs, edition, durations and assessments | Blocked: school course export absent; never fabricate the alleged 48-course list |
| EDU-03 | I | Six-hour Monday orientation covering welcome, attendance, conduct, program sequence, licensing, medical, drugs/alcohol, careers and CDL responsibilities | New: explicit checklist in driver-practice.ts; school must verify instructional eligibility and durations |
| EDU-04 | I | Every learner identifies tractor-trailer components on a diagram | New checklist and instructor evidence step; interactive seven-part vehicle diagram now included; supervised vehicle walkaround still required |
| EDU-05 | I | Teach deadhead, bobtail, drop and hook, live load, detention, layover, home time, lumper | New: eight-term reveal exercise with definitions and scenario |
| EDU-06 | I | Introduce HOS and display/explain a driver's clock Tuesday | New: Tuesday curriculum block and appended instructor step, without rewriting historical step IDs |
| EDU-07 | I,N | Interactive driver clock: duty changes, delays, remaining counters and calculation feedback | New: driver-practice-lab.tsx; single-shift fictional model only |
| EDU-08 | I | Teach 11-hour, 14-hour, break and cycle calculations | New: boundary-tested counters and three individual exercises; FMCSA source linked |
| EDU-09 | I | Teach restart, cycle recap and qualifying split-sleeper scenarios | Partial: workshop outline and FMCSA ETHOS handoff; full multi-day simulator remains open |
| EDU-10 | I,S | Wednesday paper logs and ELD practice with individual review | New: electronic duty timeline and paper-log worksheet; not a certified ELD or official log |
| EDU-11 | I,S | Thursday atlas, truck restrictions, mileage, stops, fuel, parking, time zones, ETA | Code + New: existing workshop, new written route worksheet and scenario checks; instructor reviews actual map work |
| EDU-12 | I,S,N | Reject infeasible dispatch and communicate delay, available hours and revised plan | New: interactive decision assessment, feedback and written dispatch response |
| EDU-13 | I,S | Friday professional driver-readiness challenge, separate from theory final | Code + New: combined scenario plan and practice checks; written work requires instructor grading |
| EDU-14 | I,C | Reconcile 50 instructional hours with 7 AM–4 PM and actual breaks | New: feasibility calculator flags 40 hours/10 short at five days with 60-minute breaks. Final school allocation still blocked; never auto-credit shortfall |
| EDU-15 | S | Instructor daily teaching mode with per-student checkoffs and green/yellow/red feedback | Code: driver-playbook.tsx and daily lesson reviews; new lab accessible alongside it |
| EDU-16 | S | Preserve theory, yard, actual driving and observation categories | Code: training/attendance modules and tests; production record review outstanding |
| EDU-17 | S,N | Identify missed topics and create student-specific remediation with owner/date/outcome | Code: learning diagnostics and operations support cases; full automatic linking of lab results intentionally not added |
| EDU-18 | S | Five-week/25-day progression and additional practice policy | Code: driver-training-plan.ts; final schedule/state policy needs school confirmation |

## Student lifecycle and school operations
| ID | Source | Requirement and acceptance criteria | Status / evidence / next action |
|---|---|---|---|
| OPS-01 | C,S | Eleven Greensboro cohort learners visible across authorized workflows | Blocked live verification: later user report says imported; do not duplicate or assume absent |
| OPS-02 | S | Accurate contact, funding and starting-status data | Code: roster import and sponsor fields; compare authorized source/live records before edits; no personal data in this register |
| OPS-03 | C | Show 40 reported prior classroom hours separately from verified attendance | Code: pending-hour visibility and reviewed import; live values not inspected |
| OPS-04 | C | Bulk attendance and individual performance review before saving | Code: training-center; requires signed-in batch/save/reload acceptance |
| OPS-05 | C | Default 07:00–16:00 schedule with break deduction | Code: admissions/training; EDU-14 flags capacity conflict |
| OPS-06 | S | Enrolled → Classroom → Waiting for permit → Yard → Road → Testing → Graduated with retained history | Code: journey and status controls; stage placement is not completion evidence |
| OPS-07 | S | Auto-yard only after 50 verified hours, verified CLP, verified drug result and management clearance | Code: yard-promotion.ts and server saves; negative and positive automated tests present |
| OPS-08 | S | Editable class transfers without erasing prior attendance | Code: admissions and training history; live acceptance outstanding |
| OPS-09 | S | Campus/user-assigned tasks and appointments | Code: team-assignments and calendar; live role tests outstanding |
| OPS-10 | S | Calendar includes class dates, birthdays and closures with appropriate visibility | Code: school-calendar and role-filtered data; closure does not auto-reschedule training |
| OPS-11 | S | Staff work calendar and schedule coverage | Code: staff-scheduler and availability; live walkthrough outstanding |
| OPS-12 | S | Announcements and portal banners | Code: school notices and student projections; no implied automatic SMS delivery |
| OPS-13 | C | Settings and Connections open for authorized managers | Code in deployed baseline 94e8956; post-login navigation not witnessed |
| OPS-14 | C | Explain dashboard alert count and resolve only when evidence changes | Code: attention-alerts; actual production alerts not read |
| OPS-15 | C | Restore loading and verify entire application | Hotfix cddaef8 deployed and owner confirmed sign-in works after alert-render correction. Recovery boundary added in this release; other signed-in workflows still require acceptance |
| OPS-16 | N | “Today at My Campus” prioritized role-aware workspace | Code: today-focus/daily-focus, campus filter; employee ownership refinement needs acceptance |
| OPS-17 | N | Explain exactly what blocks each student from progression | Code: yardEntryReadiness and student journey; live verification outstanding |
| OPS-18 | N | Campus capacity across seats, staffing, trucks and appointments | Partial: operations capacity, dispatch conflicts and availability exist; predictive future bottlenecks not complete |
| OPS-19 | N | Reusable campus setup with state-specific policies kept separate | Partial: campus setup and per-campus draft lesson creation; full versioned campus template replication open |

## Student portal, records and communications
| ID | Source | Requirement and acceptance criteria | Status / evidence / next action |
|---|---|---|---|
| PORT-01 | S,N | Dedicated student portal with personal progress, stage and actionable next step | Code: student-portal and career-journey; production feature flag remains disabled |
| PORT-02 | S | Driver Pulse access for career profile/applications | Code: external handoff; no API sync, resume transfer or application submission claimed |
| PORT-03 | S | Profile photos and printable ID/badges | Code: badge studio/private photos; secure upload enablement blocked |
| PORT-04 | N | Student can practice skills without changing school records | New: shared lab in authenticated student portal and fictional demo; no server writes |
| DOC-01 | S | Secure student vault and agreement attachment | Code: encrypted files endpoint; production key custody/restore and access validation blocked |
| DOC-02 | S | Student upload and missing-document notices | Code: portal document requests; production upload flag disabled |
| DOC-03 | C | OneDrive-like school document center | Partial: school-knowledge text/links, publication/version history; general file/folder upload/storage is NOT delivered |
| DOC-04 | S | Private/public document audience controls | Partial: private student files and staff library audiences; unrestricted public-file publishing not implemented |
| DOC-05 | S,N | DMV roster/evidence packet including required identity/contact fields and agreements | Code: compliance roster preflight/export; verify state template and authorized production access before use |
| DOC-06 | N | Inspection-ready combined attendance/assessment/proficiency packet | Partial: reports/rosters/checkoffs exist separately; unified complete packet open |
| COM-01 | S | Text/email with templates and reviewed bulk sending | Code: communications and batch route; provider configuration/delivery testing blocked |
| COM-02 | S | Announcements/procedures and applicable prior school policies | Partial: publication workflow exists; full policy source list absent |
| FIN-01 | S | Cash, WIOA, WRLP and other funding plus invoices | Code: funding, approvals and invoices; real award/tuition validation outstanding |
| SEC-01 | S | Multi-campus and role isolation, test users, student privacy | Code with automated isolation tests; live separate-account acceptance outstanding |
| SEC-02 | C,N | Preserve every record, database and file | No production mutations in this change. No reset, deletion, key rotation or schema migration |
| SEC-03 | N | Controlled releases and recovery | Partial: exact-SHA workflow, smoke gates and recovery procedures exist; actual Cloudflare rollback/isolated restore not verified |

## Integrations: catalog is not a connection
| ID | Source | Provider/capability | Status / acceptance |
|---|---|---|---|
| INT-01 | S,R | Cloudflare Worker, D1, R2 | Code; baseline health responds. Cloudflare account login/log inspection still blocked |
| INT-02 | S,R | Microsoft 365, OneDrive, Teams, Power Automate | Catalog/connection guidance; actual OAuth/sync adapters require implementation and account approval |
| INT-03 | S,R | Outlook/Google Calendar | Privacy-minimized ICS export exists; two-way sync open |
| INT-04 | S,R | poliSCHOOL | Catalog/manual handoff; supported API contract and integration open |
| INT-05 | S,R | J. J. Keller | Manual module mapping; licensed catalog and supported integration unavailable |
| INT-06 | S,R | FMCSA TPR | Internal preflight/manual receipt tracking; approved direct submission integration absent |
| INT-07 | S,R | NC DMV / Texas regulators | NC roster export; Texas templates and direct submission open |
| INT-08 | S,R | Twilio / Resend | Sending code; authorized credentials, sender setup and receipt testing required |
| INT-09 | S,R | Stripe | Checkout/webhook code; live merchant validation required |
| INT-10 | S,R | QuickBooks | Catalog; OAuth/accounting sync open |
| INT-11 | S,R | Tenstreet Driver Pulse | External links only; no data transfer or API connector |
| INT-12 | S,R | OpenAI | Authenticated endpoint with privacy gates; school API key/provider testing needed |
| INT-13 | S,R | External electronic signature provider | Uploaded signed agreements supported; external signing integration open |

## Demo, design and audit
| ID | Source | Requirement and acceptance criteria | Status / evidence / next action |
|---|---|---|---|
| DEMO-01 | S,N | Full user-style walkthrough across lifecycle and campuses | Code: operator-demo and owner film; New lab chapter added |
| DEMO-02 | S | 100 fictional students and 50 funding-pending applicants | Code: isolated synthetic demo; never seed these into real D1 |
| DEMO-03 | C | Every addition reflected in demo breakdown | New lab and schedule chapter plus film narration; full register-to-demo audit still required |
| DESIGN-01 | S | User-provided theme and understandable sidebar | Existing theme/menu code; original theme image unavailable for exact color acceptance |
| AUDIT-01 | C,S,N | Preserve every recovered idea with source and testable acceptance | This register; incomplete transcript gap remains explicit |
| AUDIT-02 | N | Every release states changed code, tests, production status and blockers | Required release note below; no blanket completion claims |

## Release evidence for this change
- Base: 94e8956e6d95d7e0a2111782cf6a9d4034e4780b, same release observed at public /api/health earlier in this task.
- New: classroom practice lab (single-shift clock, guided questions, dispatch decision feedback, route/dispatch text, glossary and orientation checklist), schedule feasibility calculator, Tuesday clock introduction, demo coverage.
- Preservation: no production API writes, migrations, secret changes or feature-flag enabling. Existing saved lesson plans are not overwritten; original review step IDs remain stable by appending new steps.
- Automated checks: build and full npm test passed locally; the pre-existing safety test now uses the same Eastern school date as the application rather than UTC.
- Browser preview: schedule showed 40 available/10 missing; shipper-delay answer 450 produced correct feedback; dispatch answers produced 4/4 with written-work review still required. Cloudflare deployment dry-run passed.
- Live acceptance: not completed. Student portal/file gates remain disabled; actual deployment/secret recovery requires authenticated access.
- Remaining product gaps are enumerated above, including multi-day HOS exceptions, general school-file storage, unified inspection packets, full campus templates and external integration adapters.

## Required next production checks
1. Authenticate Cloudflare; inspect deployment errors and binding names without printing secret values. Do not roll back a healthy release solely because a local test failed.
2. Authenticate Academy OS as school owner and separate scoped test roles; use fictional acceptance cases, not edits to real student records.
3. Verify existing key custody and isolated restore before protected-file enablement. Preserve the original encryption key.
4. Compare the authorized roster and agreement sources with existing live records. Use stable student IDs; never blindly reimport.
5. Obtain licensed Keller mapping and approve the real classroom schedule. Do not count breaks, simulations or planned days as attendance.
6. Mark each register item live-complete only with specific date, release, role, scenario and observed result.

## Follow-up polish and incident recovery
- Owner confirmed the post-login blank screen is fixed after cddaef8 deployed. This confirmation does not verify every other module.
- Added downloadable fictional practice worksheets with duty timeline, clock budgets, selected dispatch answers, written route/message and instructor review fields. No official training credit or server writes.
- Added seven-part vehicle-identification diagram with keyboard-accessible reveal buttons.
- Fixed custom-scenario selection and isolated radio groups between lab instances.
- Added a recovery boundary with safe retry while retaining the signed-in account bar; no sensitive exception text is displayed and no stored records are cleared.
- Licensed Keller mapping, general document-folder storage, and live external provider connections remain outstanding.

## Employee time clock and payroll

Implemented in code: authenticated individual clock-in/out, paid breaks and unpaid meals, campus-scoped manager review, original punch history, reasoned corrections and historical manual entries, separate approval of rates and overtime, self-approval prevention, and approved-only payroll CSV with grand total. Included in the presentation and operator demo using fictional payroll. Tests cover concurrent punches, stale edits, campus isolation, manual overlap/future denial, approval, corrections and export. Live signed-in acceptance remains required after deployment.

Payroll exports are gross estimates, without withholding, deductions or payments. Overtime allocation requires manager workweek review; no automatic determination. Saved effective-dated rates, employee correction requests, payroll period closeout, employee signoff and owner approval queues remain proposals, not delivered features.
