CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,owner TEXT NOT NULL,kind TEXT NOT NULL,payload TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,updated TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_records_owner_kind ON records(owner,kind);
CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,owner TEXT NOT NULL,record_id TEXT NOT NULL,action TEXT NOT NULL,at TEXT NOT NULL,payload TEXT NOT NULL,revision INTEGER,actor TEXT,snapshot TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_record_revision ON audit(owner,record_id,revision);
CREATE TABLE IF NOT EXISTS school_files(key TEXT PRIMARY KEY,owner TEXT NOT NULL,campus TEXT NOT NULL,student TEXT,category TEXT NOT NULL,name TEXT NOT NULL,mime TEXT NOT NULL,actor TEXT NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT,active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,account TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS activations(token TEXT PRIMARY KEY,account TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS partner_accounts(account TEXT PRIMARY KEY,partner TEXT NOT NULL,campus TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS partner_grants(id TEXT PRIMARY KEY,account TEXT NOT NULL,partner TEXT NOT NULL,student TEXT NOT NULL,campus TEXT NOT NULL,fields TEXT NOT NULL,consent_key TEXT NOT NULL,expires INTEGER NOT NULL,approved_by TEXT NOT NULL,approved_at TEXT NOT NULL,revoked_at TEXT);
CREATE INDEX IF NOT EXISTS idx_partner_grants_account ON partner_grants(account,expires);
CREATE TABLE IF NOT EXISTS student_accounts(account TEXT PRIMARY KEY,student TEXT NOT NULL UNIQUE,campus TEXT NOT NULL,consent_key TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,invited_at TEXT NOT NULL,activated_at TEXT);
CREATE INDEX IF NOT EXISTS idx_student_accounts_student ON student_accounts(student,campus);


CREATE TABLE IF NOT EXISTS billing_charges(
 id TEXT PRIMARY KEY, owner TEXT NOT NULL,campus TEXT NOT NULL,student TEXT NOT NULL,
 amount_cents INTEGER NOT NULL CHECK(amount_cents>0),description TEXT NOT NULL,
 category TEXT NOT NULL,due_date TEXT NOT NULL,funding_type TEXT,
 status TEXT NOT NULL CHECK(status IN ('Open','Voided')),created TEXT NOT NULL,created_by TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_billing_charges_student ON billing_charges(owner,campus,student);
CREATE TABLE IF NOT EXISTS billing_payments(
 id TEXT PRIMARY KEY,owner TEXT NOT NULL,campus TEXT NOT NULL,student TEXT NOT NULL,
 charge_id TEXT NOT NULL,provider TEXT NOT NULL,source TEXT NOT NULL,
 amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
 refunded_cents INTEGER NOT NULL DEFAULT 0,disputed_cents INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL CHECK(status IN ('Pending','Confirmed','Rejected')),
 external_ref TEXT,notes TEXT NOT NULL DEFAULT '',created TEXT NOT NULL,
 received_at TEXT,created_by TEXT NOT NULL,verified_by TEXT,verified_at TEXT,
 FOREIGN KEY(charge_id) REFERENCES billing_charges(id));
CREATE INDEX IF NOT EXISTS idx_billing_payments_student ON billing_payments(owner,campus,student);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_payment_external ON billing_payments(owner,source,external_ref) WHERE external_ref IS NOT NULL AND source='Stripe';
CREATE TABLE IF NOT EXISTS billing_stripe_sessions(
 id TEXT PRIMARY KEY,owner TEXT NOT NULL,campus TEXT NOT NULL,student TEXT NOT NULL,
 charge_id TEXT NOT NULL,amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
 status TEXT NOT NULL,created TEXT NOT NULL,expires_at INTEGER NOT NULL,
 payment_intent TEXT,FOREIGN KEY(charge_id) REFERENCES billing_charges(id));
CREATE INDEX IF NOT EXISTS idx_billing_sessions_charge ON billing_stripe_sessions(owner,charge_id,status);
CREATE TABLE IF NOT EXISTS billing_webhook_events(
 id TEXT PRIMARY KEY,type TEXT NOT NULL,handled TEXT NOT NULL,payment_ref TEXT,
 outcome TEXT NOT NULL);

-- Employee payroll punches are append-only. Personnel changes must use a separate reviewed correction workflow.
CREATE TABLE IF NOT EXISTS employee_punches(id TEXT PRIMARY KEY,employee_id TEXT NOT NULL,campus_id TEXT NOT NULL,action TEXT NOT NULL CHECK(action IN ('clock_in','break_start','break_end','clock_out')),at TEXT NOT NULL,actor TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_employee_punches_employee_time ON employee_punches(employee_id,at);
CREATE TABLE IF NOT EXISTS employee_payroll_approvals(employee_id TEXT NOT NULL,week TEXT NOT NULL,approved_by TEXT NOT NULL,approved_at TEXT NOT NULL,PRIMARY KEY(employee_id,week));

-- Confidential employee pay rates, separate from ordinary staff records.
CREATE TABLE IF NOT EXISTS employee_pay_rates(employee_id TEXT NOT NULL,campus_id TEXT NOT NULL,rate_cents INTEGER NOT NULL CHECK(rate_cents>0),updated_by TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(employee_id,campus_id));
CREATE TABLE IF NOT EXISTS employee_pay_rate_audit(id TEXT PRIMARY KEY,employee_id TEXT NOT NULL,campus_id TEXT NOT NULL,previous_cents INTEGER,new_cents INTEGER NOT NULL,actor TEXT NOT NULL,at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_pay_rate_audit ON employee_pay_rate_audit(employee_id,campus_id,at);

-- School-owner profiles are provisioned without passwords or activated logins.
-- An authenticated existing owner must issue each personal one-use activation link.
INSERT OR IGNORE INTO records(id,owner,kind,payload,revision,updated) VALUES
('school-owner-manny','academy-owner','staff','{"id":"school-owner-manny","kind":"staff","name":"Manny","status":"Active","email":"manny.e@lonestar-tda.com","accessRole":"School owner","campusIds":[],"position":"School Owner","department":"School Leadership"}',1,strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('school-owner-alisha','academy-owner','staff','{"id":"school-owner-alisha","kind":"staff","name":"Alisha","status":"Active","email":"alisha.a@lonestar-tda.com","accessRole":"School owner","campusIds":[],"position":"School Owner","department":"School Leadership"}',1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));

-- Greensboro operating assignment for the Academy OS builder.
-- Developer is a position label, NOT an elevated school-data permission.
-- This migration intentionally refuses to guess if Greensboro is absent or ambiguous.
-- It preserves the special bootstrap owner account and all School owner staff profiles.
INSERT OR IGNORE INTO records(id,owner,kind,payload,revision,updated)
SELECT 'staff-ktws-greensboro-developer','academy-owner','staff',
 json_object('id','staff-ktws-greensboro-developer','kind','staff',
             'name','Travis','email','ktworldsolutionsllc@outlook.com',
             'status','Active','accessRole','Campus manager',
             'campusIds',json_array(c.id),
             'position','Campus Manager / Academy OS Developer',
             'department','Greensboro Operations & Platform Development'),1,
 strftime('%Y-%m-%dT%H:%M:%fZ','now')
FROM records c
WHERE c.owner='academy-owner' AND c.kind='campuses'
 AND json_extract(c.payload,'$.status')='Active'
 AND (lower(json_extract(c.payload,'$.name')) LIKE '%greensboro%'
      OR lower(json_extract(c.payload,'$.city'))='greensboro')
 AND (SELECT COUNT(*) FROM records g WHERE g.owner='academy-owner'
      AND g.kind='campuses' AND json_extract(g.payload,'$.status')='Active'
      AND (lower(json_extract(g.payload,'$.name')) LIKE '%greensboro%'
      OR lower(json_extract(g.payload,'$.city'))='greensboro'))=1
 AND NOT EXISTS (
      SELECT 1 FROM records s WHERE s.owner='academy-owner' AND s.kind='staff'
       AND lower(json_extract(s.payload,'$.email'))='ktworldsolutionsllc@outlook.com');

-- If this email already has a non-owner staff record, reuse that identity
-- instead of introducing duplicate employee IDs/time-clock histories.
UPDATE records SET
 payload=json_set(payload,
         '$.accessRole','Campus manager',
         '$.status','Active',
         '$.campusIds',json_array((
            SELECT c.id FROM records c WHERE c.owner='academy-owner' AND c.kind='campuses'
            AND json_extract(c.payload,'$.status')='Active'
            AND (lower(json_extract(c.payload,'$.name')) LIKE '%greensboro%'
            OR lower(json_extract(c.payload,'$.city'))='greensboro')
            LIMIT 1)),
         '$.position','Campus Manager / Academy OS Developer',
         '$.department','Greensboro Operations & Platform Development'),
 revision=revision+1,updated=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE owner='academy-owner' AND kind='staff'
 AND lower(json_extract(payload,'$.email'))='ktworldsolutionsllc@outlook.com'
 AND coalesce(json_extract(payload,'$.accessRole'),'')!='School owner'
 AND (SELECT COUNT(*) FROM records c WHERE c.owner='academy-owner'
      AND c.kind='campuses' AND json_extract(c.payload,'$.status')='Active'
      AND (lower(json_extract(c.payload,'$.name')) LIKE '%greensboro%'
       OR lower(json_extract(c.payload,'$.city'))='greensboro'))=1
 AND (coalesce(json_extract(payload,'$.status'),'')!='Active'
      OR coalesce(json_extract(payload,'$.accessRole'),'')!='Campus manager'
      OR json_extract(payload,'$.position')!='Campus Manager / Academy OS Developer'
      OR json_extract(payload,'$.department')!='Greensboro Operations & Platform Development'
      OR json_array_length(json_extract(payload,'$.campusIds'))!=1
      OR json_extract(payload,'$.campusIds[0]')!=(
         SELECT c.id FROM records c WHERE c.owner='academy-owner' AND c.kind='campuses'
           AND json_extract(c.payload,'$.status')='Active'
           AND (lower(json_extract(c.payload,'$.name')) LIKE '%greensboro%'
              OR lower(json_extract(c.payload,'$.city'))='greensboro') LIMIT 1));

-- Establish a distinct user identity only if the email does not already exist.
-- Password and activation token remain unset until a secure owner invitation.
INSERT OR IGNORE INTO accounts(id,email)
SELECT 'account-ktws-greensboro-developer','ktworldsolutionsllc@outlook.com'
WHERE EXISTS(SELECT 1 FROM records s WHERE s.owner='academy-owner' AND s.kind='staff'
 AND lower(json_extract(s.payload,'$.email'))='ktworldsolutionsllc@outlook.com'
 AND json_extract(s.payload,'$.accessRole')='Campus manager');
