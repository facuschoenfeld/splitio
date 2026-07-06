const path = require('path')
const fs = require('fs')
const multer = require('multer')

// Carpeta donde se guardan los avatares subidos. Se sirve estática en /uploads
// (ver index.js). Se crea al arrancar para que diskStorage no falle.
const AVATARS_DIR = path.join(__dirname, '../../uploads/avatars')
fs.mkdirSync(AVATARS_DIR, { recursive: true })

const ALLOWED_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME[file.mimetype] || 'png'
    cb(null, `me-${req.user.id}-${Date.now()}.${ext}`)
  },
})

const upload = multer({
  storage,
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

module.exports = { avatarUpload, AVATARS_DIR }
