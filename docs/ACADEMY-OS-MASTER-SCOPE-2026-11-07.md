# Lone Star Academy OS — master scope and live-release audit
Date: 2026-11-07. Campuses: Greensboro NC, Dallas TX, Mansfield TX. This tracks implementation, not regulatory approval.

## Recently built in this pilot branch
- Real-workspace owner demonstration: 30-step operator that navigates actual Academy OS modules, performs safe fictional lead/document/quiz/attendance/task actions, visually highlights controls, and offers an optional real-tab screen recording with user permission. The older scripted visual trailer is separately available.
- Three-campus sandbox: 100 fictional students distributed across seven statuses, plus 50 fictional applicants awaiting funding; no real DOBs, SSNs, licenses, or agreements. Sample records never sync to live D1.
- A private 7-stage student journey: Enrollment > Classroom theory > Permit preparation/waiting > Yard/pre-trip > Road > Skills testing > Graduate. Current stage is NOT automatically verified completion. Specific theory results, skills proficiency and permit review remain independent evidence.
- Direct student portal link to Tenstreet Driver Pulse for setting up a driver profile, work history, job filters and applying directly to carriers. There is no Tenstreet API integration, application submission from Academy OS, automatic applicant record transfer, or job placement verification.
- Separate Students > Student Photos & Badges workspace: select student, upload JPG/PNG to encrypted R2, review/approve, assign school ID, print CR80 badge. Authenticated students can upload their own picture pending management verification. Private documents and ID photo are not automatically published.
- Admissions > Calendar: campus-selector month view for class starts/ends, appointments/tasks, student birthdays in authorized staff view, staff birthdays with consent, dated announcements, closures, student-facing urgent and normal banners. Notices are in-app, not delivered by email/SMS automatically.

## Existing built modules to verify during pilot
- Schoolwide and campus-specific admission records, classes and biweekly enrollment scheduling starting Nov 16, 2026; cash, WIOA, WRLP, Voc Rehab, employers and scholarship funding pipelines, funding invoices and approvals.
- Private document vault with signed enrollment agreements, license, SSN evidence, CLP, MVR, medical, funding and staff verification; in-app missing-file requests and portal upload.
- NC DMV first-day roster preflight and restricted export including signed agreements; Texas-specific compliance export requires separate state template and review.
- Standard Class A FMCSA 30 theory subjects, 50-hour proposed five-day classroom schedule with actual J. J. Keller vendor crosswalk still pending. Practical workshops cover driver clocks, paper logs/ELD, trucker atlas, trip planning and legal dispatch.
- Instructor attendance, daily training record, distinct road-driving and observation categories, range/road proficiency, testing readiness, student subject-level diagnostics, classroom lesson checkoffs.
- Campus-scoped staff roles, authorized regional access, assigned tasks/appointments, funding agencies, employer outreach, conditional letters and weekly reporting.

## Important school policies and prior-chat requirements
- Five-week school flow plus 20 additional practice hours; verify current NC 50 classroom hour and 160 total-hour policies by official references and retained attendance logs. Do NOT treat demo logs as actual training hours.
- Theory exam 80% threshold, separate practical coaching/knowledge self-checks, remediation and instructor signoff.
- School drug-screen-before-yard policy must not be incorrectly described as universal FMCSA prerequisite.
- Instructors need appropriate licenses and medical certifications, training vehicle inspections, passenger safety belts for observation seating, yard safety logs.
- Enrollment has identity/permit/license, documented authorization, student contract e-sign, drug screen documentation, signed funding/agency approvals and campus retention/consent policy.
- WIOA/ETPL/cash pricing and approved promotional tuition must be separately represented; no unverified claims of workforce eligibility, guaranteed employment or grants.

## Production gates not finished
1. R2 activation was a deployment dependency, but does not independently authorize private files. Confirm encrypted file access, key backup/recovery, retention rules, file ownership and audit policy before enabling real student uploads.
2. Activate private student portals only after signed authorization and security/account-recovery review; limited staff roles must not view other campuses or SSNs.
3. Audit the actual J. J. Keller licensed course IDs/durations against the 30 federal theory subjects; 50 net classroom hours need a real instructional calendar including breaks.
4. Verify NC roster requirements and Texas-specific license/compliance rules before real reports; never claim automatic DMV or FMCSA TPR submissions.
5. Driver Pulse is an official external link, not integration; external e-signing, SMS/emails, J. J. Keller sync and TPR delivery need providers, privacy/security checks and receipts.
6. A school closure announcement does not automatically reschedule students, drivers, instructors, trucks or make-up hours. Approval of the make-up day is a separate campus process.
7. Perform owner and Texas pilot testing with separate accounts and synthetic data; validate isolation, complete ID print at CR80 size, check recovery and backups before a schoolwide cutover.
8. School theme is provisional gray/blue/black/white; the user has not supplied the intended reference photograph in this chat. Final exact HEX or Pantone should match that photo and any approved identity guideline.

Definitions: code merged to branch is not published to production. Successful release automation and live authenticated smoke tests establish publication; security and campus approval are additional requirements before using actual student sensitive documents.
