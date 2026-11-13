-- No per-IP cap (venue Wi-Fi = one IP; Nov 13): drop the unused IP index (one less write per vote) and stale kv key.
DROP INDEX IF EXISTS votes_ip;
DELETE FROM kv WHERE k = 'ip_cap';
