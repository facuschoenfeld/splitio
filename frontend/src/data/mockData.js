export const CURRENT_USER = {
  id: 'user-1',
  name: 'Facundo',
  email: 'facundo@email.com',
  avatar: null,
}

export const MEMBERS = [
  CURRENT_USER,
]

export const GROUPS = []

export const EXPENSES = []

export const CATEGORIES = {
  vivienda: { label: 'Vivienda', color: 'bg-blue-100 text-blue-700', hex: '#3b82f6' },
  servicios: { label: 'Servicios', color: 'bg-purple-100 text-purple-700', hex: '#a855f7' },
  comida: { label: 'Comida', color: 'bg-orange-100 text-orange-700', hex: '#f97316' },
  transporte: { label: 'Transporte', color: 'bg-green-100 text-green-700', hex: '#22c55e' },
  entretenimiento: { label: 'Entretenimiento', color: 'bg-pink-100 text-pink-700', hex: '#ec4899' },
  alojamiento: { label: 'Alojamiento', color: 'bg-teal-100 text-teal-700', hex: '#14b8a6' },
  otros: { label: 'Otros', color: 'bg-gray-100 text-gray-700', hex: '#6b7280' },
}
