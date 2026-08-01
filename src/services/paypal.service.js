// Intégration PayPal via l'API REST directement (fetch natif de Node.js — aucun SDK requis).
// En mode sandbox par défaut ; passez PAYPAL_MODE=live en production avec des identifiants réels.
require('dotenv').config();

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET doivent être renseignés dans .env');
  }
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Impossible d'obtenir un token PayPal : ${text}`);
  }
  const data = await response.json();
  return data.access_token;
}

async function createOrder(amount, currency = 'USD') {
  const token = await getAccessToken();
  const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: String(amount) } }],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Erreur PayPal lors de la création de commande : ${JSON.stringify(data)}`);
  }
  const approveLink = (data.links || []).find((l) => l.rel === 'approve');
  return { id: data.id, approveUrl: approveLink ? approveLink.href : null, raw: data };
}

async function captureOrder(paypalOrderId) {
  const token = await getAccessToken();
  const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Erreur PayPal lors de la capture : ${JSON.stringify(data)}`);
  }
  return data;
}

module.exports = { getAccessToken, createOrder, captureOrder };
