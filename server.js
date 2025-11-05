const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: '*' })); // Allow Shopify (restrict in prod)

// Mock DB: { domain: { keyHash: 'md5-of-key+salt', exp: 'YYYY-MM-DD' } }
// Replace with real DB (e.g., fetch from Supabase via env vars)
const licenses = {
  'your-client-shop.myshopify.com': { keyHash: '5d41402abc4b2a76b9719d911017c592', exp: '2025-12-01' } // MD5 of 'clientkey123your-secret-salt'
};

app.post('/validate', (req, res) => {
  const { domain, key, exp } = req.body;
  if (!domain || !key) {
    return res.status(400).json({ valid: false, reason: 'no_key' });
  }

  const stored = licenses[domain];
  if (!stored) {
    return res.status(404).json({ valid: false, reason: 'no_key' });
  }

  // Simple hash check (use bcrypt in prod)
  const crypto = require('crypto');
  const providedHash = crypto.createHash('md5').update(key + 'your-secret-salt').digest('hex');
  if (providedHash !== stored.keyHash) {
    return res.status(401).json({ valid: false, reason: 'invalid_key' });
  }

  // Expiration check
  const expiration = new Date(exp || stored.exp);
  if (expiration < new Date()) {
    return res.status(410).json({ valid: false, reason: 'expired' });
  }

  res.json({ valid: true });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`License API running on port ${PORT}`);
});
