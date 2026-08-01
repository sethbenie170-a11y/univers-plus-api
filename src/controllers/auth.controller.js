const bcrypt = require('bcrypt');
const { User, RefreshToken } = require('../models');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sha256 } = require('../utils/hash');
const { msFromDuration } = require('../utils/duration');

const SALT_ROUNDS = 12;

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const expiresAt = new Date(Date.now() + msFromDuration(process.env.JWT_REFRESH_EXPIRES || '7d'));
  await RefreshToken.create({
    userId: user.id,
    tokenHash: sha256(refreshToken),
    expiresAt,
  });
  return { accessToken, refreshToken };
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cet e-mail.' });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      passwordHash,
      role: 'client',
    });
    const { accessToken, refreshToken } = await issueTokens(user);
    return res.status(201).json({
      message: 'Compte créé avec succès.',
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    // Message volontairement identique dans les deux cas d'échec, pour ne pas révéler
    // si un e-mail est enregistré ou non (bonne pratique de sécurité).
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'E-mail ou mot de passe incorrect.' });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'E-mail ou mot de passe incorrect.' });
    }
    const { accessToken, refreshToken } = await issueTokens(user);
    return res.json({
      message: 'Connexion réussie.',
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Jeton de rafraîchissement requis.' });
    }
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: 'Jeton de rafraîchissement invalide ou expiré.' });
    }
    const tokenHash = sha256(refreshToken);
    const stored = await RefreshToken.findOne({ where: { userId: payload.sub, tokenHash } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Jeton de rafraîchissement invalide ou expiré.' });
    }
    const user = await User.findByPk(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Compte introuvable ou désactivé.' });
    }

    // Rotation du refresh token : on invalide l'ancien et on en émet un nouveau,
    // ce qui limite les dégâts en cas de vol d'un jeton.
    await stored.destroy();
    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);
    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = sha256(refreshToken);
      await RefreshToken.destroy({ where: { tokenHash } });
    }
    return res.json({ message: 'Déconnexion réussie.' });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, refresh, logout, me };
