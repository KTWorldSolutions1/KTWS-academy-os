# November 7 owner review — Greensboro cohort and Curriculum OS

This document is a release acceptance checklist, **not** an assertion that the live environment is complete. Private data must never be committed to this public GitHub repository or copied into fictional presentation fixtures.

## Greensboro November 2, 2026 cohort

- Expected: 11 **real** enrolled Class A students, Nov 2 through Dec 4, 2026.
- The source roster contains full names, DL numbers with leading zeros, date of birth, telephone and address. User-supplied data is available in the authorized operator's own enrollment roster, **not** included in this repository.
- A school administrator must use the protected, approved environment after key escrow and D1/R2 backup/restore acceptance. Match existing students first by a verified school ID/DL, avoid duplicates, select the existing Nov 2 Greensboro class or create it only after confirming cohort settings.
- Actual signed enrollment agreements must be individually uploaded to the private encrypted vault, linked to the correct verified student identity, reviewed and marked verified; NEVER synthesize documents, signatures or statuses.
- Confirm addresses and ZIPs against source records rather than silently normalizing typos. Verify class capacity before import; one existing default of eight cannot hold eleven.
- Only after controlled ingestion and document verification: use **Admissions → DMV Roster Packets** for role-limited preflight/export. First-day roster preparation is not automatic NCDMV filing.
- The new local **Review a DMV enrollment CSV** area is a preview only and does not write records. Run it in a trusted browser on a trusted device; memory is cleared on refresh.

## School-facing navigation (eight recognizable main sections)

1. **Home:** Today, school notices, action queue, weekly report, school numbers, owner presentation.
2. **Students:** Student List → Student 360, secure files, profile photo/ID studio, student communications, student access/demo.
3. **Admissions:** inquiries, tours/school calendar, event intake, DMV class roster packets and secured enrollment.
4. **Training:** daily closeout, assignments/trucks, attendance, classroom lessons, J. J. Keller alignment, learning diagnostics, permit, range, road, testing, FMCSA TPR.
5. **Team:** staff assignments, availability, license tracking, shifts, safety and instructor coverage.
6. **Partners:** WIOA/WRLP/VR, workforce agencies, employer offers, sponsored billing, outreach and 30/90-day placement follow-up.
7. **Payments:** tuition, funding, invoicing, reconciliation and refunds; never infer deposits from manual ledger entry.
8. **School Setup:** campuses, programs, role permissions, approved integrations, privacy policy, launch acceptance and recovery controls.

Each major action must be discoverable through visible sidebar labels, student-360 deep links, keyboard search and a mobile-friendly view. Do not add dozens of first-level navigation tabs.

## Classroom curriculum acceptance

- Preserve all **30 FMCSA Class A ELDT theory topics** as a mapped, versioned curriculum. Link licensed J. J. Keller lessons by licensed resource ID/URL instead of reproducing copyrighted textbook content.
- Week 1 must allow daily instructors to record actual participation and learning evidence; NC 50-hour theory configuration must be validated with school regulatory officials, and any training-hours report must distinguish scheduled from completed hours.
- Hands-on supplements: HOS and duty clock calculations, paper logs and ELD scenarios, truck atlas/map reading, dispatch-trip simulation, safe route/parking decisions, load/time planning, compliance decisions, professionalism and a final driver-readiness exercise.
- Instructor dashboard: plan, topic objective, attendance, lesson evidence, remediation, quizzes/final (80% gate), permit-ready checks.
- Student portal: progress ribbon **Enrolling → Classroom → Permit → Yard → Road → Testing → Graduated**, actual achieved skills/hours, missing-doc alerts, class/yard appointments, study resources and optional external Driver Pulse career link (subject to verified external URL/integration permission).
- Students waiting for CLP must be visible and not falsely credited yard/road hours. A status label is not proof a milestone was completed. Any permitted transition requires role permissions, audit event and prerequisite validation.
- Range matrix: straight backing, offset backing, 90-degree alley docking, pre-trip; BTW road: instructor observed actual driving vs observation, night driving if applicable, instructor remarks and proficiency.
- Graduation: documented completion, official TPR submission evidence, test results, career resources and 30/90-day follow-ups.

## Calendars and communications

Calendar must expose class start/end, instructor availability, training reservations, birthdays (privacy-limited), appointments, visits, closures, student notices and student portal banners. Separate internal records from privacy-minimized public ICS export. Microsoft 365/Outlook and Google calendars need an actual authorized connection before two-way sync can be claimed. SMS/email must have approved providers, opt-in/opt-out, logging, and deliverability receipts.

## Branding acceptance

User-authorized palette: black, white, branded blue and restrained gold. Lone Star wordmark should be black with a blue center star, matching approved school artwork; do not fabricate a third-party trademark. Preserve accessibility contrast and plain-language button labels. Confirm real logo assets with the school; do not treat a generic 'LS' square as approved branding.

## Presentation / boss walkthrough (fictional records only)

A guided path should demonstrate:
1. Owner opens school health across Greensboro/Dallas/Mansfield and checks action queue.
2. Admissions converts a fictional lead to enrollment and funding.
3. Secure-document request, uploading, staff review and role-restricted vault.
4. Student signs in, views milestones, schedule, missing documents and learning targets.
5. Instructor delivers the 30-topic classroom plan, marks actual attendance, enters HOS/ELD practice, records quiz and remediation.
6. Permit hold, instructor planning and controlled move to yard; range checkoffs; road logs and true completed hours.
7. Calendar event/closure drives student-safe announcement and internal work.
8. Testing status, official TPR follow-up, graduation and employer outcomes.
9. Owner reviews campus KPIs, WIOA/billing, equipment, staff and compliance packet.
10. Presentation concludes with live integrations **clearly distinguished** from configured-but-disconnected providers.

Show controls and an operator's action, not merely claims on slides. Continue using fully fictional presentation student records, not protected Greensboro roster data.

## Current release distinctions

- Code inspection on November 7 confirms navigation routes and modules exist for calendar, student portal, DMV roster packets, secure document center, staff, learning diagnostics, demo and integration catalog.
- Code presence is **not proof** of visibility under the signed-in user's role, correct campus setting, real provider connectivity or successful production deployment.
- Original production encryption key exists, but recovery escrow and independent restore sign-off remain unverified; protected uploads and portal invitations stay disabled until explicitly accepted.
- This branch contributes a **local CSV preflight**, not live record creation. No authentic agreements were provided as mounted attachments in the conversation at the time of review.
- Before claiming release: successful Node 24 build/tests, Cloudflare deploy CI success at exact commit, owner sign-in on exact live domain, authenticated role-based smoke tests, and reviewed owner/demo flows are required.
