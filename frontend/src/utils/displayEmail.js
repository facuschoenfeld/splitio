// Los miembros agregados sin email reciben un email sintético
// `invited-...@placeholder.local` en el backend para satisfacer la columna
// `email` (unique, not null). Ese valor no debe mostrarse al usuario.
const PLACEHOLDER_DOMAIN = '@placeholder.local'

export function isPlaceholderEmail(email) {
  return typeof email === 'string' && email.endsWith(PLACEHOLDER_DOMAIN)
}

// Devuelve el email a mostrar, o '' si es un placeholder / no hay email.
export function displayEmail(email) {
  return isPlaceholderEmail(email) ? '' : (email || '')
}
