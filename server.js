const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

const licenses = JSON.parse(fs.readFileSync(path.join(__dirname, 'licenses.json')));

app.post('/validate', (req, res) => {
  const { domain, key } = req.body;
  const domainKey = Object.keys(licenses).find(d => d.includes(domain));
  if (!domainKey) return res.json({ valid: false, reason: 'no_key' });

  const hash = crypto.createHash('md5').update(key).digest('hex');
  const valid = licenses[domainKey].keyHash === hash &&
                new Date(licenses[domainKey].exp) > new Date();

  console.log('VALIDATE:', { domain, hash, valid });
  res.json({ valid });
});

app.get('/', (req, res) => res.send('API LIVE'));
app.listen(process.env.PORT || 3000, () => console.log('API READY'));
