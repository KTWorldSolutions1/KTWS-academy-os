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

-- Audited correction proposals never mutate the original punch event.
CREATE TABLE IF NOT EXISTS employee_punch_corrections(
 id TEXT PRIMARY KEY, employee_id TEXT NOT NULL,punch_id TEXT NOT NULL,week TEXT NOT NULL,
 original_at TEXT NOT NULL,proposed_at TEXT NOT NULL,reason TEXT NOT NULL,
 requested_by TEXT NOT NULL,requested_at TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('Pending','Approved','Rejected')),
 reviewed_by TEXT,reviewed_at TEXT);
CREATE INDEX IF NOT EXISTS idx_punch_correction_employee ON employee_punch_corrections(employee_id,week,status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_punch_correction_pending ON employee_punch_corrections(punch_id) WHERE status='Pending';
-- Rules are explicitly opted into by a campus manager; no automated external communications.
CREATE TABLE IF NOT EXISTS academy_workflow_rules(
 id TEXT PRIMARY KEY,campus_id TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('permit','tpr','admissions','fleet')),
 enabled INTEGER NOT NULL DEFAULT 0,created_by TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_rule_kind ON academy_workflow_rules(campus_id,kind);
CREATE TABLE IF NOT EXISTS academy_workflow_runs(
 id TEXT PRIMARY KEY,scheduled_for TEXT NOT NULL,completed_at TEXT NOT NULL,
 rule_id TEXT NOT NULL,created_count INTEGER NOT NULL DEFAULT 0,
 UNIQUE(scheduled_for,rule_id));
