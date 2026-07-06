const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { validationResult } = require('express-validator')
const db = require('../config/db')
const { sendPasswordReset } = require('../services/emailService')

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
// Cuánto vale un token de reset antes de expirar.
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hora

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function generateTokens(user) {
  const access = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  const refresh = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
  return { access, refresh }
}

async function register(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, email, password } = req.body
  const existing = await db('users').where({ email }).first()

  if (existing && existing.status === 'invited') {
    const hash = await bcrypt.hash(password, 10)
    await db('users').where({ id: existing.id }).update({ name, password: hash, status: 'active' })
    const user = { id: existing.id, name, email, avatar: existing.avatar, created_at: existing.created_at }
    const tokens = generateTokens(user)
    return res.status(200).json({ user, ...tokens })
  }

  if (existing) {
    return res.status(409).json({ error: { message: 'El email ya está registrado' } })
  }

  const hash = await bcrypt.hash(password, 10)
  const [user] = await db('users')
    .insert({ name, email, password: hash })
    .returning(['id', 'name', 'email', 'avatar', 'created_at'])

  const tokens = generateTokens(user)
  res.status(201).json({ user, ...tokens })
}

async function login(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password } = req.body
  const user = await db('users')
    .where({ email })
    .select('id', 'name', 'email', 'avatar', 'password', 'created_at')
    .first()
  // Sin usuario, o usuarios invitados (password: null) → 401, no crash en bcrypt.
  if (!user || !user.password) {
    return res.status(401).json({ error: { message: 'Credenciales inválidas' } })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return res.status(401).json({ error: { message: 'Credenciales inválidas' } })
  }

  const tokens = generateTokens(user)
  const { password: _, ...userWithoutPassword } = user
  res.json({ user: userWithoutPassword, ...tokens })
}

async function refresh(req, res) {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(400).json({ error: { message: 'Refresh token requerido' } })
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await db('users').where({ id: payload.id }).first()
    if (!user) {
      return res.status(401).json({ error: { message: 'Usuario no encontrado' } })
    }

    const tokens = generateTokens(user)
    res.json(tokens)
  } catch {
    return res.status(401).json({ error: { message: 'Refresh token inválido o expirado' } })
  }
}

async function forgotPassword(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email } = req.body
  // Respuesta genérica siempre, para no filtrar qué emails están registrados.
  const genericResponse = {
    message: 'Si el email está registrado, te enviamos un enlace para restablecer la contraseña',
  }

  const user = await db('users')
    .where({ email })
    .select('id', 'name', 'email', 'password', 'status')
    .first()

  // Solo enviamos el email a cuentas activas (los invitados no tienen contraseña aún).
  if (!user || !user.password || user.status === 'invited') {
    return res.json(genericResponse)
  }

  const token = crypto.randomBytes(32).toString('hex')
  await db('users').where({ id: user.id }).update({
    reset_token_hash: hashToken(token),
    reset_token_expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  })

  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`
  try {
    await sendPasswordReset({ to: user.email, name: user.name, resetUrl })
  } catch (err) {
    console.error('Error enviando email de reset:', err)
    // No revelamos el fallo al cliente; la respuesta sigue siendo genérica.
  }

  res.json(genericResponse)
}

async function resetPassword(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { token, password } = req.body
  const user = await db('users')
    .where({ reset_token_hash: hashToken(token) })
    .where('reset_token_expires', '>', new Date())
    .first()

  if (!user) {
    return res.status(400).json({ error: { message: 'El enlace es inválido o expiró' } })
  }

  const hash = await bcrypt.hash(password, 10)
  await db('users').where({ id: user.id }).update({
    password: hash,
    status: 'active',
    reset_token_hash: null,
    reset_token_expires: null,
  })

  res.json({ message: 'Contraseña actualizada, ya podés iniciar sesión' })
}

module.exports = { register, login, refresh, forgotPassword, resetPassword }
