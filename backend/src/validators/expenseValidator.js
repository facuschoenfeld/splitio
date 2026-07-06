const { body } = require('express-validator')

const VALID_CATEGORIES = ['vivienda', 'servicios', 'comida', 'transporte', 'entretenimiento', 'alojamiento', 'otros']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const createExpenseRules = [
  body('groupId').matches(UUID_RE).withMessage('ID de grupo inválido'),
  body('description').trim().notEmpty().withMessage('Descripción requerida'),
  body('amount').isFloat({ gt: 0 }).withMessage('Monto debe ser mayor a 0'),
  body('paidBy').matches(UUID_RE).withMessage('ID de pagador inválido'),
  body('splitBetween').isArray({ min: 1 }).withMessage('Debe dividirse entre al menos una persona'),
  body('splitBetween.*').matches(UUID_RE).withMessage('ID de participante inválido'),
  body('category').isIn(VALID_CATEGORIES).withMessage('Categoría inválida'),
  body('date').isISO8601().withMessage('Fecha inválida'),
]

const settleDebtRules = [
  body('groupId').matches(UUID_RE).withMessage('ID de grupo inválido'),
  body('fromUserId').matches(UUID_RE).withMessage('ID de deudor inválido'),
  body('toUserId').matches(UUID_RE).withMessage('ID de acreedor inválido'),
  body('amount').isFloat({ gt: 0 }).withMessage('Monto debe ser mayor a 0'),
]

module.exports = { createExpenseRules, settleDebtRules }
