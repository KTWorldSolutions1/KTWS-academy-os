# Carrier recruiting and WIOA conditional offers — October 2026

## Usage and evidence
Academy OS stores individual offers in the existing `employment-offers` record kind and secure student document category `Conditional employment offer`. School records already enforce campus access and require a verified attached employer letter plus management signoff before `Verified contingent`.

Additional optional offer fields: `recruitingStage` (Contacted, Screening scheduled, Screening completed, Employer declined, Employer approved), `screeningDate`, `recruiterEmail`, `recruiterPhone`, `followUpDate`, `studentContactConsent`, `agencyReviewStage` (Not submitted, Submitted to WIOA, Accepted by WIOA, Rejected by WIOA), `agencyReviewDate`, `agencyReviewNotes`. The pipeline summary is available in `employmentOfferPipeline` and requires verified document evidence before counting accepted offers. These fields extend existing records without a D1 schema migration. A richer carrier-directory UI and campus reporting integrations remain separately outstanding.

## Initial carrier facts (do not auto-create student records)
- Werner Enterprises: recruiting 800-346-2818; candidate phone interview required before potential conditional offer. Confirm school/geography eligibility.
- Halvor Lines: recruiter Kayleigh Barkley, desk 715-947-2339; familiar with WIOA, offered candidate outreach and virtual presentations; issuance details not yet confirmed.
- Maverick Transportation: outreach initiated; specific conditional offer workflow unconfirmed.
- USA Truck: campus contact Angie; targeted partnership follow-up pending.
- PAM Transport: applicant-school diversion risk until partnership arrangements finalized.

Do not seed real candidate identifiers or recruiter private contacts into public source. Before sharing candidate contact details, confirm permission. Employer agreement to interview is not a letter, and even a verified letter is not accepted by WIOA until the agency reviews it.

## Acceptance and deployment
Run `npm run build`, `npm test`, `npm run build:cloudflare`, test authorized campus workflows, and obtain release-specific GitHub Actions evidence. Do not enable protected student uploads or invitations in production while school key/restore/privacy acceptance is blocked. Only a signed-off deployment constitutes production delivery.
