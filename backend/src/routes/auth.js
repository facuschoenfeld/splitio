const { Router } = require('express')
const rateLimit = require('express-rate-limit')
const { register, login, refresh, forgotPassword, resetPassword } = require('../controllers/authController')
const { registerRules, loginRules, forgotPasswordRules, resetPasswordRules } = require('../validators/authValidator')

const router = Router()

// Limita intentos de login/registro para frenar ataques de fuerza bruta.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Demasiados intentos, probá de nuevo más tarde' } },
})

router.post('/register', authLimiter, registerRules, register)
router.post('/login', authLimiter, loginRules, login)
router.post('/refresh', refresh)
router.post('/forgot-password', authLimiter, forgotPasswordRules, forgotPassword)
router.post('/reset-password', authLimiter, resetPasswordRules, resetPassword)

module.exports = router
