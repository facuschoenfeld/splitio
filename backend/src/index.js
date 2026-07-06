require('dotenv').config()
const path = require('path')
const express = require('express')
const cors = require('cors')
const errorHandler = require('./middleware/errorHandler')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const groupRoutes = require('./routes/groups')
const expenseRoutes = require('./routes/expenses')
const invitationRoutes = require('./routes/invitations')

const app = express()

const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173'
app.use(cors({ origin: corsOrigin }))
app.use(express.json())

// Avatares subidos por los usuarios (ver middleware/avatarUpload.js).
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/invitations', invitationRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
