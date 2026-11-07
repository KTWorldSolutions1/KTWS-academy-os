# Lone Star Academy OS — master scope and live-release audit
Date: 2026-11-07. Campuses: Greensboro NC, Dallas TX, Mansfield TX. This tracks implementation, not regulatory approval.

## Recently built in this pilot branch
- Real-workspace owner demonstration: 30-step operator that navigates actual Academy OS modules, performs safe fictional lead/document/quiz/attendance/task actions, visually highlights controls, and offers an optional real-tab screen recording with user permission. The older scripted visual trailer is separately available.
- Three-campus sandbox: 100 fictional students distributed across eight statuses (including waiting for permit), plus 50 fictional applicants awaiting funding; no real DOBs, SSNs, licenses, or agreements. Sample records never sync to live D1.
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


## November 7 full-system integration and release matrix
| Workstream | Present capability | Gated or not implemented |
|---|---|---|
| Lead intake & funding | Admissions leads, 50 fictional funding-pending demo applicants; funding sources Cash/WIOA/WRLP/Voc Rehab/employer/other; school approvals and invoices | School policy validation of financial awards and current ETPL tuition |
| Enrollment & student records | Campus-scoped student profiles, private document requests, submitted/verified evidence, portrait ID card studio, 100 synthetic students | Security and retention acceptance before real SSN evidence uploads |
| Theory & learning | 30-topic Class A federal theory crosswalk, draft five-day classroom, logging, trip planning, map reading, approved quiz banks, diagnostics | Actual J. J. Keller licensed lesson mapping and instructor-approved assessments |
| Driver skills | Attendance, actual vs planned hours, field coaching, range/road proficiency and inspection logs | Final instructor/owner validation of every NC and Texas field and state reporting duty |
| Student portal | Enrollment checklist, private missing notices and upload workflow, seven-stage journey, birthdays not publicly exposed, school closure banners, Driver Pulse career handoff | Full go-live depends on signed student authorization and security pilot |
| NC compliance | First-day roster preflight, DOB/license/contact info, verified agreement ZIP download | Owner review, secure NC DMV transmission and verified receipt |
| Texas compliance | Dallas and Mansfield location and role isolation | Texas-specific approved regulatory templates and submission integration |
| Messaging | Single and opt-in limited bulk email/SMS composer, per-campus permission checks, templates, preview and audits | School-owned verified sending domain, Twilio registration and confirmed STOP handling |
| Calendars | Month view with student/staff birthdays, approved announcements, confirmed closures and class dates; downloadable privacy-minimized ICS for Outlook/Google | Two-way Outlook/Google Graph sync requires an owner-authorized OAuth app |
| Payments | Funding invoices and optional signed-webhook Stripe Checkout code | No payment collection until owner confirms Stripe keys, fees and live acceptance |
| Integrations | Owner Integration Center catalog lists Cloudflare, M365, OneDrive, Teams, Power Automate, poliSCHOOL, J. J. Keller, FMCSA, NC DMV, Texas regulators, Twilio, Resend, Stripe, QuickBooks, Tenstreet, OpenAI, e-sign and Google Calendar | Third-party apps are NOT automatically connected, subscribed, authorized or transmitting data just because they are listed |
| Team & executive | 30-step actual workspace demo, role-checked pilot invites, campus and regional oversight, assignments, daily focus, weekly reports | Real Texas pilot participants need separate login activation; do not share Owner password |

### Release standard
A complete *working pilot* does not mean that every vendor connection is approved or that all regulatory submission adapters are live. Public release requires passing GitHub CI, successful Cloudflare deployment, live route smoke test, successful school-owner authentication, explicit security clearance for sensitive file uploads, and written validation of state compliance workflows. A newly added connector listing represents a connection pathway, not a remote installation.
