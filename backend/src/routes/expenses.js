const { Router } = require('express')
const auth = require('../middleware/auth')
const { list, getById, create, remove, settle } = require('../controllers/expenseController')
const { createExpenseRules, settleDebtRules } = require('../validators/expenseValidator')

const router = Router()

router.use(auth)
router.get('/', list)
router.post('/', createExpenseRules, create)
router.post('/settle', settleDebtRules, settle)
router.get('/:id', getById)
router.delete('/:id', remove)

module.exports = router
