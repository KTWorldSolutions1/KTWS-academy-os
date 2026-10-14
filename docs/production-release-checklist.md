# Production deployment and acceptance checklist

## Current state
The GitHub workflow `.github/workflows/academy-production.yml` is **manual only** and is not proof of a completed deployment. Do not invite students or external partners until the checks below pass.

## Authorized owner setup (do not paste tokens in chat)
1. In the GitHub repository, open **Settings → Environments**, create `production`, and require a trusted reviewer before deployments.
2. Configure **Settings → Secrets and variables → Actions** with encrypted secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Use a narrowly scoped Cloudflare token with only the necessary Worker/D1 permissions; do not commit credentials.
3. Verify the configured Cloudflare account owns `academy.ktworldsolutions.com`, the D1 database binding, and R2 bucket. Confirm ownership and a backup/restore procedure before the first migration.
4. From **Actions → Academy OS production release → Run workflow**, select the intended reviewed commit. The workflow installs dependencies, runs tests, builds the web and Worker bundles, applies the idempotent D1 schema, deploys, and checks public homepage and unauthenticated API response.
5. Review the Actions job log. A successful job is necessary but not sufficient: sign in using a provisioned account and complete the acceptance scenarios below.

## Acceptance scenarios (record pass/fail, actor, timestamp, evidence)
- Owner signs in, provisions a campus manager and instructor with appropriate campus access.
- Greensboro, Mansfield and Dallas can each be configured without one campus viewing another campus's restricted records.
- Instructor records attendance, student-driving versus observation time, and a correction with preserved audit history.
- Week 5 is clearly designated for testing; verify the testing workflow against school procedures.
- Funding pending is never displayed as confirmed; student documents stay restricted.
- WIOA external representative access **must remain disabled** until independent external authentication, explicit student grants, audit logging, and revocation are implemented and tested.
- Intelligence Studio drafts are labeled **rules-based**, not live generative AI; confirm it does not disclose student data.
- Export/restore drill, account revocation, security headers, error monitoring and recovery contact verified.

## Release blockers
- Production credentials and environment review not configured/verified by this assistant.
- No successful GitHub Actions build/test or authenticated end-to-end test evidence captured.
- WIOA external portal and live generative AI are not implemented. Neither should be advertised as live.
- Verify Cloudflare route/DNS and that deployment smoke checks pass.
