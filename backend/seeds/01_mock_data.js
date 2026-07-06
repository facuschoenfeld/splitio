const bcrypt = require('bcrypt')

const USER_IDS = {
  'user-1': '00000000-0000-0000-0000-000000000001',
  'user-2': '00000000-0000-0000-0000-000000000002',
  'user-3': '00000000-0000-0000-0000-000000000003',
  'user-4': '00000000-0000-0000-0000-000000000004',
  'user-5': '00000000-0000-0000-0000-000000000005',
  'user-6': '00000000-0000-0000-0000-000000000006',
}

const GROUP_IDS = {
  'group-1': '10000000-0000-0000-0000-000000000001',
  'group-2': '10000000-0000-0000-0000-000000000002',
  'group-3': '10000000-0000-0000-0000-000000000003',
}

const EXPENSE_IDS = {
  'exp-1': '20000000-0000-0000-0000-000000000001',
  'exp-2': '20000000-0000-0000-0000-000000000002',
  'exp-3': '20000000-0000-0000-0000-000000000003',
  'exp-4': '20000000-0000-0000-0000-000000000004',
  'exp-5': '20000000-0000-0000-0000-000000000005',
  'exp-6': '20000000-0000-0000-0000-000000000006',
  'exp-7': '20000000-0000-0000-0000-000000000007',
  'exp-8': '20000000-0000-0000-0000-000000000008',
  'exp-9': '20000000-0000-0000-0000-000000000009',
  'exp-10': '20000000-0000-0000-0000-000000000010',
}

exports.seed = async function (knex) {
  await knex('expense_splits').del()
  await knex('expenses').del()
  await knex('group_members').del()
  await knex('groups').del()
  await knex('users').del()

  const hash = await bcrypt.hash('password123', 10)

  await knex('users').insert([
    { id: USER_IDS['user-1'], name: 'Facundo', email: 'facundo@email.com', password: hash },
    { id: USER_IDS['user-2'], name: 'Martina', email: 'martina@email.com', password: hash },
    { id: USER_IDS['user-3'], name: 'Lucas', email: 'lucas@email.com', password: hash },
    { id: USER_IDS['user-4'], name: 'Valentina', email: 'valentina@email.com', password: hash },
    { id: USER_IDS['user-5'], name: 'Santiago', email: 'santiago@email.com', password: hash },
    { id: USER_IDS['user-6'], name: 'Camila', email: 'camila@email.com', password: hash },
  ])

  await knex('groups').insert([
    { id: GROUP_IDS['group-1'], name: 'Departamento', description: 'Gastos del alquiler y servicios', emoji: '🏠', created_by: USER_IDS['user-1'], created_at: '2026-01-15' },
    { id: GROUP_IDS['group-2'], name: 'Viaje a Bariloche', description: 'Gastos del viaje grupal', emoji: '✈️', created_by: USER_IDS['user-1'], created_at: '2026-03-01' },
    { id: GROUP_IDS['group-3'], name: 'Asado de los sábados', description: 'Compras para los asados', emoji: '🔥', created_by: USER_IDS['user-1'], created_at: '2026-02-10' },
  ])

  await knex('group_members').insert([
    { group_id: GROUP_IDS['group-1'], user_id: USER_IDS['user-1'] },
    { group_id: GROUP_IDS['group-1'], user_id: USER_IDS['user-2'] },
    { group_id: GROUP_IDS['group-1'], user_id: USER_IDS['user-3'] },
    { group_id: GROUP_IDS['group-2'], user_id: USER_IDS['user-1'] },
    { group_id: GROUP_IDS['group-2'], user_id: USER_IDS['user-2'] },
    { group_id: GROUP_IDS['group-2'], user_id: USER_IDS['user-4'] },
    { group_id: GROUP_IDS['group-2'], user_id: USER_IDS['user-5'] },
    { group_id: GROUP_IDS['group-3'], user_id: USER_IDS['user-1'] },
    { group_id: GROUP_IDS['group-3'], user_id: USER_IDS['user-3'] },
    { group_id: GROUP_IDS['group-3'], user_id: USER_IDS['user-5'] },
    { group_id: GROUP_IDS['group-3'], user_id: USER_IDS['user-6'] },
  ])

  await knex('expenses').insert([
    { id: EXPENSE_IDS['exp-1'], group_id: GROUP_IDS['group-1'], description: 'Alquiler Abril', amount: 450000, paid_by: USER_IDS['user-1'], category: 'vivienda', date: '2026-04-01' },
    { id: EXPENSE_IDS['exp-2'], group_id: GROUP_IDS['group-1'], description: 'Electricidad', amount: 35000, paid_by: USER_IDS['user-2'], category: 'servicios', date: '2026-04-05' },
    { id: EXPENSE_IDS['exp-3'], group_id: GROUP_IDS['group-1'], description: 'Internet', amount: 28000, paid_by: USER_IDS['user-3'], category: 'servicios', date: '2026-04-03' },
    { id: EXPENSE_IDS['exp-4'], group_id: GROUP_IDS['group-2'], description: 'Hotel 3 noches', amount: 680000, paid_by: USER_IDS['user-1'], category: 'alojamiento', date: '2026-03-15' },
    { id: EXPENSE_IDS['exp-5'], group_id: GROUP_IDS['group-2'], description: 'Alquiler auto', amount: 120000, paid_by: USER_IDS['user-4'], category: 'transporte', date: '2026-03-15' },
    { id: EXPENSE_IDS['exp-6'], group_id: GROUP_IDS['group-2'], description: 'Cena en cervecería', amount: 96000, paid_by: USER_IDS['user-2'], category: 'comida', date: '2026-03-16' },
    { id: EXPENSE_IDS['exp-7'], group_id: GROUP_IDS['group-2'], description: 'Excursión Cerro Catedral', amount: 200000, paid_by: USER_IDS['user-5'], category: 'entretenimiento', date: '2026-03-17' },
    { id: EXPENSE_IDS['exp-8'], group_id: GROUP_IDS['group-3'], description: 'Carne y chorizos', amount: 45000, paid_by: USER_IDS['user-1'], category: 'comida', date: '2026-04-12' },
    { id: EXPENSE_IDS['exp-9'], group_id: GROUP_IDS['group-3'], description: 'Bebidas y hielo', amount: 22000, paid_by: USER_IDS['user-6'], category: 'comida', date: '2026-04-12' },
    { id: EXPENSE_IDS['exp-10'], group_id: GROUP_IDS['group-3'], description: 'Carbón y leña', amount: 8000, paid_by: USER_IDS['user-3'], category: 'comida', date: '2026-04-12' },
  ])

  await knex('expense_splits').insert([
    { expense_id: EXPENSE_IDS['exp-1'], user_id: USER_IDS['user-1'] },
    { expense_id: EXPENSE_IDS['exp-1'], user_id: USER_IDS['user-2'] },
    { expense_id: EXPENSE_IDS['exp-1'], user_id: USER_IDS['user-3'] },
    { expense_id: EXPENSE_IDS['exp-2'], user_id: USER_IDS['user-1'] },
    { expense_id: EXPENSE_IDS['exp-2'], user_id: USER_IDS['user-2'] },
    { expense_id: EXPENSE_IDS['exp-2'], user_id: USER_IDS['user-3'] },
    { expense_id: EXPENSE_IDS['exp-3'], user_id: USER_IDS['user-1'] },
    { expense_id: EXPENSE_IDS['exp-3'], user_id: USER_IDS['user-2'] },
    { expense_id: EXPENSE_IDS['exp-3'], user_id: USER_IDS['user-3'] },
    { expense_id: EXPENSE_IDS['exp-4'], user_id: USER_IDS['user-1'] },
    { expense_id: EXPENSE_IDS['exp-4'], user_id: USER_IDS['user-2'] },
    { expense_id: EXPENSE_IDS['exp-4'], user_id: USER_IDS['user-4'] },
    { expense_id: EXPENSE_IDS['exp-4'], user_id: USER_IDS['user-5'] },
    { expense_id: EXPENSE_IDS['exp-5'], user_id: USER_IDS['user-1'] },
    { expense_id: EXPENSE_IDS['exp-5'], user_id: USER_IDS['user-2'] },
    { expense_id: EXPENSE_IDS['exp-5'], user_id: USER_IDS['user-4'] },
    { expense_id: EXPENSE_IDS['exp-5'], user_id: USER_IDS['user-5'] },
    { expense_id: EXPENSE_IDS['exp-6'], user_id: USER_IDS['user-1'] },
    { expense_id: EXPENSE_IDS['exp-6'], user_id: USER_IDS['user-2'] },
    { expense_id: EXPENSE_IDS['exp-6'], user_id: USER_IDS['user-4'] },
    { expense_id: EXPENSE_IDS['exp-6'], user_id: USER_IDS['user-5'] },
    { expense_id: EXPENSE_IDS['exp-7'], user_id: USER_IDS['user-1'] },
    { expense_id: EXPENSE_IDS['exp-7'], user_id: USER_IDS['user-2'] },
    { expense_id: EXPENSE_IDS['exp-7'], user_id: USER_IDS['user-4'] },
    { expense_id: EXPENSE_IDS['exp-7'], user_id: USER_IDS['user-5'] },
    { expense_id: EXPENSE_IDS['exp-8'], user_id: USER_IDS['user-1'] },
    { expense_id: EXPENSE_IDS['exp-8'], user_id: USER_IDS['user-3'] },
    { expense_id: EXPENSE_IDS['exp-8'], user_id: USER_IDS['user-5'] },
    { expense_id: EXPENSE_IDS['exp-8'], user_id: USER_IDS['user-6'] },
    { expense_id: EXPENSE_IDS['exp-9'], user_id: USER_IDS['user-1'] },
    { expense_id: EXPENSE_IDS['exp-9'], user_id: USER_IDS['user-3'] },
    { expense_id: EXPENSE_IDS['exp-9'], user_id: USER_IDS['user-5'] },
    { expense_id: EXPENSE_IDS['exp-9'], user_id: USER_IDS['user-6'] },
    { expense_id: EXPENSE_IDS['exp-10'], user_id: USER_IDS['user-1'] },
    { expense_id: EXPENSE_IDS['exp-10'], user_id: USER_IDS['user-3'] },
    { expense_id: EXPENSE_IDS['exp-10'], user_id: USER_IDS['user-5'] },
    { expense_id: EXPENSE_IDS['exp-10'], user_id: USER_IDS['user-6'] },
  ])
}
