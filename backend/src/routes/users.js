const { Router } = require('express')
const auth = require('../middleware/auth')
const { avatarUpload } = require('../middleware/avatarUpload')
const {
  list,
  me,
  getById,
  updateMe,
  updateById,
  updateMyAvatar,
  deleteMyAvatar,
  getAvatar,
} = require('../controllers/userController')

const router = Router()

// Antes de router.use(auth): la imagen la pide un <img>, que no manda el token.
router.get('/:id/avatar', getAvatar)

router.use(auth)
router.get('/', list)
router.get('/me', me)
router.put('/me', updateMe)
router.post('/me/avatar', avatarUpload, updateMyAvatar)
router.delete('/me/avatar', deleteMyAvatar)
router.get('/:id', getById)
router.put('/:id', updateById)

module.exports = router
