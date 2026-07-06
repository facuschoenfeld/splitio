const BASE_URL = '/api'

let accessToken = localStorage.getItem('accessToken')
let refreshToken = localStorage.getItem('refreshToken')

export function setTokens(access, refresh) {
  accessToken = access
  refreshToken = refresh
  localStorage.setItem('accessToken', access)
  localStorage.setItem('refreshToken', refresh)
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export function getAccessToken() {
  return accessToken
}

async function refreshAccessToken() {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) {
    clearTokens()
    window.location.href = '/login'
    throw new Error('Sesión expirada')
  }
  const data = await res.json()
  setTokens(data.access, data.refresh)
  return data.access
}

export async function api(path, options = {}) {
  const { body, method = 'GET', auth = true } = options

  // Para FormData dejamos que el browser ponga el Content-Type con su boundary y
  // no serializamos; para el resto, JSON como siempre.
  const isFormData = body instanceof FormData
  const headers = {}
  if (!isFormData) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  const payload = isFormData ? body : body ? JSON.stringify(body) : undefined

  let res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: payload,
  })

  if (res.status === 401 && auth && refreshToken) {
    const newToken = await refreshAccessToken()
    headers['Authorization'] = `Bearer ${newToken}`
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: payload,
    })
  }

  if (res.status === 204) return null

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message || data.errors?.[0]?.msg || 'Error del servidor')
  }
  return data
}

// Descarga un archivo binario (ej: el PDF del resumen). A diferencia de api(),
// lee la respuesta como Blob y dispara la descarga en el browser. Reutiliza el
// token y el refresh transparente ante un 401.
export async function downloadFile(path, fallbackName = 'archivo') {
  const headers = {}
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  let res = await fetch(`${BASE_URL}${path}`, { headers })

  if (res.status === 401 && refreshToken) {
    const newToken = await refreshAccessToken()
    headers['Authorization'] = `Bearer ${newToken}`
    res = await fetch(`${BASE_URL}${path}`, { headers })
  }

  if (!res.ok) {
    let message = 'Error del servidor'
    try {
      const data = await res.json()
      message = data.error?.message || data.errors?.[0]?.msg || message
    } catch {
      // la respuesta de error no era JSON; usamos el mensaje por defecto
    }
    throw new Error(message)
  }

  // Preferimos el filename que manda el backend en Content-Disposition.
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match ? match[1] : fallbackName

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
