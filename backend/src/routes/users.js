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
} = require('../controllers/userController')

const router = Router()

router.use(auth)
router.get('/', list)
router.get('/me', me)
router.put('/me', updateMe)
router.post('/me/avatar', avatarUpload, updateMyAvatar)
router.delete('/me/avatar', deleteMyAvatar)
router.get('/:id', getById)
router.put('/:id', updateById)

module.exports = router
