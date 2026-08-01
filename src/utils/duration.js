// Convertit une durée simple type '15m', '7d', '2h' en millisecondes.
// Utilisé pour calculer la date d'expiration des refresh tokens stockés en base.
function msFromDuration(str) {
  const match = /^(\d+)([smhd])$/.exec(String(str).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000; // repli : 7 jours
  const n = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * multipliers[unit];
}

module.exports = { msFromDuration };
