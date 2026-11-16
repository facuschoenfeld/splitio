const db = require('../config/db')
const { sanitizeUserEmail } = require('../utils/placeholderEmail')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SELECT_FIELDS = [
  'id',
  'name',
  'email',
  'avatar',
  'payment_alias',
  'cbu',
  'notify_group_invites',
  'notify_group_summaries',
  'created_at',
]

// Toma del body solo los campos editables del perfil. Se reusa en updateMe y
// updateById para no duplicar la lista de campos permitidos.
function pickProfileUpdates(body) {
  const updates = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.payment_alias !== undefined) updates.payment_alias = body.payment_alias
  if (body.cbu !== undefined) updates.cbu = body.cbu
  if (body.notify_group_invites !== undefined) {
    updates.notify_group_invites = Boolean(body.notify_group_invites)
  }
  if (body.notify_group_summaries !== undefined) {
    updates.notify_group_summaries = Boolean(body.notify_group_summaries)
  }
  return updates
}

async function list(req, res) {
  // Solo exponemos usuarios que comparten al menos un grupo con el solicitante.
  // Evita filtrar email/CBU/alias de todo el sistema a cualquier autenticado.
  const sharedUserIds = db('group_members')
    .whereIn(
      'group_id',
      db('group_members').where('user_id', req.user.id).select('group_id')
    )
    .select('user_id')

  const users = await db('users')
    .whereIn('id', sharedUserIds)
    .select(SELECT_FIELDS)
  res.json(users.map(sanitizeUserEmail))
}

async function me(req, res) {
  const user = await db('users').where({ id: req.user.id }).select(SELECT_FIELDS).first()
  if (!user) {
    return res.status(404).json({ error: { message: 'Usuario no encontrado' } })
  }
  res.json(user)
}

async function getById(req, res) {
  const user = await db('users').where({ id: req.params.id }).select(SELECT_FIELDS).first()
  if (!user) {
    return res.status(404).json({ error: { message: 'Usuario no encontrado' } })
  }
  res.json(sanitizeUserEmail(user))
}

async function updateMe(req, res) {
  const updates = pickProfileUpdates(req.body)
  if (Object.keys(updates).length > 0) {
    await db('users').where({ id: req.user.id }).update(updates)
  }
  const user = await db('users').where({ id: req.user.id }).select(SELECT_FIELDS).first()
  res.json(user)
}

async function updateById(req, res) {
  if (String(req.params.id) !== String(req.user.id)) {
    return res.status(403).json({ error: { message: 'Solo podés actualizar tu propio perfil' } })
  }
  const user = await db('users').where({ id: req.params.id }).first()
  if (!user) {
    return res.status(404).json({ error: { message: 'Usuario no encontrado' } })
  }

  const updates = pickProfileUpdates(req.body)
  if (Object.keys(updates).length > 0) {
    await db('users').where({ id: req.params.id }).update(updates)
  }
  const updated = await db('users').where({ id: req.params.id }).select(SELECT_FIELDS).first()
  res.json(updated)
}

// Los bytes del avatar viven en user_avatars (migración 014); users.avatar guarda
// la URL pública que consume el front. El ?v= cambia en cada subida para que el
// browser no muestre la imagen anterior cacheada.
async function updateMyAvatar(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: { message: 'No se recibió ninguna imagen' } })
  }
  const userId = req.user.id
  const avatar = `/api/users/${userId}/avatar?v=${Date.now()}`

  await db.transaction(async (trx) => {
    await trx('user_avatars')
      .insert({
        user_id: userId,
        data: req.file.buffer,
        mime_type: req.file.mimetype,
        updated_at: trx.fn.now(),
      })
      .onConflict('user_id')
      .merge()
    await trx('users').where({ id: userId }).update({ avatar })
  })

  const user = await db('users').where({ id: userId }).select(SELECT_FIELDS).first()
  res.json(user)
}

async function deleteMyAvatar(req, res) {
  await db.transaction(async (trx) => {
    await trx('user_avatars').where({ user_id: req.user.id }).del()
    await trx('users').where({ id: req.user.id }).update({ avatar: null })
  })
  const user = await db('users').where({ id: req.user.id }).select(SELECT_FIELDS).first()
  res.json(user)
}

// Público (sin auth): lo pide un <img>, que no puede mandar el Bearer token.
async function getAvatar(req, res) {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(404).json({ error: { message: 'Avatar no encontrado' } })
  }
  const row = await db('user_avatars')
    .where({ user_id: req.params.id })
    .select('data', 'mime_type')
    .first()
  if (!row) {
    return res.status(404).json({ error: { message: 'Avatar no encontrado' } })
  }
  res.set('Content-Type', row.mime_type)
  res.set('Cache-Control', 'public, max-age=86400')
  res.send(row.data)
}

module.exports = {
  list,
  me,
  getById,
  updateMe,
  updateById,
  updateMyAvatar,
  deleteMyAvatar,
  getAvatar,
}
