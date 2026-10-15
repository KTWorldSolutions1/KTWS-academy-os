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
