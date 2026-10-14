## Goal
Make Academy OS the operational source of truth for real-world campus workflows, student lifecycle, compliance evidence, enrollment, staff, events, and continuous improvement.

## Newly captured real-world scenarios (2026-10-14)
- Campus Manager is in the first month in role; supervisor feedback has been positive, but performance expectations/KPIs are only partially defined. Add 30/60/90-day goals and weekly manager reporting.
- A new cash-pay student enrolled and paid at closing. Capture lead source, enrollment conversion, payment status/receipt reference (not card credentials), cohort, start date, and next steps.
- Two active class cycles currently have one student each. Track cohort start, roster, planned vs actual starts, attendance, progression, completion, and cohort-level funnel metrics; do not equate small class size alone with manager failure.
- The first student is being used to validate the student lifecycle. He struggled with comprehension and did not pass the CLP test on the first attempt, with a retake planned. Add an instructor-owned remediation/support plan, specific knowledge gaps, preparation activities, retest outcome, and dated notes. Do not auto-label a student or employee as a failure.
- At least two additional students are targeted for the October 19 class; at least one is contingent on WIOA funding completion. Pipeline statuses must distinguish prospective, pending funding/authorization, confirmed enrollment, paid/authorized, and actually started. Never count pending WIOA funds as confirmed enrollment or promise a start before authorization.
- Employer outreach with USA Trucks concerns graduate employment and possible candidate referrals. Track organization contacts, commitments, referral handoffs, contingent-offer documentation, and outcomes; do not imply employment is guaranteed.
- Campus Manager is coordinating October 17 healthcare fair participation, October 31 Truck-or-Treat, November 6 grand opening/cookout, and November 20 community resource/second-chance employment fair. Track task owners, deadlines, budget vs actual, confirmed participants, leads, follow-up, and outcomes.
- Daily attendance and individual daily driver-training logs are explicit required capabilities.

## Attendance requirements
- Attendance entry by student, campus, cohort, date, scheduled block/lesson, instructor, start/end or hours, status (present, absent, tardy, excused, partial), reason/notes where appropriate, and who recorded/changed it.
- Missing attendance marks must remain "not recorded" / "unverified", never silently become absences.
- Support correction history with editor, timestamp, prior value, new value, and reason; no backdating without audit trail.
- Daily roster view with missing-mark alerts, attendance totals, cohort and student summaries, export/print for authorized staff, and physical student-file checklist where required.
- Distinguish classroom attendance, field/range instruction, actual student highway behind-the-wheel operation, and observation. Do not count observation as actual student driving.
- Track scheduled vs actual hours and cumulative hours by approved curriculum category, with evidence and instructor sign-off.
- Access limited by campus and role. Exports should exclude unnecessary sensitive data.

## Individual Daily Driver Training Log requirements
- One dated log per student per training day/session, linked to student, campus, cohort, instructor, lesson/skill, and vehicle/equipment where applicable.
- Capture start/end times, duration, category, activity/location or route description at an appropriate level, whether the student actually operated or observed, instructor comments, skill/proficiency checks, deficiencies/remediation, and student/instructor acknowledgment where required by policy.
- Provide cumulative rollups against the school's currently approved curriculum and configured requirements. Current working curriculum reference in school materials is 160 hours: 50 classroom, 50 field, 20 actual highway behind-the-wheel, and 40 highway observation, with at least 3 hours of highway driving between dusk and dawn per full-course student. Treat these as configuration candidates requiring confirmation against the currently approved program and current NCDMV requirements before enforcing them.
- Prevent double-counting, negative/overlapping hours, and hours without a date, student, category, or responsible instructor. Flag missing or inconsistent evidence for review rather than silently altering records.
- Provide print/PDF export and audit-ready student-file checklist.
- Explicitly label this as a school training-hours log, not a replacement for any applicable FMCSA hours-of-service/ELD records or official driver logbook.

## Academy OS implementation approach
1. Review current data model and existing operations/student-success workspace before adding duplicate tables or views.
2. Add daily attendance completeness and student-specific training logs with append-only audit history.
3. Add cohort/enrollment funnel dashboard and funding-pending workflow.
4. Add student support/remediation plans and CLP retest follow-up.
5. Add manager weekly report / 30-60-90 day KPI workspace.
6. Connect growth events and employer pipeline to actual leads/enrollments while preserving attribution.
7. Add validation tests for roles/campus restrictions, audit history, hour rollups, missing attendance, pending funding, and export privacy.

## Acceptance criteria
- Staff can record attendance for every student/session and see which marks are missing without missing marks becoming absences.
- Staff can create and print an individual daily driver-training log for each student/day and see auditable category totals against configured requirements.
- Actual driving and observation hours remain distinct.
- A failed CLP attempt can be recorded with targeted remediation and a scheduled follow-up, without changing graduation or eligibility status automatically.
- WIOA-pending students remain pending until authorization is documented.
- Enrollment metrics distinguish lead, application, confirmed start, payment/funding status, and completion.
- All records honor existing role/campus permissions, audit controls, and privacy-safe export rules.
- Compliance requirements are configurable and reviewed against current official rules and the school's actual approvals before launch.

## Guardrails
- Never invent training hours, backdate logs, or auto-certify graduation/ELDT completion.
- Flags support human review; they do not make automatic enrollment, fitness, testing-readiness, or graduation decisions.
- Do not claim that the app is deployed or that integrations are live unless verified.


## Implementation blueprint — daily attendance and driver-training logs

### User workflow
1. Staff opens Operations → Attendance & Training Logs and selects campus, cohort, date, session, and instructor.
2. The roster loads scheduled students. Each student's status begins as **Not recorded**; the application must never infer absence from a blank mark.
3. Authorized staff records Present, Absent, Tardy, Excused, or Partial, along with session start/end and relevant instructional category. A partial mark requires hours/minutes or a documented reason.
4. Instructor creates one or more dated training entries per student/session: category, actual start/end, calculated duration, actual operation vs observation, lesson/skills, vehicle when relevant, proficiency evidence, deficiencies, and remediation.
5. Save validates overlaps, negative duration, missing required fields, campus/cohort mismatches, duplicate records, and hours outside allowed policy. Errors are shown for correction; the system never silently adjusts hours.
6. Instructor reviews and acknowledges the log. Authorized staff can print/export an individual student log and cohort attendance report.
7. Manager dashboard shows missing attendance, unreviewed logs, curriculum-hour progress, unresolved deficiencies, and records needing correction.

### Data and integrity rules
- Use the existing records store and optimistic concurrency/audit infrastructure where appropriate; inspect the current record kinds and helpers before adding a parallel storage system.
- Suggested record kinds: `attendance_session`, `attendance_mark`, `driver_training_log`, and `training_requirement_profile` only if equivalent existing kinds do not already exist.
- Store stable IDs for campus, cohort, student, instructor, session, and vehicle; use ISO date and timestamp values consistently.
- Store original entries and use the existing audit trail for edits: actor, timestamp, reason, old value, new value. Do not overwrite history or permit silent backdating.
- Calculate duration from validated timestamps or a carefully validated manual duration when policy permits. Prevent duplicate/double-counted time within the same student and category; flag questionable overlap for review.
- Totals are computed from approved, non-voided entries and grouped by configured curriculum category. Corrections/voids must retain history.
- Keep classroom, field/range, student-operated highway driving, and highway observation separate. A student observation entry can never increment actual student-driving totals.
- Role and campus checks must be enforced server-side, not only by hiding UI controls. Instructors may enter/review their authorized students; managers/admins may correct records according to permissions.
- Exports are limited to necessary school records, respect campus permissions, and exclude unrelated sensitive data.
- A printed report must state that it is a school training record and not a substitute for applicable FMCSA hours-of-service/ELD records or official driver logbooks.

### Requirement profile and regulatory guardrails
The existing project note lists a working curriculum reference of 160 hours (50 classroom, 50 field, 20 actual highway behind-the-wheel, 40 highway observation, plus a possible 3-hour dusk-to-dawn requirement). These are **unverified configuration candidates**, not hard-coded law. Before activation, an authorized school administrator must confirm the current approved curriculum, applicable NCDMV/TPR requirements, and any program-specific rules, then set a versioned requirement profile with effective date and approving person. Preserve the profile used for each student's calculation. Do not make eligibility, graduation, or regulatory-compliance decisions automatically from an unverified profile.

### Acceptance tests
- Blank roster marks display Not recorded and never count as absences.
- All attendance statuses save, appear in student history, and report correctly.
- An instructor cannot access or modify another campus's records without authorization.
- Edits require a reason where policy requires it and create immutable audit evidence.
- Invalid time ranges, negative durations, overlapping entries, mismatched student/cohort/campus, and missing required fields are rejected or clearly flagged for review.
- Observation hours never count as actual driving hours; category totals recalculate correctly after approved corrections.
- Print/export output is readable, dated, attributable, permission-checked, and privacy-minimized.
- Unverified curriculum values are not silently enforced as legal requirements.
- Automated tests cover empty rosters, populated rosters, correction history, permissions, totals, export privacy, and daylight/time-zone boundaries.

## Delivery sequence
- P0: inspect current data models, record kinds, API permission checks, audit helpers, and existing UI navigation; reuse rather than duplicate existing capabilities.
- P1: implement attendance roster entry, missing-mark indicators, student attendance history, corrections/audit, and printable report.
- P2: implement per-student daily training logs, category totals, instructor review, remediation notes, and printable report.
- P3: implement configurable curriculum requirement profiles, progress dashboard, and missing-evidence alerts after administrator verification.
- P4: connect funding-pending enrollment, CLP retest/remediation, cohort funnel, employer referrals, and weekly manager report.
- P5: run unit, API authorization, populated/empty rendering, export privacy, and deployment build tests; document deployment status honestly.
