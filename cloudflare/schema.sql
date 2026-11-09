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

CREATE TABLE IF NOT EXISTS employee_timecards(id TEXT PRIMARY KEY,owner TEXT NOT NULL,employee TEXT NOT NULL,closed INTEGER NOT NULL DEFAULT 0,revision INTEGER NOT NULL,created TEXT NOT NULL,payload TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_one_open_clock ON employee_timecards(owner,employee) WHERE closed=0;
CREATE TABLE IF NOT EXISTS employee_time_audit(id TEXT PRIMARY KEY,owner TEXT NOT NULL,card_id TEXT NOT NULL,revision INTEGER NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,at TEXT NOT NULL,payload TEXT NOT NULL,UNIQUE(owner,card_id,revision));
