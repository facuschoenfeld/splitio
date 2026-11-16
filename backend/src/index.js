require('dotenv').config()
const express = require('express')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const db = require('./config/db')
const errorHandler = require('./middleware/errorHandler')
const openapiSpec = require('./docs/openapi')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const groupRoutes = require('./routes/groups')
const expenseRoutes = require('./routes/expenses')
const invitationRoutes = require('./routes/invitations')

const app = express()

// Detrás del proxy de Render (u otro), req.ip sería la IP del proxy y todos los
// clientes compartirían el límite de express-rate-limit. TRUST_PROXY es la
// cantidad de saltos de proxy en los que se confía (0 = ninguno, ej: en local).
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1))

// CORS_ORIGIN admite varios orígenes separados por coma
// (ej: https://splitio.onrender.com,https://app.midominio.com).
// El navegador manda el Origin sin barra final y la comparación es exacta, así que
// se normaliza lo que se carga a mano en el dashboard: espacios, comillas, barra final.
const normalizeOrigin = (origin) =>
  origin.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '').toLowerCase()

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean)
console.log(`CORS: orígenes permitidos: ${allowedOrigins.join(', ')}`)

app.use(
  cors({
    origin(origin, callback) {
      // Sin Origin: pedidos que no vienen de un navegador (curl, health check de Render).
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true)
      }
      console.warn(`CORS: origen rechazado: ${origin}`)
      callback(null, false)
    },
  })
)
app.use(express.json())

// Health check (lo usa Render para saber si el deploy quedó sano). Toca la base
// para detectar también una DB caída o mal configurada.
app.get('/api/health', async (req, res) => {
  try {
    await db.raw('select 1')
    res.json({ status: 'ok' })
  } catch (err) {
    console.error('Health check: la base no responde:', err.message)
    res.status(503).json({ status: 'error', error: { message: 'Base de datos no disponible' } })
  }
})

// Documentación interactiva de la API (Swagger UI) y el spec OpenAPI crudo.
app.get('/api/docs.json', (req, res) => res.json(openapiSpec))
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customSiteTitle: 'Split Expenses API',
}))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/invitations', invitationRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
