// Devises "zéro décimale" au sens de Stripe (pas de sous-unité, ex. le FCFA/XOF n'a pas de centimes).
// Référence : https://docs.stripe.com/currencies#zero-decimal
const ZERO_DECIMAL_CURRENCIES = [
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
];

// Stripe attend un montant dans la plus petite unité de la devise (les centimes pour l'euro,
// par exemple). Pour les devises zéro-décimale comme le XOF, le montant est utilisé tel quel.
function toStripeAmount(amount, currency) {
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(String(currency).toUpperCase());
  return isZeroDecimal ? Math.round(amount) : Math.round(amount * 100);
}

module.exports = { toStripeAmount, ZERO_DECIMAL_CURRENCIES };
