const db = require('../config/db')
const { sanitizeUserEmail } = require('./placeholderEmail')

// Única vía para leer los miembros de un grupo: trae los datos del usuario con
// el email ya saneado (los placeholders @placeholder.local salen como null), así
// ningún endpoint puede filtrar el email interno por olvidarse de sanitizar.
// - withOverrides: incluye los overrides por-grupo (nickname/payment_alias/cbu).
// - trx: conexión/transacción alternativa (por defecto, la global).
async function fetchGroupMembers(groupId, { withOverrides = false, trx = db } = {}) {
  const columns = ['users.id', 'users.name', 'users.email', 'users.avatar']
  if (withOverrides) {
    columns.push(
      'group_members.nickname',
      'group_members.payment_alias',
      'group_members.cbu'
    )
  }

  const members = await trx('group_members')
    .where({ group_id: groupId })
    .join('users', 'users.id', 'group_members.user_id')
    .select(columns)

  return members.map(sanitizeUserEmail)
}

module.exports = { fetchGroupMembers }
