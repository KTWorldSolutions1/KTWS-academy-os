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
