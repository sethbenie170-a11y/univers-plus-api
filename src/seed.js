// Peuple la base avec les 15 catégories et 15 produits de démonstration
// utilisés dans les prototypes front-end UNIVERS PLUS.
// Usage : node src/seed.js
require('dotenv').config();
const { sequelize, Category, Product, PromoCode } = require('./models');
const { slugify } = require('./utils/slugify');

const PROMO_CODES = [
  { code: 'UNIVERS10', discountPercent: 10, description: 'Réduction de bienvenue', active: true, expiresAt: null },
  { code: 'FLASH40', discountPercent: 40, description: 'Vente flash électronique', active: true, expiresAt: null },
  { code: 'RENTREE15', discountPercent: 15, description: 'Offre spéciale rentrée', active: false, expiresAt: null },
];

const CATEGORIES = [
  { name: 'Électronique', emoji: '🔌' },
  { name: 'Téléphones & accessoires', emoji: '📱' },
  { name: 'Informatique', emoji: '💻' },
  { name: 'Électroménager', emoji: '🧊' },
  { name: 'Mode Homme', emoji: '🧥' },
  { name: 'Mode Femme', emoji: '👗' },
  { name: 'Chaussures', emoji: '👟' },
  { name: 'Beauté', emoji: '💄' },
  { name: 'Santé', emoji: '🩺' },
  { name: 'Maison', emoji: '💡' },
  { name: 'Cuisine', emoji: '🍲' },
  { name: 'Sport', emoji: '🧘' },
  { name: 'Jouets', emoji: '🤖' },
  { name: 'Automobile', emoji: '🚗' },
  { name: 'Divers', emoji: '🎒' },
];

const PRODUCTS = [
  { name: 'Casque Sans Fil ProSound X2', cat: 'Électronique', brand: 'TechPro', price: 24990, oldPrice: 34990, stock: 14, rating: 4.6, reviewsCount: 212, imageEmoji: '🎧', description: "Réduction de bruit active, 30h d'autonomie, son haute-fidélité." },
  { name: 'Smartphone Nova 12', cat: 'Téléphones & accessoires', brand: 'TechPro', price: 149990, oldPrice: 179990, stock: 8, rating: 4.4, reviewsCount: 341, imageEmoji: '📱', description: 'Écran AMOLED 6.5", triple caméra 108MP, charge rapide.' },
  { name: 'Ordinateur Portable UltraBook 14', cat: 'Informatique', brand: 'TechPro', price: 389990, oldPrice: 449990, stock: 5, rating: 4.7, reviewsCount: 156, imageEmoji: '💻', description: 'Processeur rapide, 16Go RAM, châssis aluminium ultra-léger.' },
  { name: 'Réfrigérateur FreshTech 350L', cat: 'Électroménager', brand: 'HomeLine', price: 279990, oldPrice: 319990, stock: 3, rating: 4.3, reviewsCount: 89, imageEmoji: '🧊', description: 'Double battant, faible consommation, grand volume de stockage.' },
  { name: 'Veste Homme Urban Fit', cat: 'Mode Homme', brand: 'StyleCo', price: 19990, oldPrice: 27990, stock: 22, rating: 4.2, reviewsCount: 64, imageEmoji: '🧥', description: "Coupe moderne, tissu résistant à l'eau, doublure confort." },
  { name: 'Robe Élégance Femme', cat: 'Mode Femme', brand: 'StyleCo', price: 22990, oldPrice: 29990, stock: 17, rating: 4.5, reviewsCount: 118, imageEmoji: '👗', description: 'Tissu fluide, coupe cintrée, idéale pour toutes les occasions.' },
  { name: 'Baskets RunLight Pro', cat: 'Chaussures', brand: 'SportX', price: 27990, oldPrice: 36990, stock: 31, rating: 4.6, reviewsCount: 203, imageEmoji: '👟', description: 'Semelle amortissante, respirante, conçue pour la course urbaine.' },
  { name: 'Coffret Beauté GlowUp', cat: 'Beauté', brand: 'GlowUp', price: 14990, oldPrice: 19990, stock: 40, rating: 4.4, reviewsCount: 145, imageEmoji: '💄', description: 'Soin visage complet : nettoyant, sérum et crème hydratante.' },
  { name: 'Tensiomètre Digital SantéPlus', cat: 'Santé', brand: 'HomeLine', price: 16990, oldPrice: null, stock: 19, rating: 4.5, reviewsCount: 52, imageEmoji: '🩺', description: 'Mesure précise, écran large, mémoire multi-utilisateurs.' },
  { name: 'Lampe Design Nordique', cat: 'Maison', brand: 'HomeLine', price: 11990, oldPrice: 15990, stock: 26, rating: 4.3, reviewsCount: 77, imageEmoji: '💡', description: 'Éclairage chaud réglable, design minimaliste en bois clair.' },
  { name: 'Robot Cuiseur MultiChef', cat: 'Cuisine', brand: 'HomeLine', price: 59990, oldPrice: 79990, stock: 9, rating: 4.6, reviewsCount: 134, imageEmoji: '🍲', description: '12 programmes automatiques, cuve anti-adhésive, minuterie.' },
  { name: 'Tapis de Yoga ProGrip', cat: 'Sport', brand: 'SportX', price: 8990, oldPrice: 12990, stock: 50, rating: 4.4, reviewsCount: 98, imageEmoji: '🧘', description: 'Antidérapant, épais et confortable, sac de transport inclus.' },
  { name: 'Robot Jouet EduBot', cat: 'Jouets', brand: 'TechPro', price: 17990, oldPrice: 22990, stock: 0, rating: 4.1, reviewsCount: 41, imageEmoji: '🤖', description: 'Robot éducatif programmable, idéal dès 6 ans.' },
  { name: 'Kit Entretien Auto Complet', cat: 'Automobile', brand: 'AutoMax', price: 13990, oldPrice: null, stock: 28, rating: 4.2, reviewsCount: 36, imageEmoji: '🚗', description: 'Nettoyant carrosserie, chiffons microfibre, brillant pneus.' },
  { name: 'Sac à Dos Voyage 40L', cat: 'Divers', brand: 'StyleCo', price: 15990, oldPrice: 21990, stock: 33, rating: 4.5, reviewsCount: 109, imageEmoji: '🎒', description: "Résistant à l'eau, compartiment laptop, format cabine." },
];

async function seed() {
  await sequelize.sync();

  const categoryMap = {};
  for (const c of CATEGORIES) {
    const slug = slugify(c.name);
    const [category] = await Category.findOrCreate({
      where: { slug },
      defaults: { name: c.name, slug, emoji: c.emoji },
    });
    categoryMap[c.name] = category.id;
  }
  console.log(`${CATEGORIES.length} catégories prêtes.`);

  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    await Product.findOrCreate({
      where: { slug },
      defaults: {
        name: p.name,
        slug,
        description: p.description,
        brand: p.brand,
        price: p.price,
        oldPrice: p.oldPrice,
        stock: p.stock,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        imageEmoji: p.imageEmoji,
        categoryId: categoryMap[p.cat],
        isActive: true,
      },
    });
  }
  console.log(`${PRODUCTS.length} produits prêts.`);

  for (const p of PROMO_CODES) {
    await PromoCode.findOrCreate({
      where: { code: p.code },
      defaults: p,
    });
  }
  console.log(`${PROMO_CODES.length} codes promo prêts.`);

  await sequelize.close();
  console.log('Seed terminé.');
}

seed().catch((err) => {
  console.error('Erreur pendant le seed :', err);
  process.exit(1);
});
