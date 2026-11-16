const multer = require('multer')

// La imagen queda en memoria (req.file.buffer) y el controller la guarda en la
// tabla user_avatars: no se escribe nada en disco, que en Render free es efímero.
const ALLOWED_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME[file.mimetype]) return cb(null, true)
    cb(new Error('Formato no permitido. Subí una imagen PNG, JPG o WEBP'))
  },
}).single('avatar')

// Envuelve el middleware de multer para traducir sus errores al formato
// { error: { message } } que usa el resto de la API (en vez de 500).
function avatarUpload(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'La imagen no puede superar los 2 MB' : err.message
      return res.status(400).json({ error: { message } })
    }
    if (err) {
      return res.status(400).json({ error: { message: err.message } })
    }
    next()
  })
}

module.exports = { avatarUpload }
