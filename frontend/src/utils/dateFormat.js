const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const relativeFormatter = new Intl.RelativeTimeFormat('es', {
  numeric: 'auto',
})

export function formatDate(dateString) {
  return dateFormatter.format(new Date(dateString))
}

export function formatRelativeDate(dateString) {
  // Los strings solo-fecha ('2026-06-10') se interpretan como UTC; les fijamos
  // medianoche local. Los ISO completos ('2026-06-10T15:30:00.000Z') ya traen hora.
  const hasTime = typeof dateString === 'string' && dateString.includes('T')
  const date = new Date(hasTime ? dateString : dateString + 'T00:00:00')
  // Se comparan días calendario (medianoche local de cada uno): con la hora incluida,
  // un evento de hoy a la tarde redondeaba a +1 día y se mostraba como "mañana".
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((day - today) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'hoy'
  if (Math.abs(diffDays) < 7) return relativeFormatter.format(diffDays, 'day')
  if (Math.abs(diffDays) < 30) return relativeFormatter.format(Math.round(diffDays / 7), 'week')
  return formatDate(dateString)
}
