# Academy OS mega-system pilot upgrade — 2026-11-07

> **Scope:** Lone Star Truck Driving Academy (Greensboro, Dallas, Mansfield, plus future owner-approved campuses). Changes are code and data workflows, NOT an assertion that a particular campus is licensed, that a student has completed ELDT, or that a signed student document has been transmitted to the DMV.

## Delivered to code / pilot mode
| Module | New workflow | Security & evidence boundary |
| --- | --- | --- |
| Student Document Vault | Owner/campus management can upload protected school evidence with category, track required items, review/verify uploaded evidence, request missing items, enter protected roster fields and funding category. | File bytes are encrypted using school's R2/AES-GCM storage. Role/campus-scoped downloads and auditable access. Raw SSN stays **only as uploaded evidence**, not in plain profile fields. |
| Student ID | A verified, stored student portrait can be used for a blue/silver CR80 card with name, school ID number, program and campus. | Portrait must be independently verified. ID is training identification, **not** a driver license. Recheck card print size against stock. |
| Student portal | Personalized missing-document notifications; signed-in student can upload a requested PDF/JPG/PNG/text file directly to their own campus record, status becomes **Submitted — review pending**; only management verifies. Read-only training progress still available. | Portal access requires individually verified authorization and owner invitation, remains disabled by default. File upload is also disabled pending school privacy and encryption recovery gates. |
| Campus resources | Management uploads approved **student-visible** classroom resources; portal lists campus-scoped files. | "Public" means approved for authenticated campus students, not anonymously published. All resources stored encrypted. |
| CDL Knowledge Diagnostics | Student practice exam questions are tagged by General Knowledge, Combination Vehicles, Air Brakes, HOS, Trip Planning, Map Reading and other school subjects. Server scores answers, stores missed objective codes and shows staff individual/classwide patterns. | Not official NCDMV knowledge exam, not a J. J. Keller theory exam and not an FMCSA training completion. Answer keys never returned in student quiz listing. |
| Quick quiz generator | Produces instructor-review DRAFT tests by reusing only campus-authorized, already-active, objective-tagged question banks. | Does not invent exam answers or publish without teacher review. Does not run on a time schedule yet. |
| DMV roster packets | For NC class starts, preflights student name, full address, telephone, driver license, DOB, class start/end dates and verified agreements. Generates restricted first-day roster CSV plus actual student contracts in one ZIP, only after start and complete evidence. | Download is privileged/audited; ZIP **is not itself encrypted** after download. Use verified secure transfer, never ordinary email. No automated DMV submission. |
| Two-week admissions cadence | Suggested Class A starts from Nov 16, 2026, every 14 days, with 5-week end date proposals. | Campuses must review holidays, staffing, fleet approval, licensing, capacity and testing calendar. |
| Funding paths | Cash, WIOA, WRLP, Voc Rehab, employer, scholarship and other outside funding can be recorded per student. | Funding categories do not assert agency authorization or establish tuition pricing. |
| Multi-campus work | A Tasks & Appointments board assigns work to an active employee at an authorized campus, with dates and progress; Regional admin has owner-assigned cross-campus visibility. | Staff have personal logins and scoped campus records. Assignees must have approved access to their assigned campus. |
| Pilot users | Owner creates employees with exact sign-in email, role, campus scopes; one-time activation link expires after 30 minutes. | Never share the Owner account. Role changes and regional authority are Owner-controlled. |
| Expanded sample school | Eighteen additional fictional students across Greensboro, Dallas and Mansfield, sample classes, tasks, appointments and per-subject quiz performance. | In-browser demo-only, not actual students, not persistent shared staging data, and never a valid DMV packet. |

## Regulatory reference: North Carolina
- **19A NCAC 03J .0308(a)** requires each school offering a full program to submit its class schedule for the licensing period, **class roster as of the first day of class** (name, address, phone, driver license number) and copies of the student's contracts. It also covers recruiter lists and updates. The academy's roster includes DOB and funding details at the school's request; these additional fields are **not** listed in .0308(a)(2) as mandatory items.
- **19A NCAC 03J .0601** sets requirements for the student contract's substance; a generated PDF or a blank template is not a replacement for the student's executed agreement.
- Primary references: https://reports.oah.state.nc.us/ncac/title%2019a%20-%20transportation/chapter%2003%20-%20division%20of%20motor%20vehicles/subchapter%20j/19a%20ncac%2003j%20.0308.pdf and https://reports.oah.state.nc.us/ncac/title%2019a%20-%20transportation/chapter%2003%20-%20division%20of%20motor%20vehicles/subchapter%20j/19a%20ncac%2003j%20.0601.pdf

## Next class cadence (proposed)
- Nov 16, 2026 → Dec 18, 2026.
- Nov 30, 2026 → Jan 1, 2027 (**holiday; school must review**).
- Dec 14, 2026 → Jan 15, 2027.
- Dec 28, 2026 → Jan 29, 2027 (**holiday review**).
- Jan 11, 2027 → Feb 12, 2027.
- Jan 25, 2027 → Feb 26, 2027.

## Non-negotiable release checks (not yet complete)
1. Set up and certify an actual independent staging/pilot environment and sample accounts before opening any live student data to Texas testers. The existing demonstration is client-side and session-local, *not* a shared staging school.
2. School owner and privacy lead verify encryption key rotation, backup/restore, access control, staff role testing and storage retention/deletion policy. Never enable upload flags until school acceptance passes. This code intentionally **does not** switch the flags on.
3. Confirm consent, legal retention and permitted transmission of DL/DOB, executed agreements, SSN, drug-test information and school-specific private data. Log every access and require multi-factor authentication for administrators when the authentication service supports it.
4. Conduct independent access reviews: student in Greensboro vs Dallas/Mansfield, Instructor vs Admin vs Owner vs Regional admin, revoked accounts, office network and PDF/image handling.
5. Confirm CDL knowledge question quality and terminology against the approved school curriculum before publishing practice tests. J. J. Keller copyrights and licensed content must not be imported/scraped without permission.
6. Manual DMV first-day roster snapshot reconciliation before export; the current export uses **currently assigned** student records and must be validated against first-day attendance/enrollment. **The school—not the software—certifies roster accuracy.**
7. Use an approved secure transfer workflow to DMV; the generated ZIP is downloaded over HTTPS but **does not contain password-protected files**.

## Longer-term prioritized additions (not claimed complete)
- Instructor-question bank with versioned curriculum mapping and an opt-in daily assignment scheduler; quiz randomization and student remediation pathways.
- Signed-document e-sign provider integration; native secure contract assembly/approval and independent signature evidence.
- Automated email/SMS reminders with explicit student opt-in, delivery logs, retry/deliverability monitoring and unsubscribe controls; today's missing-document notices are **in-app only**.
- Versioned, first-day-roster snapshot and formal manager sign-off; encrypted delivery through an agency-approved portal instead of local ZIP handling.
- Dedicated shared staging tenant, pilot role feature gates, beta telemetry, audit dashboards, comprehensive load and security tests.
- Saved training photo crop editor, printer-specific ID templates and reprint tracking.
- Regional helpdesk "temporarily assist another campus" with expiring access, documented business reason, and immutable audit logs.
- TEXAS-specific student and DPS compliance reporting requires a separate regulation review and approval, not the NC DMV template.

## Testing 
CI includes client/server/Cloudflare build, comprehensive existing tests, new unit tests for roster gaps/CSV escaping, demo accuracy, campus assignments and question diagnostics, plus student-only portal upload/alert/access integration tests. Passing automated tests do **not** replace real security acceptance or successful production deployment.
