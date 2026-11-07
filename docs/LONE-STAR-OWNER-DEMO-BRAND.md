# Lone Star Academy OS — Owner presentation and brand implementation
**Prepared November 7, 2026.** Prototype and synthetic-data presentation. This is not a production data migration or a claim of FMCSA/DMV certification.

## Brand research
- School's official public website: https://lonestar-tda.com/
- The Lone Star Truck Driving Academy mark on public school-facing materials uses **black lettering, a blue star and white space**. Brand usage also accommodates gray/silver supporting neutrals. The UI now favors **black/charcoal, blue, light gray/silver and white**, without purple brand accents.
- Our UI palette is an intentionally accessible interpretation, *not* a claim to have received an official brand standards guide or exact authorized hexadecimal values. The school owner should approve final color values, official wordmark use and preferred logo assets.

## Owner presentation button
Sign in to Academy OS as an authorized school employee, then select **OWNERSHIP VIDEO DEMO** in the workspace mode bar. The button switches to isolated fictional sample data and opens a 14-chapter auto-playing visual story with chapter selection, pause/replay, speed adjustment and optional device text-to-speech narration.

Owner / approved regional administrators can view the three-campus synthetic network. Other staff see only their assigned campus data. On closing a chapter, the **Open [feature]** control goes to the real UI screen with synthetic data.

The browser presentation is a **self-playing animated experience**, not a prerecorded production screen capture. On supported desktop browsers, **Create playable video file** exports a silent short video in WebM/MP4 as supported by the browser. The separately prepared captioned MP4 for meetings can also be presented offline.

### Recommended presentation flow
1. **Command center:** show 100 fictional students in seven lifecycle states and 50 additional funding-pending prospects divided across Greensboro, Dallas and Mansfield.
2. **Admissions → Funding:** create a follow-up on a fictional lead; open approved funding fields (Cash, WIOA, WRLP, outside sources).
3. **Secure Documents:** inspect required enrollment categories, photo-ID controls and in-app missing-paperwork notifications. In a production-like staging test, student uploads must use a dedicated consented student account. **Do not ask someone to enter actual SSNs or driver license numbers in demo mode.**
4. **DMV roster:** select Greensboro, November 16 class; show preflight and explain why an incomplete signed agreement blocks a final packet. Download of a real packet is management-only, sensitive and requires proper approval.
5. **Week 1 theory:** open the five-day Class A plan covering the 30 FMCSA theory categories, with J. J. Keller mapping and supplemental hours-of-service, ELD, map reading and trip planning.
6. **Knowledge Diagnostics:** view fictional General Knowledge, Combination and Air Brakes results. Explain that the board pinpoints missed *learning objectives* and helps plan reteaching before Friday.
7. **Student 360:** open a fictional student in each status, review classroom/yard/road hours, daily notes, school practicals and graduation gaps.
8. **Team & Operations:** show campus-restricted staff accounts, task and appointment assignment and regional support.
9. **Decision:** propose a formal owner-led pilot with separate staging database, verified staff accounts, licensed vendor content mapping, privacy controls, approved records retention and measured acceptance criteria before live cutover.

## Exact sample counts
- **100 fictional students in total**, across seven statuses; the original two Greensboro sample students are counted in the 100.
- **50 separate fictional leads whose funding is pending**, not another 50 admitted students.
- **Greensboro, Dallas and Mansfield** are the three locations in this demonstration.
- No synthetic SSN, demo license number or fictional consent is valid legal evidence or eligible for NCDMV submission.
- Session-local fake edits are not shared between multiple browser sessions. Each approved user needs their own school login. A truly collaborative pilot needs a separate authenticated **staging** environment and a shared but synthetic database.

## Privacy and release checklist
- School encryption key lifecycle, recovery and privacy acceptance must pass before `SCHOOL_FILE_UPLOADS_ENABLED` is turned on.
- Private student access remains behind `STUDENT_PORTAL_ENABLED`, individually verified student authorization, school-owned invite links and campus/role access restrictions.
- In-app missing-document messages exist, but automated email/SMS alert delivery is **not configured**. Do not present it as an external message sender.
- Student profile photos and school enrollment agreements must be staff-verified; do not display Social Security cards in the presentation.
- NC first-day roster ZIP is limited to a privileged and audited local download; the downloaded ZIP is **not encrypted at rest as an archive**, so it must be transported through an approved secure channel and must not be emailed as an unencrypted attachment.
- Texas compliance and DMV templates require distinct regulatory review.
- FMCSA training evidence, state training-hour compliance, legitimate J. J. Keller completions and TPR submission remain separate verified requirements; a sample test or schedule does not certify a driver.
- Approval needed before switching from existing school tools: campus leaders test permissions, actual school policies, admissions and funding reconciliations, syllabus and training reporting, security, backup and rollback.

## Future high-value buildout
A real school-wide applicant/student demo login system in a **separate staging tenant**; scheduled instructor-reviewed adaptive quizzes with mastery curves; e-signature integration with an authorized provider; signed/hashed first-day roster snapshots and agency-approved electronic transmission; bilingual student portal where supported; audit-grade access expiry for regional help requests; module-level learner interventions; school CRM migration & reconciliation; printable IDs with printer-specific templates; independent Texas compliance workflows.
