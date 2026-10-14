const { validationResult } = require('express-validator')
const db = require('../config/db')
const { isGroupMember, areGroupMembers, isGroupAdmin } = require('../utils/authorization')
const { buildGroupSummaryData } = require('./groupController')

const FORBIDDEN = { error: { message: 'No tenés acceso a este recurso' } }
const PARTICIPANTS_NOT_MEMBERS = {
  error: { message: 'El pagador y los participantes deben ser miembros del grupo' },
}
const SETTLE_NOT_MEMBERS = { error: { message: 'El deudor y el acreedor deben ser miembros del grupo' } }
const SETTLE_SAME_USER = { error: { message: 'El deudor y el acreedor deben ser personas distintas' } }
const SETTLE_NOT_ALLOWED = {
  error: { message: 'Solo el deudor, el acreedor o el administrador del grupo pueden saldar esta deuda' },
}
const SETTLE_NO_DEBT = { error: { message: 'No hay una deuda pendiente entre esas personas' } }

const sameId = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()
const toCents = (value) => Math.round(Number(value) * 100)
const formatPesos = (value) =>
  `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const DELETE_NOT_ALLOWED = {
  error: { message: 'Solo quien pagó el gasto o el administrador del grupo pueden eliminarlo' },
}

async function list(req, res) {
  const { groupId } = req.query
  const query = db('expenses')

  if (groupId) {
    if (!(await isGroupMember(req.user.id, groupId))) {
      return res.status(403).json(FORBIDDEN)
    }
    query.where({ group_id: groupId })
  } else {
    // Sin groupId, limitar a los grupos a los que pertenece el usuario.
    const memberGroups = await db('group_members')
      .where({ user_id: req.user.id })
      .pluck('group_id')
    query.whereIn('group_id', memberGroups)
  }

  const expenses = await query.orderBy('date', 'desc')

  const expenseIds = expenses.map((e) => e.id)
  const splits = expenseIds.length
    ? await db('expense_splits').whereIn('expense_id', expenseIds)
    : []

  const splitsByExpense = {}
  splits.forEach((s) => {
    if (!splitsByExpense[s.expense_id]) splitsByExpense[s.expense_id] = []
    splitsByExpense[s.expense_id].push(s.user_id)
  })

  const result = expenses.map((e) => ({
    id: e.id,
    groupId: e.group_id,
    description: e.description,
    amount: parseFloat(e.amount),
    paidBy: e.paid_by,
    splitBetween: splitsByExpense[e.id] || [],
    category: e.category,
    date: e.date,
  }))

  res.json(result)
}

async function getById(req, res) {
  const expense = await db('expenses').where({ id: req.params.id }).first()
  if (!expense) {
    return res.status(404).json({ error: { message: 'Gasto no encontrado' } })
  }
  if (!(await isGroupMember(req.user.id, expense.group_id))) {
    return res.status(403).json(FORBIDDEN)
  }

  const splits = await db('expense_splits')
    .where({ expense_id: expense.id })
    .pluck('user_id')

  res.json({
    id: expense.id,
    groupId: expense.group_id,
    description: expense.description,
    amount: parseFloat(expense.amount),
    paidBy: expense.paid_by,
    splitBetween: splits,
    category: expense.category,
    date: expense.date,
  })
}

async function create(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { groupId, description, amount, paidBy, category, date } = req.body
  // Un id repetido violaría la PK de expense_splits; se cuenta una sola vez.
  const splitBetween = [...new Set(req.body.splitBetween.map((id) => id.toLowerCase()))]

  if (!(await isGroupMember(req.user.id, groupId))) {
    return res.status(403).json(FORBIDDEN)
  }
  // Si el pagador o un participante no es del grupo, el cálculo de balances lo
  // ignora y los balances del grupo dejarían de sumar cero.
  if (!(await areGroupMembers([paidBy, ...splitBetween], groupId))) {
    return res.status(400).json(PARTICIPANTS_NOT_MEMBERS)
  }

  const expense = await db.transaction(async (trx) => {
    const [created] = await trx('expenses')
      .insert({
        group_id: groupId,
        description,
        amount,
        paid_by: paidBy,
        category,
        date,
      })
      .returning('*')

    await trx('expense_splits').insert(
      splitBetween.map((userId) => ({ expense_id: created.id, user_id: userId }))
    )

    return created
  })

  res.status(201).json({
    id: expense.id,
    groupId: expense.group_id,
    description: expense.description,
    amount: parseFloat(expense.amount),
    paidBy: expense.paid_by,
    splitBetween,
    category: expense.category,
    date: expense.date,
  })
}

async function remove(req, res) {
  const expense = await db('expenses').where({ id: req.params.id }).first()
  if (!expense) {
    return res.status(404).json({ error: { message: 'Gasto no encontrado' } })
  }
  if (!(await isGroupMember(req.user.id, expense.group_id))) {
    return res.status(403).json(FORBIDDEN)
  }
  // Ser miembro no alcanza: borrar un gasto cambia los balances de todo el grupo.
  const isPayer = String(expense.paid_by) === String(req.user.id)
  if (!isPayer && !(await isGroupAdmin(req.user.id, expense.group_id))) {
    return res.status(403).json(DELETE_NOT_ALLOWED)
  }

  await db('expenses').where({ id: req.params.id }).del()
  res.status(204).end()
}

async function settle(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { groupId, fromUserId, toUserId, amount } = req.body

  if (!(await isGroupMember(req.user.id, groupId))) {
    return res.status(403).json(FORBIDDEN)
  }
  if (sameId(fromUserId, toUserId)) {
    return res.status(400).json(SETTLE_SAME_USER)
  }
  if (!(await areGroupMembers([fromUserId, toUserId], groupId))) {
    return res.status(400).json(SETTLE_NOT_MEMBERS)
  }
  // Solo el deudor, el acreedor o el administrador; el administrador cubre a los
  // miembros sin cuenta, que no pueden iniciar sesión para saldar sus deudas.
  const isParticipant = [fromUserId, toUserId].some((id) => sameId(id, req.user.id))
  if (!isParticipant && !(await isGroupAdmin(req.user.id, groupId))) {
    return res.status(403).json(SETTLE_NOT_ALLOWED)
  }

  const result = await db.transaction(async (trx) => {
    // Bloquea el grupo: dos pagos simultáneos no pueden saldar la misma deuda dos veces.
    await trx('groups').where({ id: groupId }).forUpdate().first()

    // El pago tiene que corresponder a una deuda pendiente y no superarla: si no,
    // la deuda se invertiría (el acreedor pasaría a deber).
    const { debts } = await buildGroupSummaryData(groupId, { trx })
    const debt = debts.find((d) => sameId(d.from.id, fromUserId) && sameId(d.to.id, toUserId))
    if (!debt) {
      return { status: 409, body: SETTLE_NO_DEBT }
    }
    if (toCents(amount) > toCents(debt.amount)) {
      return {
        status: 400,
        body: { error: { message: `El monto supera la deuda pendiente de ${formatPesos(debt.amount)}` } },
      }
    }

    const [created] = await trx('expenses')
      .insert({
        group_id: groupId,
        description: 'Saldo de deuda',
        amount,
        paid_by: fromUserId,
        category: 'settlement',
        date: new Date().toISOString().split('T')[0],
      })
      .returning('*')

    await trx('expense_splits').insert({ expense_id: created.id, user_id: toUserId })

    return { expense: created }
  })

  if (!result.expense) {
    return res.status(result.status).json(result.body)
  }
  const { expense } = result

  res.status(201).json({
    id: expense.id,
    groupId: expense.group_id,
    description: expense.description,
    amount: parseFloat(expense.amount),
    paidBy: expense.paid_by,
    splitBetween: [toUserId],
    category: expense.category,
    date: expense.date,
  })
}

module.exports = { list, getById, create, remove, settle }
