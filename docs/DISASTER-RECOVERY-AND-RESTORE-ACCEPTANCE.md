# Lone Star Academy OS — data recovery rehearsal and go-live gate

**State: local fictional recovery is tested in CI; production disaster recovery is NOT accepted or signed off.**

For Greensboro, Mansfield and Dallas, this protocol applies to the shared Academy OS database, student files and the encryption key. It is not permission to export student records, enable uploads or rotate the existing key.

## Owner's approval checklist (plain language)

1. **Name two authorized school custodians.** At least one school-appointed custodian must be able to recover the *existing* production `RECORDS_ENCRYPTION_KEY` from a secure, independent school-controlled escrow. Cloudflare Worker secrets can show only a name, not return the value. The deployment originally generated the key without creating escrow; no recovery copy is verified. **If that key cannot be recovered, do not permit real document uploads.** Do not rotate it as a workaround.
2. **Choose secure backup storage.** Record who owns the account, who may restore, how access is audited, what retention is approved, and where the encrypted independent backup and its encryption key live. Do not put backups or secret values in GitHub, chat, email, public folders or school tablets.
3. **Authorize a separate recovery workspace.** The rehearsal must be isolated from live student and employee accounts, use fictional records only, and never point restore commands at the production D1/R2 bindings or original school domain.
4. **Test a complete restore.** Qualified technical personnel should capture a consistent D1 recovery point and recoverable copies/versions of the matching R2 objects, then restore these to isolated D1 and R2 resources with the existing key available only to the authorized operator. Verify all three fictional campuses, identity access boundaries, restricted upload/download and audit events.
5. **Demonstrate failure behavior.** Confirm wrong/absent keys cannot decrypt protected documents, tampered ciphertext is rejected, revoked sessions stay revoked and an unauthenticated user cannot browse the isolated files.
6. **Record evidence and sign.** Save the test time, recovery point, restored record count, R2 object check, reported downtime/recovery-point interval, tester, second custodian and authorized owner sign-off. Never put actual student identities, credentials or decrypted documents in the report.
7. **Only then request enabling uploads.** Even after successful recovery, school privacy/consent, retention, state licensing and staff-role tests are separate requirements. Do not change `SCHOOL_FILE_UPLOADS_ENABLED=false` without express owner approval.

## What the automated fictional drill checks

The CI test `tests/disaster-recovery.test.mjs` creates a **temporary local SQLite + filesystem R2-equivalent fixture**, then:
- Creates three fictional campuses, three fictional students and a signed-in fictional owner.
- Uploads and encrypts a deliberately fake document using the same application encryption, metadata and authentication APIs.
- Obtains a consistent **local SQLite** snapshot using `VACUUM INTO`, copies the encrypted local object and checks cryptographic hashes before restoring to a different temporary directory.
- Opens the restored system in a **separate Node process**; verifies three campuses/students, audit history and decrypted file content.
- Verifies that the wrong AES key and a tampered encrypted document both fail without returning plaintext.
- Deletes every temporary fixture at the end.

A green result shows the **local algorithm, schemas and snapshot concept** can work. It **does not** verify Cloudflare D1 Time Travel recovery, Cloudflare R2 backups/versioning, production owner authentication, school escrow, retention controls or disaster-recovery performance. No local test can replace an isolated Cloudflare restore.

## Technical production rehearsal (requires explicit custodian authorization)

**Before a write:** obtain a written change authorization and designate an isolated **nonproduction** Cloudflare account/environment with its own Wrangler config and R2 bucket. Double-check account ID and resource names. Never change production `wrangler.jsonc` just to run a restore rehearsal.

1. Read-only inspect D1 Time Travel availability/bookmark via Cloudflare tools. A bookmark is **not** a recoverable backup on its own. Confirm the restoration mechanism, retention window and isolation on official Cloudflare documentation.
2. Enumerate document metadata in D1 **without printing personal information** (counts and tenant/campus totals only). Verify actual R2 objects exist and the school's selected independent retention/versioned backup captures ciphertext objects consistent with the database point.
3. Create an immutable incident/recovery ticket containing the approved isolated destination, encrypted backup reference, bookmark/time, operator, second witness, and school-controlled key-access procedure. Never paste the key into the ticket.
4. Restore source data exclusively into the isolated environment. Test with **fictional student fixtures**; if the only available backup contains real personal information, stop until the owner approves a separately controlled, protected-data recovery procedure and a lawful secure testing environment.
5. Deploy/test the exact application revision and authentication rules against that isolated environment. Capture only pass/fail/counts, SHA-256 hashes and timestamps. Validate sample encrypted bytes with the recoverable original encryption key without logging it.
6. Turn off the recovery environment and revoke temporary credentials after sign-off; preserve only the approved audit summary.

## Operational recovery targets (must be approved, not invented)

- **RPO (recovery point objective):** how much school work, training evidence and tuition history the school can afford to lose.
- **RTO (recovery time objective):** how quickly the school must restore admissions and daily training without miscrediting instructor hours.
- **Retention:** minimum and maximum backups, video/photo evidence and audit logs, based on the school's approved NC/TX legal/policy requirements.
- **Restoration order:** access control and sessions → student/class identity → instructor append-only evidence → financial and sponsor records → encrypted file evidence → partner/student portal grants and outbound messages. Never auto-repeat external messages, payments or FMCSA submissions during restoration.

### Acceptance evidence table

| Item | Evidence | Responsible signer | Result |
| --- | --- | --- | --- |
| Independent original production encryption-key escrow verified | Vault receipt and two-person recovery demonstration (no key value) | School owner + key custodian | **Pending** |
| Cloudflare D1 isolated recovery | Source backup/time and restored counts | Authorized technical operator | **Pending** |
| Cloudflare R2 matching encrypted object restore | Hash-match audit and authorized fake document read | Authorized technical operator | **Pending** |
| Three-campus staff role and session isolation | Synthetic test outcomes (no identities) | Campus management | **Pending** |
| Privacy and approved retention policy | Signed policies | School owner | **Pending** |
| Regulatory, instructor and yard/road authorization | Authority reference per campus | School owner/manager | **Pending** |
| Owner release for production protected document uploads | Signed approval and configuration change review | School owner | **Pending** |

**Important:** The existing production encryption key must be preserved. Without verified custody, a successful automated canary or green deployment is not sufficient to declare the platform safe for real protected student uploads.
