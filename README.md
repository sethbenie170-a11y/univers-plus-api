# UNIVERS PLUS — API back-end (auth, catalogue, panier, commandes, paiements)

Back-end réel (Node.js / Express / Sequelize) pour UNIVERS PLUS : authentification JWT, catalogue produits/catégories, panier persistant, commandes avec checkout transactionnel, codes promo, et paiements Stripe (mode test) + PayPal (sandbox). Les Mobile Money locaux (Orange, MTN, Moov, Wave) sont simulés en attendant un compte marchand réel — voir la section Paiements ci-dessous.

> ⚠️ **Important** : ce code a été écrit et vérifié syntaxiquement, mais n'a pas pu être exécuté dans l'environnement où il a été généré (pas d'accès réseau pour installer les paquets npm). Suivez les étapes ci-dessous sur votre machine pour l'installer et le tester — la logique est standard et ne présente pas de piège particulier, mais testez tout de même avant toute mise en production.

## Ce que contient ce module

### Authentification
- Inscription (`POST /api/auth/register`)
- Connexion (`POST /api/auth/login`)
- Rafraîchissement de session (`POST /api/auth/refresh`)
- Déconnexion (`POST /api/auth/logout`)
- Profil de l'utilisateur connecté (`GET /api/auth/me`)
- Mots de passe hachés avec **bcrypt** (jamais stockés en clair)
- Sessions **JWT** : un access token de courte durée (15 min) + un refresh token de longue durée (7 jours), stocké haché en base et **rotatif** (invalidé et renouvelé à chaque utilisation)
- Limitation de débit sur les tentatives de connexion/inscription (anti force brute)

### Catégories
- `GET /api/categories` — liste publique, avec le nombre de produits par catégorie
- `POST /api/categories` — création (**admin uniquement**)
- `PUT /api/categories/:id` — modification (**admin uniquement**)
- `DELETE /api/categories/:id` — suppression (**admin uniquement**), refusée si des produits y sont encore rattachés

### Produits
- `GET /api/products` — liste publique, avec filtres et pagination :
  `?category=electronique&search=casque&brand=TechPro&minPrice=5000&maxPrice=50000&inStock=true&sort=price_asc&page=1&limit=12`
  (valeurs possibles pour `sort` : `price_asc`, `price_desc`, `newest`, `rating`, `popularity`)
- `GET /api/products/:id` — détail d'un produit
- `POST /api/products` — création (**admin uniquement**)
- `PUT /api/products/:id` — modification (**admin uniquement**)
- `DELETE /api/products/:id` — suppression (**admin uniquement**)

### Panier (par utilisateur connecté)
- `GET /api/cart` — panier actuel avec totaux calculés (sous-total, livraison, total)
- `POST /api/cart/items` — ajouter un produit `{ "productId": 1, "quantity": 2 }` (vérifie le stock disponible)
- `PUT /api/cart/items/:productId` — modifier la quantité
- `DELETE /api/cart/items/:productId` — retirer un article
- `DELETE /api/cart` — vider le panier

### Commandes
- `POST /api/orders` — **checkout** : transforme le panier de l'utilisateur en commande. Vérifie le stock, applique un code promo optionnel, calcule la livraison (gratuite dès 50 000 FCFA), décrémente le stock et vide le panier — tout dans une transaction atomique.
  ```json
  {
    "paymentMethod": "Orange Money",
    "promoCode": "UNIVERS10",
    "shippingName": "Fatou Bamba",
    "shippingPhone": "+225 07 12 34 56 78",
    "shippingCity": "Abidjan",
    "shippingCommune": "Cocody",
    "shippingDetails": "Rue des Jardins, Villa 12"
  }
  ```
- `GET /api/orders` — historique des commandes de l'utilisateur connecté (paginé, filtrable par `?status=`). Un admin peut voir toutes les commandes avec `?all=true`.
- `GET /api/orders/:id` — détail d'une commande (le propriétaire ou un admin uniquement)
- `PUT /api/orders/:id/status` — changement de statut (**admin uniquement**) parmi `Préparation`, `Expédiée`, `En livraison`, `Livrée`, `Annulée`. Annuler une commande remet automatiquement les articles en stock ; passer à `Expédiée` génère un numéro de suivi.

### Promotions
- `POST /api/promotions/validate` — vérification publique d'un code avant paiement : `{ "code": "UNIVERS10" }`
- `GET /api/promotions` — liste complète (**admin uniquement**)
- `POST /api/promotions` — création (**admin uniquement**)
- `PUT /api/promotions/:id` — modification (**admin uniquement**)
- `DELETE /api/promotions/:id` — suppression (**admin uniquement**)

### Paiements
- **Stripe (mode test)** :
  - `POST /api/payments/stripe/create-session` — crée une session Stripe Checkout pour une commande, retourne l'URL de paiement
  - `POST /api/payments/stripe/webhook` — reçoit la confirmation de Stripe (`checkout.session.completed`) et marque la commande comme payée
- **PayPal (sandbox)** :
  - `POST /api/payments/paypal/create-order` — crée une commande PayPal, retourne le lien d'approbation
  - `POST /api/payments/paypal/capture/:paypalOrderId` — capture le paiement après approbation du client
- **Mobile Money (Orange, MTN, Moov, Wave) — ⚠️ simulation uniquement** :
  - `POST /api/payments/mobile-money/initiate` — simule l'envoi d'une demande de paiement
  - `POST /api/payments/mobile-money/:paymentId/confirm` — simule la confirmation (**admin uniquement**, tient lieu de webhook en attendant une vraie intégration)
- `GET /api/payments/order/:orderId` — historique des tentatives de paiement d'une commande

**Important** : aucune passerelle Orange Money / MTN Money / Moov Money / Wave n'est réellement branchée — ces opérateurs exigent un compte marchand agréé obtenu directement auprès d'eux (démarche administrative, pas une simple clé API publique). Le flux ci-dessus simule le parcours pour que le reste de l'application (statut de commande, etc.) fonctionne de bout en bout ; remplacez-le par leurs API officielles une fois votre compte actif.


- Validation stricte des champs (`express-validator`)
- En-têtes de sécurité (`helmet`), CORS configurable
- Compatible **PostgreSQL** (production) et **SQLite** (test local rapide) via une simple variable d'environnement
- Script de seed (`npm run seed`) pour peupler la base avec les 15 catégories, 15 produits et 3 codes promo de démonstration déjà utilisés dans les prototypes front-end

## Installation

```bash
cd univers-plus-api
npm install
cp .env.example .env
```

### Option A — Test rapide avec SQLite (aucune base à installer)

Dans `.env`, mettez :
```
DB_DIALECT=sqlite
```
Puis démarrez :
```bash
npm start
```
Un fichier `data/dev.sqlite` sera créé automatiquement au premier lancement.

### Option B — PostgreSQL (recommandé pour la production)

1. Créez une base PostgreSQL (localement, ou chez un hébergeur comme Railway, Render, Supabase, etc.)
2. Renseignez dans `.env` : `DB_DIALECT=postgres`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
3. Démarrez :
```bash
npm start
```

Dans les deux cas, les tables sont créées automatiquement au démarrage (via `sequelize.sync()`). Pour un vrai projet en production, remplacez `sync()` par de véritables migrations (`sequelize-cli`) afin de garder un historique versionné du schéma.

## Variables d'environnement importantes

Générez des secrets JWT robustes avant toute mise en production :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copiez le résultat dans `JWT_ACCESS_SECRET` et générez-en un second pour `JWT_REFRESH_SECRET`.

## Tester l'API avec curl

**Inscription**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Fatou Bamba","email":"fatou@example.ci","password":"motdepasse123","phone":"+225 07 12 34 56 78"}'
```

**Connexion**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fatou@example.ci","password":"motdepasse123"}'
```
Réponse : `{ "accessToken": "...", "refreshToken": "...", "user": {...} }`

**Profil (route protégée)**
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

**Rafraîchir la session** (quand l'access token expire au bout de 15 min)
```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"VOTRE_REFRESH_TOKEN"}'
```

**Déconnexion**
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"VOTRE_REFRESH_TOKEN"}'
```

## Peupler la base avec des données de démonstration

```bash
npm run seed
```
Crée les 15 catégories et 15 produits déjà présents dans les prototypes front-end (boutique, admin, etc.), pour tester immédiatement l'API avec des données réalistes.

## Tester les catégories et produits avec curl

**Liste des catégories**
```bash
curl http://localhost:4000/api/categories
```

**Liste des produits avec filtres**
```bash
curl "http://localhost:4000/api/products?category=electronique&sort=price_asc&page=1&limit=6"
```

**Créer un produit (nécessite un compte admin)**

Le premier compte créé via `/api/auth/register` a le rôle `client` par défaut. Pour le rendre admin pendant vos tests, passez directement en base :
```sql
UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';
```
Puis connectez-vous pour récupérer un `accessToken`, et :
```bash
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -d '{"name":"Enceinte Bluetooth SoundMax","price":19990,"stock":25,"categoryId":1,"description":"Autonomie 20h, résistante aux éclaboussures."}'
```

## Tester le panier et les commandes avec curl

**Ajouter un produit au panier** (nécessite un `accessToken` client)
```bash
curl -X POST http://localhost:4000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -d '{"productId":1,"quantity":2}'
```

**Voir le panier avec totaux**
```bash
curl http://localhost:4000/api/cart \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

**Vérifier un code promo**
```bash
curl -X POST http://localhost:4000/api/promotions/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"UNIVERS10"}'
```

**Passer commande (checkout)**
```bash
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -d '{
    "paymentMethod": "Orange Money",
    "promoCode": "UNIVERS10",
    "shippingName": "Fatou Bamba",
    "shippingPhone": "+225 07 12 34 56 78",
    "shippingCity": "Abidjan",
    "shippingCommune": "Cocody",
    "shippingDetails": "Rue des Jardins, Villa 12"
  }'
```
Cette action vérifie le stock, applique la réduction, calcule la livraison, décrémente le stock, vide le panier et crée la commande — le tout dans une transaction : si une étape échoue, rien n'est appliqué.

**Historique de mes commandes**
```bash
curl http://localhost:4000/api/orders \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

**Changer le statut d'une commande (admin)**
```bash
curl -X PUT http://localhost:4000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN_ADMIN" \
  -d '{"status":"Expédiée"}'
```

## Tester les paiements avec curl

### Stripe (mode test)

1. Créez un compte Stripe (gratuit) et récupérez vos clés de test sur [dashboard.stripe.com](https://dashboard.stripe.com/test/apikeys).
2. Renseignez `STRIPE_SECRET_KEY` dans `.env`.
3. Pour tester les webhooks en local, utilisez [Stripe CLI](https://docs.stripe.com/stripe-cli) :
   ```bash
   stripe listen --forward-to localhost:4000/api/payments/stripe/webhook
   ```
   La commande affiche un `whsec_...` à copier dans `STRIPE_WEBHOOK_SECRET`.

```bash
curl -X POST http://localhost:4000/api/payments/stripe/create-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -d '{"orderId":1}'
```
Ouvrez l'`url` retournée dans un navigateur et payez avec une [carte de test Stripe](https://docs.stripe.com/testing#cards) (ex. `4242 4242 4242 4242`, toute date future, tout CVC).

### PayPal (sandbox)

1. Créez une app sur [developer.paypal.com](https://developer.paypal.com/dashboard/applications/sandbox) pour obtenir un `Client ID` et un `Secret` sandbox.
2. Renseignez `PAYPAL_CLIENT_ID` et `PAYPAL_CLIENT_SECRET` dans `.env`.

```bash
curl -X POST http://localhost:4000/api/payments/paypal/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -d '{"orderId":1}'
```
Ouvrez l'`approveUrl` retournée, connectez-vous avec un [compte acheteur sandbox](https://developer.paypal.com/dashboard/accounts), puis capturez :
```bash
curl -X POST http://localhost:4000/api/payments/paypal/capture/ID_RETOURNE_CI_DESSUS \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

### Mobile Money (simulation)

```bash
curl -X POST http://localhost:4000/api/payments/mobile-money/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -d '{"orderId":1,"provider":"orange_money"}'
```
Puis, pour simuler la confirmation (normalement envoyée par l'opérateur) :
```bash
curl -X POST http://localhost:4000/api/payments/mobile-money/1/confirm \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN_ADMIN"
```

## Passage en production : migrations, tests, déploiement

### Migrations versionnées (remplace `sequelize.sync()`)

En développement, le serveur continue d'utiliser `sync()` par confort. En production (`NODE_ENV=production`), il ne le fait plus : exécutez les migrations explicitement.

```bash
npm run migrate        # applique toutes les migrations en attente
npm run migrate:undo   # annule la dernière migration
```

Le dossier `migrations/` contient une migration par table, dans l'ordre des dépendances (users → refresh_tokens → categories → products → cart_items → promo_codes → orders → order_items → payments). Pour ajouter une colonne plus tard, créez une nouvelle migration plutôt que de modifier une migration existante déjà appliquée.

### Tests automatisés

```bash
npm test
```
Lance la suite Jest + Supertest sur une base SQLite en mémoire (aucune base à configurer). Trois fichiers de tests :
- `tests/auth.test.js` — inscription, connexion, rotation du refresh token, déconnexion
- `tests/products.test.js` — catégories/produits, droits admin vs client
- `tests/orders.test.js` — panier → commande → décrément de stock → changement de statut → réapprovisionnement à l'annulation

### Déploiement

**Docker (local ou VPS)**
```bash
cp .env.example .env   # renseignez au moins JWT_ACCESS_SECRET et JWT_REFRESH_SECRET
docker compose up -d
docker compose exec api npm run migrate
docker compose exec api npm run seed
```

**Railway / Render (recommandé pour une mise en ligne rapide)**
1. Connectez votre dépôt Git, ajoutez une base PostgreSQL (module intégré chez les deux plateformes).
2. Renseignez les variables d'environnement du `.env.example` dans les paramètres du projet.
3. Commande de démarrage : `npm start`. Commande de build/release (si proposée par la plateforme) : `npm run migrate`.

**VPS classique (PM2 + Nginx)**
```bash
npm install --production
npm run migrate
pm2 start ecosystem.config.js --env production
```
Placez Nginx devant en reverse proxy (port 4000 → 80/443 avec certificat TLS, par exemple via Certbot).

## Structure du projet

```
univers-plus-api/
├── src/
│   ├── config/                    # database.js (Sequelize), config.js (CLI), stripe.js (client Stripe)
│   ├── services/paypal.service.js # Intégration PayPal REST (sandbox)
│   ├── models/                   # User, RefreshToken, Category, Product, CartItem, Order, OrderItem, PromoCode, Payment
│   ├── controllers/               # auth, category, product, cart, order, promo, payment
│   ├── routes/                    # auth, category, product, cart, order, promo, payment
│   ├── middleware/                # requireAuth, requireRole, validation, erreurs
│   ├── utils/                     # JWT, hash SHA-256, slugify, conversion de durée, devises Stripe
│   ├── seed.js                    # Peuple la base : 15 catégories, 15 produits, 3 codes promo
│   ├── app.js                     # Express + middlewares globaux (webhook Stripe monté à part)
│   └── server.js                  # Démarrage : connexion DB puis écoute
├── migrations/                    # Schéma versionné (sequelize-cli)
├── tests/                         # Jest + Supertest (auth, produits, panier/commandes)
├── Dockerfile / docker-compose.yml / .dockerignore
├── Procfile                       # Heroku-style
├── ecosystem.config.js            # PM2 (VPS)
├── jest.config.js
├── .sequelizerc
├── .env.example
├── package.json
└── README.md
```

## Prochaines étapes suggérées

- Vraie intégration Mobile Money (Orange Money, MTN Money, Moov Money, Wave) une fois un compte marchand obtenu auprès de chaque opérateur
- Passer Stripe/PayPal en mode production (clés live, compte PayPal vérifié)
- Migrations Sequelize versionnées au lieu de `sync()`
- Tests automatisés (Jest + Supertest)
- Déploiement (Railway, Render, ou VPS avec PM2 + Nginx)
