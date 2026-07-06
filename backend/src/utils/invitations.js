const crypto = require('crypto')
const db = require('../config/db')

// Tope duro de miembros por grupo, incluyendo al creador.
const MAX_GROUP_MEMBERS = 10
// Cuánto vale un enlace de invitación personal antes de expirar.
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 días

// Genera un token URL-safe. bytes 16 ⇒ ~22 chars (invitación personal),
// bytes 6 ⇒ ~8 chars (código compartible, más fácil de tipear).
function generateToken(bytes = 16) {
  return crypto.randomBytes(bytes).toString('base64url')
}

// Cantidad actual de miembros del grupo. Acepta una conexión/transacción.
async function countGroupMembers(groupId, conn = db) {
  const row = await conn('group_members').where({ group_id: groupId }).count('* as c').first()
  return Number(row.c)
}

module.exports = { MAX_GROUP_MEMBERS, INVITE_TTL_MS, generateToken, countGroupMembers }
