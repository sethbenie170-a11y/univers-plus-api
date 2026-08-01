require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données réussie.');

    if (process.env.NODE_ENV === 'production') {
      // En production, le schéma est géré par de vraies migrations versionnées :
      // exécutez `npm run migrate` avant de démarrer le serveur (voir README).
      console.log('Mode production : le schéma est géré par les migrations (npm run migrate).');
    } else {
      // Pratique en développement pour ne pas avoir à migrer à chaque changement de modèle.
      await sequelize.sync();
    }

    app.listen(PORT, () => {
      console.log(`API UNIVERS PLUS démarrée sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Impossible de démarrer le serveur :', err);
    process.exit(1);
  }
}

start();
