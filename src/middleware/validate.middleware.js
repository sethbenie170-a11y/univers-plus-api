const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Certains champs sont invalides.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return next();
}

module.exports = validate;
