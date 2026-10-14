import { validationResult } from 'express-validator';

/**
 * Runs after express-validator chains.
 * Returns 422 with all validation errors if any exist.
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}
