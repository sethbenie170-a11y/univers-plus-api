const Stripe = require('stripe');
require('dotenv').config();

// En l'absence de clé, on utilise une clé factice pour ne pas faire planter le démarrage :
// les appels échoueront proprement avec un message clair tant que STRIPE_SECRET_KEY n'est pas renseignée.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_replace_me', {
  apiVersion: '2024-06-20',
});

module.exports = stripe;
