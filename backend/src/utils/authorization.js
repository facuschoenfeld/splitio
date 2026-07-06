const db = require('../config/db')

// Devuelve true si el usuario pertenece al grupo indicado.
async function isGroupMember(userId, groupId) {
  const row = await db('group_members')
    .where({ group_id: groupId, user_id: userId })
    .first()
  return Boolean(row)
}

// Devuelve true si el usuario es el administrador (creador) del grupo.
async function isGroupAdmin(userId, groupId) {
  const group = await db('groups').where({ id: groupId }).first()
  return Boolean(group) && String(group.created_by) === String(userId)
}

module.exports = { isGroupMember, isGroupAdmin }
