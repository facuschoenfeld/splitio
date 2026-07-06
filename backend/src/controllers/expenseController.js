const { validationResult } = require('express-validator')
const db = require('../config/db')
const { isGroupMember } = require('../utils/authorization')

const FORBIDDEN = { error: { message: 'No tenés acceso a este recurso' } }

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

  const { groupId, description, amount, paidBy, splitBetween, category, date } = req.body

  if (!(await isGroupMember(req.user.id, groupId))) {
    return res.status(403).json(FORBIDDEN)
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

  const expense = await db.transaction(async (trx) => {
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

    return created
  })

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
