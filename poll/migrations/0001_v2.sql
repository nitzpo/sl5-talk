-- v2: runs (rehearsal/live), votes keyed by run, kv state. Poll content lives in src/polls.js.
-- Drops v1 tables (only held a leftover `test` poll).
DROP TABLE IF EXISTS counts;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS polls;

CREATE TABLE runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('rehearsal', 'live')),
  label TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE votes (
  run_id INTEGER NOT NULL,
  poll_id TEXT NOT NULL,
  voter TEXT NOT NULL,
  opt INTEGER NOT NULL,
  ip TEXT NOT NULL DEFAULT '',
  ts INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (run_id, poll_id, voter)
);
CREATE INDEX votes_ip ON votes (run_id, poll_id, ip);

-- active_run, current (idle|links|<group>), open (JSON array of poll ids), rev, epoch (bumped on reset), poll_ms, ip_cap
CREATE TABLE kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);

INSERT INTO runs (kind, label) VALUES ('rehearsal', 'initial');
INSERT INTO kv (k, v) VALUES
  ('active_run', '1'), ('current', 'idle'), ('open', '[]'), ('rev', '1'), ('epoch', '1'),
  ('poll_ms', '5000'), ('ip_cap', '300');
