const { validationResult } = require('express-validator')
const db = require('../config/db')
const { sendBatchGroupInvites, sendGroupSummary } = require('../services/emailService')
const { generateGroupSummaryPDF } = require('../services/pdfService')
const { isGroupMember, isGroupAdmin } = require('../utils/authorization')
const { generatePlaceholderEmail } = require('../utils/placeholderEmail')
const { fetchGroupMembers } = require('../utils/groupMembers')
const { MAX_GROUP_MEMBERS, INVITE_TTL_MS, generateToken, countGroupMembers } = require('../utils/invitations')

const FORBIDDEN = { error: { message: 'No tenés acceso a este grupo' } }
const ADMIN_ONLY = { error: { message: 'Solo el administrador del grupo puede realizar esta acción' } }
const GROUP_FULL = { error: { message: 'Grupo lleno' } }

async function list(req, res) {
  const groups = await db('groups')
    .join('group_members', 'groups.id', 'group_members.group_id')
    .where('group_members.user_id', req.user.id)
    .select('groups.*')

  const groupIds = groups.map((g) => g.id)
  const members = await db('group_members')
    .whereIn('group_id', groupIds)
    .select('group_id', 'user_id', 'nickname', 'payment_alias', 'cbu')

  const membersByGroup = {}
  const overridesByGroup = {}
  members.forEach((m) => {
    if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = []
    membersByGroup[m.group_id].push(m.user_id)

    if (m.nickname || m.payment_alias || m.cbu) {
      if (!overridesByGroup[m.group_id]) overridesByGroup[m.group_id] = {}
      overridesByGroup[m.group_id][m.user_id] = {
        nickname: m.nickname,
        payment_alias: m.payment_alias,
        cbu: m.cbu,
      }
    }
  })

  const result = groups.map((g) => ({
    ...g,
    members: membersByGroup[g.id] || [],
    memberOverrides: overridesByGroup[g.id] || {},
  }))

  res.json(result)
}

async function getById(req, res) {
  const group = await db('groups').where({ id: req.params.id }).first()
  if (!group) {
    return res.status(404).json({ error: { message: 'Grupo no encontrado' } })
  }
  if (!(await isGroupMember(req.user.id, req.params.id))) {
    return res.status(403).json(FORBIDDEN)
  }

  const members = await fetchGroupMembers(group.id, { withOverrides: true })

  res.json({ ...group, members })
}

async function create(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, description, emoji, memberIds, newMembers = [], inviteEmails = [] } = req.body

  // Invitaciones por email a enviar tras commitear: [{ email, token }].
  const invitesToSend = []

  const result = await db.transaction(async (trx) => {
    const createdUserIds = []

    // newMembers: miembros manuales/offline (placeholders), se pre-agregan al grupo.
    for (const member of newMembers) {
      if (member.email) {
        const existing = await trx('users').where({ email: member.email }).first()
        if (existing) {
          createdUserIds.push(existing.id)
          continue
        }
      }
      const userData = { name: member.name, status: 'invited', password: null }
      userData.email = member.email || generatePlaceholderEmail()
      if (member.payment_alias) {
        userData.payment_alias = member.payment_alias
      }
      const [user] = await trx('users').insert(userData).returning('id')
      createdUserIds.push(user.id)
    }

    const allMemberIds = [...new Set([req.user.id, ...memberIds, ...createdUserIds])]
    if (allMemberIds.length > MAX_GROUP_MEMBERS) {
      const err = new Error(`Un grupo puede tener hasta ${MAX_GROUP_MEMBERS} miembros (incluyéndote)`)
      err.status = 400
      throw err
    }

    const [group] = await trx('groups')
      .insert({ name, description, emoji, created_by: req.user.id })
      .returning('*')

    await trx('group_members').insert(
      allMemberIds.map((userId) => ({ group_id: group.id, user_id: userId }))
    )

    // inviteEmails: invitaciones personales pendientes (membresía al aceptar).
    const memberEmails = new Set(
      (await trx('users').whereIn('id', allMemberIds).pluck('email')).filter(Boolean)
    )
    for (const email of inviteEmails) {
      if (memberEmails.has(email)) continue // ya es miembro, no tiene sentido invitarlo
      const token = generateToken(16)
      await trx('group_invitations').insert({
        group_id: group.id,
        email,
        token,
        invited_by: req.user.id,
        expires_at: new Date(Date.now() + INVITE_TTL_MS),
      })
      invitesToSend.push({ email, token })
    }

    return { ...group, members: allMemberIds }
  })

  res.status(201).json(result)

  if (invitesToSend.length > 0) {
    sendInvitesRespectingPrefs({
      invites: invitesToSend,
      inviterId: req.user.id,
      groupName: name,
      groupEmoji: emoji,
    }).catch((err) => console.error('Failed to send group invites:', err))
  }
}

// Envía las invitaciones excluyendo a los usuarios que desactivaron el email de
// invitaciones. Los emails que aún no tienen cuenta no tienen preferencia, así
// que se les envía igual.
async function sendInvitesRespectingPrefs({ invites, inviterId, groupName, groupEmoji }) {
  const optedOut = new Set(
    await db('users')
      .whereIn('email', invites.map((i) => i.email))
      .andWhere('notify_group_invites', false)
      .pluck('email')
  )
  const recipients = invites.filter((i) => !optedOut.has(i.email))
  if (recipients.length === 0) return

  const inviter = await db('users').where({ id: inviterId }).select('name').first()
  await sendBatchGroupInvites({
    invites: recipients,
    inviterName: inviter.name,
    groupName,
    groupEmoji,
  })
}

async function update(req, res) {
  const group = await db('groups').where({ id: req.params.id }).first()
  if (!group) {
    return res.status(404).json({ error: { message: 'Grupo no encontrado' } })
  }
  if (!(await isGroupAdmin(req.user.id, req.params.id))) {
    return res.status(403).json(ADMIN_ONLY)
  }

  const { name, description, emoji } = req.body
  const updates = {}
  if (name !== undefined) updates.name = name
  if (description !== undefined) updates.description = description
  if (emoji !== undefined) updates.emoji = emoji

  const [updated] = await db('groups')
    .where({ id: req.params.id })
    .update(updates)
    .returning('*')

  const members = await db('group_members')
    .where({ group_id: updated.id })
    .select('user_id')

  res.json({ ...updated, members: members.map((m) => m.user_id) })
}

async function remove(req, res) {
  const group = await db('groups').where({ id: req.params.id }).first()
  if (!group) {
    return res.status(404).json({ error: { message: 'Grupo no encontrado' } })
  }
  if (group.created_by !== req.user.id) {
    return res.status(403).json({ error: { message: 'Solo el creador puede eliminar el grupo' } })
  }

  await db('groups').where({ id: req.params.id }).del()
  res.status(204).end()
}

async function listMembers(req, res) {
  if (!(await isGroupMember(req.user.id, req.params.id))) {
    return res.status(403).json(FORBIDDEN)
  }
  const members = await fetchGroupMembers(req.params.id)

  res.json(members)
}

async function addMember(req, res) {
  if (!(await isGroupMember(req.user.id, req.params.id))) {
    return res.status(403).json(FORBIDDEN)
  }
  const { userId } = req.body
  if (!userId) {
    return res.status(400).json({ error: { message: 'userId requerido' } })
  }

  const userExists = await db('users').where({ id: userId }).first()
  if (!userExists) {
    return res.status(404).json({ error: { message: 'Usuario no encontrado' } })
  }

  const exists = await db('group_members')
    .where({ group_id: req.params.id, user_id: userId })
    .first()

  if (exists) {
    return res.status(409).json({ error: { message: 'El usuario ya es miembro del grupo' } })
  }

  if ((await countGroupMembers(req.params.id)) >= MAX_GROUP_MEMBERS) {
    return res.status(409).json(GROUP_FULL)
  }

  await db('group_members').insert({ group_id: req.params.id, user_id: userId })
  res.status(201).json({ message: 'Miembro agregado' })
}

async function removeMember(req, res) {
  if (!(await isGroupMember(req.user.id, req.params.id))) {
    return res.status(403).json(FORBIDDEN)
  }
  const deleted = await db('group_members')
    .where({ group_id: req.params.id, user_id: req.params.userId })
    .del()

  if (!deleted) {
    return res.status(404).json({ error: { message: 'Miembro no encontrado en el grupo' } })
  }

  res.status(204).end()
}

async function updateGroupMember(req, res) {
  const { id: groupId, userId } = req.params

  if (!(await isGroupAdmin(req.user.id, groupId))) {
    return res.status(403).json(ADMIN_ONLY)
  }

  const member = await db('group_members')
    .where({ group_id: groupId, user_id: userId })
    .first()
  if (!member) {
    return res.status(404).json({ error: { message: 'Miembro no encontrado en el grupo' } })
  }

  const { nickname, payment_alias, cbu } = req.body
  const updates = {}
  if (nickname !== undefined) updates.nickname = nickname
  if (payment_alias !== undefined) updates.payment_alias = payment_alias
  if (cbu !== undefined) updates.cbu = cbu

  if (Object.keys(updates).length > 0) {
    await db('group_members')
      .where({ group_id: groupId, user_id: userId })
      .update(updates)
  }

  const updated = await db('group_members')
    .where({ group_id: groupId, user_id: userId })
    .first()

  res.json({
    userId,
    nickname: updated.nickname,
    payment_alias: updated.payment_alias,
    cbu: updated.cbu,
  })
}

async function balances(req, res) {
  const groupId = req.params.id

  if (!(await isGroupMember(req.user.id, groupId))) {
    return res.status(403).json(FORBIDDEN)
  }

  // Reutiliza el mismo cálculo que el resumen: emails saneados y balances
  // normalizados a centavos (sin residuo de punto flotante).
  const { balances, debts } = await buildGroupSummaryData(groupId)
  res.json({ balances, debts })
}

// Reúne todos los datos del resumen de un grupo (members, gastos con splits,
// balances y deudas minimizadas). Lo comparten el envío por email y la descarga.
async function buildGroupSummaryData(groupId) {
  const members = await fetchGroupMembers(groupId)

  const expenses = await db('expenses').where({ group_id: groupId }).orderBy('date', 'desc')
  const expenseIds = expenses.map((e) => e.id)

  const splits = expenseIds.length
    ? await db('expense_splits').whereIn('expense_id', expenseIds)
    : []

  const splitsByExpense = {}
  splits.forEach((s) => {
    if (!splitsByExpense[s.expense_id]) splitsByExpense[s.expense_id] = []
    splitsByExpense[s.expense_id].push(s.user_id)
  })

  const expensesWithSplits = expenses.map((e) => ({
    ...e,
    splitBetween: splitsByExpense[e.id] || [],
  }))

  const balanceMap = {}
  members.forEach((m) => { balanceMap[m.id] = { ...m, balance: 0 } })

  expensesWithSplits.forEach((expense) => {
    const splitMembers = expense.splitBetween
    if (splitMembers.length === 0) return // sin splits no se puede repartir; evita división por cero
    const splitAmount = parseFloat(expense.amount) / splitMembers.length
    if (balanceMap[expense.paid_by]) {
      balanceMap[expense.paid_by].balance += parseFloat(expense.amount)
    }
    splitMembers.forEach((id) => {
      if (balanceMap[id]) balanceMap[id].balance -= splitAmount
    })
  })

  const debtors = []
  const creditors = []
  Object.values(balanceMap).forEach((member) => {
    if (member.balance < -0.01) debtors.push({ ...member })
    else if (member.balance > 0.01) creditors.push({ ...member })
  })
  debtors.sort((a, b) => a.balance - b.balance)
  creditors.sort((a, b) => b.balance - a.balance)

  const debts = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(-debtors[i].balance, creditors[j].balance)
    debts.push({ from: debtors[i], to: creditors[j], amount: Math.round(amount * 100) / 100 })
    debtors[i].balance += amount
    creditors[j].balance -= amount
    if (Math.abs(debtors[i].balance) < 0.01) i++
    if (Math.abs(creditors[j].balance) < 0.01) j++
  }

  // Redondeo a centavos y colapso a 0 el residuo de punto flotante: un balance
  // dentro del umbral de deuda (±0.01) está saldado y no debe mostrarse como
  // deuda/crédito de un centavo (coincide con el corte de debtors/creditors).
  Object.values(balanceMap).forEach((member) => {
    const rounded = Math.round(member.balance * 100) / 100
    member.balance = Math.abs(rounded) <= 0.01 ? 0 : rounded
  })

  return { members, expenses: expensesWithSplits, balances: balanceMap, debts }
}

async function sendSummary(req, res) {
  const groupId = req.params.id

  const group = await db('groups').where({ id: groupId }).first()
  if (!group) {
    return res.status(404).json({ error: { message: 'Grupo no encontrado' } })
  }
  if (!(await isGroupMember(req.user.id, groupId))) {
    return res.status(403).json(FORBIDDEN)
  }

  const { members, expenses, balances, debts } = await buildGroupSummaryData(groupId)

  const pdfBuffer = await generateGroupSummaryPDF({
    group,
    members,
    expenses,
    balances,
    debts,
  })

  const user = await db('users').where({ id: req.user.id }).first()
  if (!user?.email) {
    return res.status(400).json({ error: { message: 'Tu cuenta no tiene un email configurado' } })
  }
  if (user.notify_group_summaries === false) {
    return res.status(400).json({
      error: {
        message: 'Tenés desactivados los resúmenes por email. Activalos en tu perfil para recibirlos',
      },
    })
  }

  await sendGroupSummary({
    to: user.email,
    groupName: group.name,
    groupEmoji: group.emoji,
    pdfBuffer,
  })

  res.json({ message: 'Resumen enviado', sentTo: 1 })
}

async function downloadSummary(req, res) {
  const groupId = req.params.id

  const group = await db('groups').where({ id: groupId }).first()
  if (!group) {
    return res.status(404).json({ error: { message: 'Grupo no encontrado' } })
  }
  if (!(await isGroupMember(req.user.id, groupId))) {
    return res.status(403).json(FORBIDDEN)
  }

  const { members, expenses, balances, debts } = await buildGroupSummaryData(groupId)

  const pdfBuffer = await generateGroupSummaryPDF({
    group,
    members,
    expenses,
    balances,
    debts,
  })

  const slug = (group.name || 'grupo')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // saca acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'grupo'
  const fecha = new Date().toISOString().slice(0, 10)
  const filename = `resumen-${slug}-${fecha}.pdf`

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(pdfBuffer)
}

// ── Invitaciones por email a un grupo existente ──────────────────────────────

async function inviteByEmail(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  const groupId = req.params.id
  if (!(await isGroupMember(req.user.id, groupId))) {
    return res.status(403).json(FORBIDDEN)
  }

  const email = req.body.email.trim().toLowerCase()

  // Si ya es miembro, no tiene sentido invitarlo.
  const alreadyMember = await db('group_members')
    .join('users', 'users.id', 'group_members.user_id')
    .where({ 'group_members.group_id': groupId })
    .andWhere('users.email', email)
    .first()
  if (alreadyMember) {
    return res.status(409).json({ error: { message: 'Esa persona ya es miembro del grupo' } })
  }

  // Reusar una invitación pendiente para el mismo email en vez de duplicar.
  const existing = await db('group_invitations')
    .where({ group_id: groupId, email })
    .whereNull('accepted_at')
    .first()
  let token
  if (existing) {
    token = existing.token
    await db('group_invitations')
      .where({ id: existing.id })
      .update({ expires_at: new Date(Date.now() + INVITE_TTL_MS), invited_by: req.user.id })
  } else {
    token = generateToken(16)
    await db('group_invitations').insert({
      group_id: groupId,
      email,
      token,
      invited_by: req.user.id,
      expires_at: new Date(Date.now() + INVITE_TTL_MS),
    })
  }

  const group = await db('groups').where({ id: groupId }).first()
  sendInvitesRespectingPrefs({
    invites: [{ email, token }],
    inviterId: req.user.id,
    groupName: group.name,
    groupEmoji: group.emoji,
  }).catch((err) => console.error('Failed to send group invite:', err))

  res.status(201).json({ message: 'Invitación enviada', email })
}

async function listInvitations(req, res) {
  const groupId = req.params.id
  if (!(await isGroupMember(req.user.id, groupId))) {
    return res.status(403).json(FORBIDDEN)
  }
  const invitations = await db('group_invitations')
    .where({ group_id: groupId })
    .whereNotNull('email')
    .whereNull('accepted_at')
    .select('id', 'email', 'expires_at', 'created_at')
    .orderBy('created_at', 'desc')
  res.json(invitations)
}

async function revokeInvitation(req, res) {
  const { id: groupId, invitationId } = req.params
  if (!(await isGroupMember(req.user.id, groupId))) {
    return res.status(403).json(FORBIDDEN)
  }
  const deleted = await db('group_invitations')
    .where({ id: invitationId, group_id: groupId })
    .whereNotNull('email')
    .del()
  if (!deleted) {
    return res.status(404).json({ error: { message: 'Invitación no encontrada' } })
  }
  res.status(204).end()
}

// ── Código/enlace compartible del grupo (una fila con email NULL) ────────────

async function getInviteCode(req, res) {
  const groupId = req.params.id
  if (!(await isGroupMember(req.user.id, groupId))) {
    return res.status(403).json(FORBIDDEN)
  }
  const code = await db('group_invitations')
    .where({ group_id: groupId })
    .whereNull('email')
    .first()
  res.json(code ? { token: code.token } : { token: null })
}

async function generateInviteCode(req, res) {
  const groupId = req.params.id
  if (!(await isGroupAdmin(req.user.id, groupId))) {
    return res.status(403).json(ADMIN_ONLY)
  }
  const token = generateToken(6)
  await db.transaction(async (trx) => {
    await trx('group_invitations').where({ group_id: groupId }).whereNull('email').del()
    await trx('group_invitations').insert({
      group_id: groupId,
      email: null,
      token,
      invited_by: req.user.id,
    })
  })
  res.status(201).json({ token })
}

async function revokeInviteCode(req, res) {
  const groupId = req.params.id
  if (!(await isGroupAdmin(req.user.id, groupId))) {
    return res.status(403).json(ADMIN_ONLY)
  }
  await db('group_invitations').where({ group_id: groupId }).whereNull('email').del()
  res.status(204).end()
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  listMembers,
  addMember,
  removeMember,
  updateGroupMember,
  balances,
  sendSummary,
  downloadSummary,
  inviteByEmail,
  listInvitations,
  revokeInvitation,
  getInviteCode,
  generateInviteCode,
  revokeInviteCode,
}
