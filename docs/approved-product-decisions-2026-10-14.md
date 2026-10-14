# Approved product decisions — 2026-10-14

**Owner-provided configuration decisions** (supersede earlier assumptions):

- Product scope: **Lone Star Truck Driving Academy only**. No multi-school SaaS, subscription billing, or external school tenants.
- Existing technical repository: KTWS-academy-os. Repository name does **not** authorize KTWS to own Lone Star business data; confirm organizational ownership, deployment administrator and data governance with Lone Star before production use.
- Canonical requested domain: **academy.ktworldsolutions.com**. Owner confirms access to the Cloudflare account, but authenticated deployment access has **not** been verified in this engineering session.
- AI access: **all employees, subject to role-appropriate permissions and campus boundaries**. No unrestricted student/financial record access. All generated content is draft until reviewed.
- Class A program: **five weeks total; fifth week is testing week**. Weekly hours and approved curriculum remain configurable and subject to verification; no regulatory mandate is inferred.
- Campuses: **Greensboro, Mansfield and Dallas**. Do not auto-create fictional campus records or assume addresses, staff or operational approval.
- WIOA partner portal: **yes**, with case-manager-specific consent, scoped student access, auditing and revocation.
- Commercial third-party subscriptions: **no**.

## Acceptance gates
1. Display Lone Star branding, not KTWS-branded school ownership, while preserving approved domain.
2. Campus selection and role permissions apply to AI retrieval, generated drafts, partner portal and exports.
3. Five-week program calendar distinguishes instruction weeks 1–4 from testing week 5; configurable cohort dates and test appointments.
4. No cross-campus or WIOA data leakage; external representatives can only view specifically authorized students and fields.
5. Never assert a student's WIOA funding, test eligibility, graduation, job offer or employer acceptance without evidence.
6. Verify tests, builds, authenticated deployment, backups and owner acceptance before declaring production complete.
