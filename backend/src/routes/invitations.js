const { Router } = require('express')
const auth = require('../middleware/auth')
const { preview, accept } = require('../controllers/invitationController')

const router = Router()

// El preview es público (se ve antes de loguearse); aceptar requiere sesión.
router.get('/:token', preview)
router.post('/:token/accept', auth, accept)

module.exports = router
