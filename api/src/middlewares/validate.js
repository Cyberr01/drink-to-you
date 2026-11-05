const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const [firstError] = result.array();
  return res.status(400).json({ message: firstError.msg, field: firstError.path });
}

module.exports = { validate };
