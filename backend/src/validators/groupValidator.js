const { body } = require('express-validator')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const createGroupRules = [
  body('name').trim().notEmpty().withMessage('Nombre del grupo requerido'),
  body('description').optional().trim(),
  body('emoji').optional().trim(),
  body('memberIds').isArray().withMessage('memberIds debe ser un array'),
  body('memberIds.*').matches(UUID_RE).withMessage('ID de miembro inválido'),
  body('newMembers').optional().isArray({ max: 10 }).withMessage('Máximo 10 miembros nuevos'),
  body('newMembers.*.name').trim().notEmpty().withMessage('Nombre del miembro requerido')
    .isLength({ max: 100 }).withMessage('Nombre demasiado largo'),
  body('newMembers.*.email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Email inválido'),
  body('inviteEmails').optional().isArray({ max: 10 }).withMessage('Máximo 10 invitaciones'),
  body('inviteEmails.*').trim().isEmail().withMessage('Email de invitación inválido'),
  body().custom((value) => {
    const totalNew = (value.newMembers?.length || 0) + (value.inviteEmails?.length || 0)
    if (totalNew > 10) throw new Error('Máximo 10 miembros nuevos e invitaciones en total')
    const totalMembers = (value.memberIds?.length || 0) + totalNew
    if (totalMembers < 1) throw new Error('Debe incluir al menos un miembro además del creador')
    return true
  }),
]

const inviteEmailRules = [
  body('email').trim().notEmpty().withMessage('Email requerido').isEmail().withMessage('Email inválido'),
]

module.exports = { createGroupRules, inviteEmailRules }
