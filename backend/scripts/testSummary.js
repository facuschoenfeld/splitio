require('dotenv').config()
const db = require('../src/config/db')
const { generateGroupSummaryPDF } = require('../src/services/pdfService')
const { sendGroupSummary } = require('../src/services/emailService')

async function run() {
  console.log('Limpiando datos existentes...')
  await db('expense_splits').del()
  await db('expenses').del()
  await db('group_members').del()
  await db('groups').del()
  await db('users').del()

  console.log('Creando usuarios...')
  const [facu] = await db('users').insert({
    name: 'Facu Schoenfeld',
    email: 'facuschoenfeld@gmail.com',
    password: 'not-used',
    status: 'active',
  }).returning('*')

  const [martin] = await db('users').insert({
    name: 'Martin Lopez',
    email: 'martin.test@placeholder.local',
    password: 'not-used',
    status: 'active',
  }).returning('*')

  const [lucia] = await db('users').insert({
    name: 'Lucia Garcia',
    email: 'lucia.test@placeholder.local',
    password: 'not-used',
    status: 'active',
  }).returning('*')

  const [pedro] = await db('users').insert({
    name: 'Pedro Martinez',
    email: 'pedro.test@placeholder.local',
    password: 'not-used',
    status: 'active',
  }).returning('*')

  const members = [facu, martin, lucia, pedro]
  console.log(`Usuarios creados: ${members.map(m => m.name).join(', ')}`)

  console.log('Creando grupo...')
  const [group] = await db('groups').insert({
    name: 'Viaje a Bariloche',
    description: 'Gastos compartidos del viaje grupal',
    emoji: '🏔️',
    created_by: facu.id,
  }).returning('*')

  await db('group_members').insert(
    members.map(m => ({ group_id: group.id, user_id: m.id }))
  )
  console.log(`Grupo "${group.name}" creado con ${members.length} miembros`)

  console.log('Creando gastos...')
  const expensesData = [
    { description: 'Alquiler cabaña (3 noches)', amount: 180000, paid_by: facu.id, category: 'alojamiento', date: '2026-05-01', split: [facu, martin, lucia, pedro] },
    { description: 'Supermercado día 1', amount: 35000, paid_by: martin.id, category: 'comida', date: '2026-05-01', split: [facu, martin, lucia, pedro] },
    { description: 'Cervecería Patagonia', amount: 28000, paid_by: lucia.id, category: 'comida', date: '2026-05-02', split: [facu, martin, lucia] },
    { description: 'Excursión Cerro Catedral', amount: 60000, paid_by: facu.id, category: 'actividades', date: '2026-05-02', split: [facu, martin, lucia, pedro] },
    { description: 'Nafta ida', amount: 45000, paid_by: pedro.id, category: 'transporte', date: '2026-05-01', split: [facu, martin, lucia, pedro] },
    { description: 'Nafta vuelta', amount: 42000, paid_by: pedro.id, category: 'transporte', date: '2026-05-03', split: [facu, martin, lucia, pedro] },
    { description: 'Chocolates Rapa Nui', amount: 15000, paid_by: lucia.id, category: 'compras', date: '2026-05-03', split: [facu, lucia] },
    { description: 'Asado noche final', amount: 22000, paid_by: martin.id, category: 'comida', date: '2026-05-03', split: [facu, martin, lucia, pedro] },
  ]

  for (const exp of expensesData) {
    const [expense] = await db('expenses').insert({
      group_id: group.id,
      description: exp.description,
      amount: exp.amount,
      paid_by: exp.paid_by,
      category: exp.category,
      date: exp.date,
    }).returning('*')

    await db('expense_splits').insert(
      exp.split.map(m => ({ expense_id: expense.id, user_id: m.id }))
    )
    console.log(`  + ${exp.description}: $${exp.amount.toLocaleString()}`)
  }

  console.log('\nCalculando balances...')
  const expenses = await db('expenses').where({ group_id: group.id })
  const expenseIds = expenses.map(e => e.id)
  const splits = await db('expense_splits').whereIn('expense_id', expenseIds)

  const splitsByExpense = {}
  splits.forEach(s => {
    if (!splitsByExpense[s.expense_id]) splitsByExpense[s.expense_id] = []
    splitsByExpense[s.expense_id].push(s.user_id)
  })

  const expensesWithSplits = expenses.map(e => ({
    ...e,
    splitBetween: splitsByExpense[e.id] || [],
  }))

  const balanceMap = {}
  members.forEach(m => { balanceMap[m.id] = { ...m, balance: 0 } })

  expensesWithSplits.forEach(expense => {
    const splitMembers = expense.splitBetween
    const splitAmount = parseFloat(expense.amount) / splitMembers.length
    if (balanceMap[expense.paid_by]) {
      balanceMap[expense.paid_by].balance += parseFloat(expense.amount) - splitAmount
    }
    splitMembers
      .filter(id => id !== expense.paid_by)
      .forEach(id => {
        if (balanceMap[id]) balanceMap[id].balance -= splitAmount
      })
  })

  const debtors = []
  const creditors = []
  Object.values(balanceMap).forEach(member => {
    if (member.balance < -0.01) debtors.push({ ...member })
    else if (member.balance > 0.01) creditors.push({ ...member })
  })
  debtors.sort((a, b) => a.balance - b.balance)
  creditors.sort((a, b) => b.balance - a.balance)

  const debts = []
  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(-debtors[i].balance, creditors[j].balance)
    debts.push({ from: debtors[i], to: creditors[j], amount: Math.round(amount * 100) / 100 })
    debtors[i].balance += amount
    creditors[j].balance -= amount
    if (Math.abs(debtors[i].balance) < 0.01) i++
    if (Math.abs(creditors[j].balance) < 0.01) j++
  }

  Object.values(balanceMap).forEach(m => {
    const sign = m.balance >= 0 ? '+' : ''
    console.log(`  ${m.name}: ${sign}$${m.balance.toFixed(2)}`)
  })

  console.log('\nGenerando PDF...')
  const pdfBuffer = await generateGroupSummaryPDF({
    group,
    members,
    expenses: expensesWithSplits,
    balances: balanceMap,
    debts,
  })
  console.log(`PDF generado: ${(pdfBuffer.length / 1024).toFixed(1)} KB`)

  console.log(`\nEnviando resumen a facuschoenfeld@gmail.com...`)
  await sendGroupSummary({
    to: ['facuschoenfeld@gmail.com'],
    groupName: group.name,
    groupEmoji: group.emoji,
    pdfBuffer,
  })
  console.log('Email enviado exitosamente!')

  await db.destroy()
}

run().catch(err => {
  console.error('Error:', err)
  db.destroy().then(() => process.exit(1))
})
