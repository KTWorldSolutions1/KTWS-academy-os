# Academy OS mega-platform — conversation-derived implementation backlog (2026-10-14)

## Evidence classification
- **Observed operational needs:** user described real Greensboro school workflows. Do not treat drafts, proposed partnerships, funding prospects, event plans or training targets as completed facts.
- **Requires confirmation:** current class duration (four-week marketing vs earlier five-week design), approved hours, state-specific testing and instructor rules, campuses, event dates (grand opening previously described as Nov 6 and Nov 16), tuition promotion, third-party testing, yard approval and employer commitments.
- **Security:** do not import conversation text, passwords, HIV/health details, family details, student SSNs or other unrelated sensitive data into production records. Obtain permission and minimum-necessary source documents for any actual student or employee migration.

## Priority 0 — working student operations
- Instructor tablet daily roster: per-date/per-phase attendance, absent/excused/late/partial, explicit missing mark, daily instructor identity, correction history, audit trail and printable report.
- Daily individual logs: classroom, range, student-operated road driving and observation; validated time, breaks, instructor, maneuvers, deficiencies, coaching, proficiency, evidence, corrections and hour totals. Existing records with ambiguous road mode remain unclassified.
- Integrate into existing student profile and reporting. Test with synthetic students and multiple campuses. Do not silently convert observation to actual driving.
- Student lifecycle: inquiry → approved funding or cash pay → enrollment → orientation → theory → CLP/permit → yard → road → testing → graduation → employment; distinguish pending vs confirmed and trigger actionable exceptions.
- CLP failure workflow: test area, remediation plan, retest eligibility verification, retest date, outcome; no automatic assumption of readiness.
- Student documents, authorization and signatures, funding proof, secure access, retention and audit.

## Priority 1 — workforce and employer intelligence
- WIOA/NCWorks partner CRM: case manager, agency, vendor status, funding authorization, required attendance/progress reporting, referral consent, eligibility documentation, contingent-offer requirement, follow-up owner, communication timeline.
- AI-assisted WIOA discovery questionnaire, meeting brief, follow-up email, funding-document checklist, eligibility exception prompts; require human verification and never fabricate answers.
- Employer partnerships: USA Truck, PAM, Publix, Coca-Cola Consolidated, Pepsi and other leads only as unverified prospect/relationship states unless actual agreement is evidenced. Conditional offer templates must be approved by employer, not auto-issued. Graduate referrals require consent.
- Graduate placement tracker: applied/interviewed/conditional offer/accepted/start date/retention; separate school outcomes from employer commitments.

## Priority 2 — growth and outreach
- Marketing studio: event flyers, social captions, carrier pitches, outreach emails, program comparison, campus-specific assets, brand templates, version history, approvals, QR tracking, lead attribution and publishing guardrails.
- Events: Oct 17 health fair; Oct 31 Truck-or-Treat; November grand opening date **unconfirmed**; Nov 20 resource and second-chance employment fair. Owner, time, location, approvals, budget, supplies, staff assignments, 10–15 organizations and 3–5 employers target for Nov 20, 100–200 attendance planning range (not confirmed turnout).
- Reusable event tablet lead form: source, interest, schedule, funding, consent, follow-up owner, response SLA, conversion reporting.
- Employer-sponsored cohorts and schedule preferences; promo tuition $3,000 and up to 20 free additional hours only when verified and approved.

## Priority 3 — campus command center
- Campus manager weekly Monday briefing: student progress, staffing, curriculum, equipment, yard/road readiness, instructor credentialing, facilities, outreach, owner support and risks. Collaborative tone, not demanding task assignment.
- Staff role permissions (Owner, Campus manager, Instructor, Admissions, Admin, Front desk, external partner read-only); staff schedules and paid-hours validation, onboarding and cross-training.
- Trucks, manual/automatic assignments, inspections, road routes, cones, yard approval evidence, vehicle maintenance and instructor licensing.
- Multi-campus isolation and configurable state requirements; no unverified hard-coded regulatory hour mandates.
- Partner portal for authorized WIOA progress views with consent and least privilege; immutable activity history.

## Scenario engine
Each scenario has trigger, severity, assigned owner, suggested next steps, evidence requirements and closure outcome:
1. Funding not approved before cohort → enrollment remains pending, notify admissions and case manager.
2. CLP failed → remediation and verified retest process; never auto-promote to yard.
3. Attendance not recorded → missing-mark alert, not absence.
4. Road observation recorded → observation ledger only; cannot count as student-operated driving.
5. Instructor credential expired/pending → flag schedule for human compliance review.
6. Yard/truck unavailable → identify impacted lessons and rescheduling options.
7. Carrier requires conditional offer → request approved employer letter; never invent one.
8. Event lead not followed up → alert assigned admissions owner.
9. Student underperforms → coaching, reassessment, extra-hours eligibility review.
10. Staff shift below expected hours → manager review of coverage and employment expectations.
11. Training record correction → append amendment with actor, timestamp and reason.
12. Partner requests student progress → verify authorization, consent and campus scope.

## Implementation and release gates
1. Finish instructor UI integration and test attendance/training record storage across Node and Cloudflare adapters.
2. Add scenario records and workflow triggers using existing audit and role system; verify no unauthorized cross-campus reads.
3. Integrate the Intelligence Studio with an authenticated AI provider only after security review, approved prompt/data retention rules, rate limits, costs, moderation and explicit user approval. Current studio is deterministic template generation, **not** LLM AI.
4. Run automated tests and a complete build, Cloudflare dry run, staging smoke tests, backup verification, staff walkthrough, and owner signoff.
5. Deploy only with access to the authorized Cloudflare account and real deployment credentials, which must not be pasted into chat.
