// Dependencias principales: servidor Express y SDK Mercado Pago (para crear preferencias dinámicas)
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const { getMpToken } = require('./config');
const mercadopago = require('mercadopago');

// Instancia de la aplicación Express
const app = express();
app.use(cors());
app.use(express.json());

// Obtiene token Mercado Pago (real o desencriptado) si existe
const MP_TOKEN = getMpToken();
// Configura SDK sólo si hay token disponible
if (MP_TOKEN) {
  mercadopago.configure({ access_token: MP_TOKEN });
}
const PORT = process.env.PORT || 3000;

// ===== LÓGICA MÍNIMA DE DESCUENTOS / CUPONES =====
// Formato env opcional: COUPONS="PROMO10:10,BLACK15:15,ENVIO:5"
function loadCoupons() {
  const raw = process.env.COUPONS || '';
  return raw.split(',').filter(Boolean).reduce((acc, pair) => {
    const [code, pct] = pair.split(':');
    const percent = Number(pct);
    if (code && percent > 0 && percent <= 90) {
      acc[code.trim().toUpperCase()] = percent;
    }
    return acc;
  }, {});
}
const COUPONS = loadCoupons();

function applyDiscount(basePrice, couponCode) {
  if (!couponCode) return { finalPrice: basePrice, discountPercent: 0, applied: false };
  const percent = COUPONS[couponCode.toUpperCase()] || 0;
  if (!percent) return { finalPrice: basePrice, discountPercent: 0, applied: false };
  const discounted = +(basePrice * (1 - percent / 100)).toFixed(2);
  return { finalPrice: discounted, discountPercent: percent, applied: true };
}

// POST /create-preference: crea preferencia con posible cupón o responde mock sin token
app.post('/create-preference', async (req, res) => {
  const body = req.body || {};
  const title = String(body.title || 'Producto').slice(0, 120);
  const price = Number(body.price || 0);
  const currency = String(body.currency || 'ARS').toUpperCase();
  const quantity = Number(body.quantity || 1);
  const description = String(body.description || '').slice(0, 600);
  const couponCode = body.couponCode ? String(body.couponCode).trim() : '';

  if (price <= 0 || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid price or quantity' });
  }

  // Calcula precio final con cupón si corresponde
  const { finalPrice, discountPercent, applied } = applyDiscount(price, couponCode);

  // Flujo real con SDK
  if (MP_TOKEN) {
    try {
      const preference = await mercadopago.preferences.create({
        items: [
          {
            title,
            unit_price: finalPrice,
            currency_id: currency,
            quantity,
            description: applied ? `${description}\nCupón: ${couponCode} (-${discountPercent}%)` : description
          }
        ]
      });
      const data = preference.body || preference;
      return res.json({ id: data.id, init_point: data.init_point, discountApplied: applied, discountPercent });
    } catch (err) {
      const details = err.response ? err.response.data : err.message;
      console.error('Mercado Pago error:', details);
      return res.status(500).json({ error: 'Error creating preference at Mercado Pago', details });
    }
  }

  // Flujo mock sin token
  const mockId = `MOCK_${Date.now()}`;
  const mockUrl = `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${mockId}`;
  return res.json({ id: mockId, init_point: mockUrl, mock: true, discountApplied: applied, discountPercent });
});

// GET /health: estado básico del servidor y configuración MP
app.get('/health', (req, res) => {
  res.json({ ok: true, mpConfigured: !!MP_TOKEN, couponsLoaded: Object.keys(COUPONS).length });
});

// Serve static files from project root so the same server can serve the frontend
const path = require('path');
const staticDir = path.join(__dirname, '..'); // project root

// Sirve archivos estáticos del directorio raíz del proyecto
app.use(express.static(staticDir));

// Fallback to index.html for any non-API GET (useful if you type the URL directly)
// Fallback: cualquier GET que no sea a la API devuelve la landing (SPA simple)
app.get('*', (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/create-preference')) return next();
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Preference + static server running on port ${PORT}. Mercado Pago configurado: ${!!MP_TOKEN}`);
});
