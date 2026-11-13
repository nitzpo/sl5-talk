-- Per-IP cap moves from every vote (COUNT scan, overloaded D1 at 300 phones) to voter-id creation (O(1) counter).
CREATE TABLE hellos (run_id INTEGER NOT NULL, ip TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (run_id, ip));
-- ip_cap now = new phones per IP (one venue Wi-Fi) per run: 2x the room
UPDATE kv SET v = '600' WHERE k = 'ip_cap';
