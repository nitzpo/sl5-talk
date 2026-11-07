# Poll backend (current state, before upgrades)

- Vote site: https://vote.nitzpo.workers.dev/<poll-id> (Cloudflare Worker `vote`, account nitzpo)
- DB: Cloudflare D1 `ted-polls` (id c2271dd0-641c-4e21-a3ea-4724de98905f), binding `DB`.

Schema:
```sql
CREATE TABLE polls (id TEXT PRIMARY KEY, question TEXT NOT NULL, options TEXT NOT NULL, open INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE TABLE votes (poll_id TEXT NOT NULL, voter TEXT NOT NULL, opt INTEGER NOT NULL, ts INTEGER NOT NULL DEFAULT (unixepoch()), PRIMARY KEY (poll_id, voter));
CREATE TABLE counts (poll_id TEXT NOT NULL, opt INTEGER NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (poll_id, opt));
```

Manual ops (to be replaced by admin endpoints):
```sql
INSERT INTO polls (id, question, options) VALUES ('q1', 'Question?', '["A","B","C"]');
UPDATE polls SET open=0 WHERE id='q1';                                   -- close
DELETE FROM votes WHERE poll_id='q1'; DELETE FROM counts WHERE poll_id='q1';  -- reset
```
Root URL `/` shows the newest open poll. One vote per phone (localStorage voter id, changeable). No auth on voting.
Existing D1 rows: a `test` poll from earlier testing — safe to delete.
