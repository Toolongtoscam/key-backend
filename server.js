import express from "express";
import fs from "fs";

const app = express();
app.use(express.json());

let keys = [];
const file = "keys.json";

// Load keys if file exists
if (fs.existsSync(file)) {
  keys = JSON.parse(fs.readFileSync(file));
}

// Save function
function saveKeys() {
  fs.writeFileSync(file, JSON.stringify(keys, null, 2));
}

// Generate key
app.post("/generate-key", (req, res) => {
  const key = Math.random().toString(36).substring(2, 14) +
              Math.random().toString(36).substring(2, 14);
  const now = Date.now();
  const expires = now + 60 * 60 * 1000;
  keys.push({ key, used: false, created_at: now, expires_at: expires });
  saveKeys();
  res.json({ key, expires });
});

// Validate key
app.post("/mark-used", (req, res) => {
  const { key } = req.body;
  const row = keys.find(k => k.key === key);
  if (!row) return res.status(400).json({ ok:false, msg:"invalid" });
  if (row.used) return res.status(400).json({ ok:false, msg:"used" });
  if (row.expires_at < Date.now()) return res.status(400).json({ ok:false, msg:"expired" });

  row.used = true;
  saveKeys();
  res.json({ ok:true });
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));
