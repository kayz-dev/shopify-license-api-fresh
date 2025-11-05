const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: '*' })); // Allow Shopify; restrict in prod

// Load licenses from JSON (your DB)
let licenses = {};
try {
  const licensesPath = path.join(__dirname, 'licenses.json');
  licenses = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
  console.log(`Loaded ${Object.keys(licenses).length} licenses`);
} catch (err) {
  console.error('Error loading licenses.json:', err);
  licenses = {};
}

app.post('/validate', (req, res) => {
  const { domain, key, exp } = req.body;
  console.log(`Validate request for ${domain}`);

  if (!domain || !key) {
    return res.status(400).json({ valid: false, reason: 'no_key' });
  }

  const stored = licenses[domain];
  if (!stored) {
    return res.status(404).json({ valid: false, reason: 'no_key' });
  }

  // Hash check with salt
  const SALT = 'your-secret-salt'; // Change this
  const providedHash = crypto.createHash('md5').update(key + SALT).digest('hex');
  if (providedHash !== stored.keyHash) {
    console.log(`Invalid key for ${domain}`);
    return res.status(401).json({ valid: false, reason: 'invalid_key' });
  }

  // Exp check
  const expiration = new Date(exp || stored.exp);
  if (expiration < new Date()) {
    console.log(`Expired for ${domain}: ${stored.exp}`);
    return res.status(410).json({ valid: false, reason: 'expired' });
  }

  console.log(`Valid for ${domain}`);
  res.json({ valid: true });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', licensesCount: Object.keys(licenses).length }));

app.listen(PORT, () => {
  console.log(`License API on port ${PORT}`);
});
