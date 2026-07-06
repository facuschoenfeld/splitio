const { body } = require('express-validator')

const registerRules = [
  body('name').trim().notEmpty().withMessage('Nombre requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
]

const loginRules = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
]

const forgotPasswordRules = [
  body('email').isEmail().withMessage('Email inválido'),
]

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Token requerido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
]

module.exports = { registerRules, loginRules, forgotPasswordRules, resetPasswordRules }
