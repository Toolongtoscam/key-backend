import express from "express";
import Database from "better-sqlite3";
import crypto from "crypto";

const app = express();
app.use(express.json());
const db = new Database("keys.db");

// Create table if not exists
db.exec(`
CREATE TABLE IF NOT EXISTS keys (
  key TEXT PRIMARY KEY,
  used INTEGER DEFAULT 0,
  created_at INTEGER,
  expires_at INTEGER
);
`);

// Generate key
app.post("/generate-key", (req, res) => {
  const key = crypto.randomBytes(12).toString("hex");
  const now = Date.now();
  const expires = now + 60 * 60 * 1000; // 1 hour
  db.prepare("INSERT INTO keys VALUES (?,0,?,?)").run(key, now, expires);
  res.json({ key, expires });
});

// Validate and mark used
app.post("/mark-used", (req, res) => {
  const { key } = req.body;
  const row = db.prepare("SELECT * FROM keys WHERE key=?").get(key);
  if (!row) return res.status(400).json({ ok: false, msg: "invalid" });
  if (row.used) return res.status(400).json({ ok: false, msg: "used" });
  if (row.expires_at < Date.now()) return res.status(400).json({ ok: false, msg: "expired" });

  db.prepare("UPDATE keys SET used=1 WHERE key=?").run(key);
  res.json({ ok: true });
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));
