// Gestionnaire d'erreurs centralisé : toute erreur transmise via next(err) atterrit ici.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? 'Une erreur interne est survenue.' : err.message,
  });
}

module.exports = errorHandler;
