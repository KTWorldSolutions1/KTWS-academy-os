# Cloudflare document encryption bootstrapping

Academy OS protects files in R2 using `RECORDS_ENCRYPTION_KEY` with AES-256-GCM. A Cloudflare Worker with no key cannot encrypt/decrypt document uploads.

The production workflow runs `scripts/bootstrap-cloudflare-records-key.mjs` **only when deploying the tested current main commit**. It queries Cloudflare Worker secret **names**, and when `RECORDS_ENCRYPTION_KEY` is missing, generates 32 bytes using Node's cryptographically secure `randomBytes`, transfers its 64-character hex encoding through Wrangler standard input, and verifies the secret name appears. The key is never printed, stored in the repository, or generated if the secret name already exists.

**Important:** This initial automated setup is *not* a verified backup of the key. Secret values cannot later be retrieved from Cloudflare. Before real student files are uploaded, the school must approve a durable, access-controlled, recoverable encryption-key management approach and test D1 and R2 backup/restore. Never delete or rotate the key to address an upload issue unless a migration/rewrap and recovery procedure is authorized and tested; doing so can make existing encrypted files permanently unreadable.

Once deployment is green, the authenticated Owner can open **Employee launch setup → Production readiness review → Run encrypted storage test**. That check writes and deletes *random non-personal bytes*; it does **not** approve processing personal student records, replace an independently validated access-control test, or verify privacy/retention requirements.

OpenAI, SMS and email keys remain separate provider-controlled secrets and are **not** bootstrapped by this script.
