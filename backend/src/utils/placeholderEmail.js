// Los miembros agregados sin email reciben un email sintético en este dominio
// para satisfacer la columna `email` (unique, not null). Ese valor es interno y
// no debe exponerse en las respuestas de la API.
const PLACEHOLDER_DOMAIN = '@placeholder.local'

function isPlaceholderEmail(email) {
  return typeof email === 'string' && email.endsWith(PLACEHOLDER_DOMAIN)
}

function generatePlaceholderEmail() {
  return `invited-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${PLACEHOLDER_DOMAIN}`
}

// Devuelve una copia del objeto usuario con el email a null si es un placeholder.
function sanitizeUserEmail(user) {
  if (!user) return user
  if (isPlaceholderEmail(user.email)) {
    return { ...user, email: null }
  }
  return user
}

module.exports = { isPlaceholderEmail, generatePlaceholderEmail, sanitizeUserEmail }
