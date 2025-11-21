const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const { getMpToken } = require('./config');
const mercadopago = require('mercadopago');

const app = express();
app.use(cors());
app.use(express.json());

const MP_TOKEN = getMpToken();
if (MP_TOKEN) {
  mercadopago.configure({ access_token: MP_TOKEN });
}
const PORT = process.env.PORT || 3000;

app.post('/create-preference', async (req, res) => {
  const body = req.body || {};
  const title = String(body.title || 'Producto').slice(0, 120);
  const price = Number(body.price || 0);
  const currency = String(body.currency || 'ARS').toUpperCase();
  const quantity = Number(body.quantity || 1);
  const description = String(body.description || '').slice(0, 600);

  if (price <= 0 || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid price or quantity' });
  }

  if (MP_TOKEN) {
    try {
      const preference = await mercadopago.preferences.create({
        items: [
          {
            title,
            unit_price: price,
            currency_id: currency,
            quantity,
            description
          }
        ]
      });
      const data = preference.body || preference;
      return res.json({ id: data.id, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point });
    } catch (err) {
      const details = err.response ? err.response.data : err.message;
      console.error('Mercado Pago error:', details);
      return res.status(500).json({ error: 'Error creating preference at Mercado Pago', details });
    }
  }

  const mockId = `MOCK_${Date.now()}`;
  const mockUrl = `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${mockId}`;
  return res.json({ id: mockId, init_point: mockUrl, mock: true });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, mpConfigured: !!MP_TOKEN });
});

// Serve static files from project root so the same server can serve the frontend
const path = require('path');
const staticDir = path.join(__dirname, '..'); // project root

app.use(express.static(staticDir));

// Fallback to index.html for any non-API GET (useful if you type the URL directly)
app.get('*', (req, res, next) => {
  if (req.method !== 'GET') return next();
  // Avoid catching API routes
  if (req.path.startsWith('/create-preference')) return next();
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Preference + static server running on port ${PORT}. Mercado Pago configurado: ${!!MP_TOKEN}`);
});
