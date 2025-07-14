// /server/shared/middleware/validation.js
// Middleware para validación de requests usando express-validator

const { validationResult } = require("express-validator");

/**
 * Middleware de validación que procesa los resultados de express-validator
 * y retorna errores estructurados si existen problemas de validación
 */
const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    return res.status(400).json({
      status: "error",
      message: "Errores de validación en la solicitud",
      code: "VALIDATION_ERROR",
      errors: errorDetails,
      total_errors: errorDetails.length,
    });
  }

  next();
};

module.exports = validationMiddleware;
