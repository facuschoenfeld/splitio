import { useState } from 'react'

const colorMap = [
  'bg-primary-100 text-primary-700 dark:bg-primary-800/50 dark:text-primary-200',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
]

function getColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colorMap[Math.abs(hash) % colorMap.length]
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

export default function Avatar({ name, src, size = 'md', className = '' }) {
  // name puede llegar undefined si el usuario aún no cargó (ej: Header).
  const safeName = name || '?'
  // Si la imagen falla al cargar (archivo borrado, etc.) caemos a las iniciales.
  const [imgFailed, setImgFailed] = useState(false)

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={safeName}
        onError={() => setImgFailed(true)}
        className={`rounded-full object-cover shrink-0 ${sizes[size]} ${className}`}
      />
    )
  }

  const initials = safeName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 ${getColor(safeName)} ${sizes[size]} ${className}`}
    >
      {initials}
    </div>
  )
}
