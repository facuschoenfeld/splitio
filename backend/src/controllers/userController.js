const path = require('path')
const fs = require('fs')
const db = require('../config/db')
const { sanitizeUserEmail } = require('../utils/placeholderEmail')
const { AVATARS_DIR } = require('../middleware/avatarUpload')

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

// Borra el archivo de avatar previo si era uno subido a /uploads (no toca
// avatares externos ni iniciales/null). Silencioso: si no existe, no falla.
function removeAvatarFile(avatar) {
  if (!avatar || !avatar.startsWith('/uploads/avatars/')) return
  const file = path.join(AVATARS_DIR, path.basename(avatar))
  fs.promises.unlink(file).catch(() => {})
}

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

async function updateMyAvatar(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: { message: 'No se recibió ninguna imagen' } })
  }
  const current = await db('users').where({ id: req.user.id }).select('avatar').first()
  removeAvatarFile(current?.avatar)

  const avatar = `/uploads/avatars/${req.file.filename}`
  await db('users').where({ id: req.user.id }).update({ avatar })
  const user = await db('users').where({ id: req.user.id }).select(SELECT_FIELDS).first()
  res.json(user)
}

async function deleteMyAvatar(req, res) {
  const current = await db('users').where({ id: req.user.id }).select('avatar').first()
  removeAvatarFile(current?.avatar)
  await db('users').where({ id: req.user.id }).update({ avatar: null })
  const user = await db('users').where({ id: req.user.id }).select(SELECT_FIELDS).first()
  res.json(user)
}

module.exports = { list, me, getById, updateMe, updateById, updateMyAvatar, deleteMyAvatar }
