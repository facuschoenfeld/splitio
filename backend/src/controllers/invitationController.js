const db = require('../config/db')
const { MAX_GROUP_MEMBERS, countGroupMembers } = require('../utils/invitations')

function isExpired(invitation) {
  return Boolean(invitation.expires_at) && new Date(invitation.expires_at) < new Date()
}

// GET /api/invitations/:token — público. Devuelve datos del grupo + estado del
// enlace para que el front muestre la pantalla de invitación antes de loguear.
async function preview(req, res) {
  const invitation = await db('group_invitations').where({ token: req.params.token }).first()
  if (!invitation) {
    return res.json({ status: 'invalid' })
  }

  const group = await db('groups').where({ id: invitation.group_id }).first()
  if (!group) {
    return res.json({ status: 'invalid' })
  }
  const inviter = invitation.invited_by
    ? await db('users').where({ id: invitation.invited_by }).select('name').first()
    : null

  const type = invitation.email ? 'email' : 'shared'
  let status = 'valid'
  if (isExpired(invitation)) status = 'expired'
  else if (invitation.email && invitation.accepted_at) status = 'accepted'
  else if ((await countGroupMembers(group.id)) >= MAX_GROUP_MEMBERS) status = 'full'

  res.json({
    status,
    type,
    email: invitation.email || null,
    inviterName: inviter?.name || null,
    group: { id: group.id, name: group.name, emoji: group.emoji },
  })
}

// POST /api/invitations/:token/accept — requiere sesión. Une al usuario al grupo.
async function accept(req, res) {
  const invitation = await db('group_invitations').where({ token: req.params.token }).first()
  if (!invitation) {
    return res.status(404).json({ error: { message: 'Invitación inválida' } })
  }
  if (isExpired(invitation)) {
    return res.status(410).json({ error: { message: 'La invitación expiró' } })
  }

  // Las invitaciones personales están atadas a un email y son de un solo uso.
  if (invitation.email) {
    const me = await db('users').where({ id: req.user.id }).select('email').first()
    if (me.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res
        .status(403)
        .json({ error: { message: 'Esta invitación es para otra dirección de email' } })
    }
  }

  const alreadyMember = await db('group_members')
    .where({ group_id: invitation.group_id, user_id: req.user.id })
    .first()

  if (alreadyMember) {
    // Idempotente: si ya es miembro, marcamos la personal como aceptada y listo.
    if (invitation.email && !invitation.accepted_at) {
      await db('group_invitations').where({ id: invitation.id }).update({ accepted_at: new Date() })
    }
    return res.json({ groupId: invitation.group_id })
  }

  if (invitation.email && invitation.accepted_at) {
    return res.status(410).json({ error: { message: 'La invitación ya fue utilizada' } })
  }

  try {
    await db.transaction(async (trx) => {
      if ((await countGroupMembers(invitation.group_id, trx)) >= MAX_GROUP_MEMBERS) {
        const err = new Error('Grupo lleno')
        err.status = 409
        throw err
      }
      await trx('group_members').insert({
        group_id: invitation.group_id,
        user_id: req.user.id,
      })
      if (invitation.email) {
        await trx('group_invitations').where({ id: invitation.id }).update({ accepted_at: new Date() })
      }
    })
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ error: { message: err.message } })
    }
    throw err
  }

  res.json({ groupId: invitation.group_id })
}

module.exports = { preview, accept }
