// Cálculo de balances y deudas — fuente única compartida por frontend y backend.
//
// Lo consumen las vistas de React (vía el alias `@shared`) y el backend en
// `buildGroupSummaryData` (endpoint `GET /groups/:id/balances` y resumen en PDF),
// así que la UI, la API y el PDF siempre muestran exactamente los mismos números.
//
// Todo el cálculo interno se hace en centavos enteros: el dinero nunca pasa por
// aritmética de punto flotante, y el reparto de un gasto suma exactamente el
// total del gasto (sin centavos que aparezcan o desaparezcan al dividir).

// Acepta tanto el number del frontend como el string decimal que devuelve Knex
// para un DECIMAL(12,2).
function toCents(amount) {
  return Math.round(Number(amount) * 100)
}

// No hay tolerancia ni umbral de "centavo suelto" en ningún lado: al trabajar en
// enteros no queda residuo que descartar, y todo balance distinto de cero sale
// como deuda. Así el grupo siempre se puede saldar hasta dejar a todos en cero.

// Balance neto por miembro: positivo = le deben, negativo = debe.
// `expenses` acepta la forma del frontend (`paidBy`) y la fila cruda de la base
// (`paid_by`); ambas deben traer `splitBetween` con los ids del reparto.
export function calculateGroupBalances(expenses, members) {
  const balances = {}
  const cents = new Map()

  members.forEach((member) => {
    balances[member.id] = { ...member, balance: 0 }
    cents.set(member.id, 0)
  })

  expenses.forEach((expense) => {
    const splitBetween = expense.splitBetween || []
    if (splitBetween.length === 0) return // sin splits no se puede repartir; evita división por cero

    const total = toCents(expense.amount)
    const base = Math.floor(total / splitBetween.length)
    // Los centavos que no entran en el reparto exacto se asignan de a uno a los
    // primeros miembros del split, en orden: así las partes suman el total.
    const remainder = total - base * splitBetween.length

    const paidBy = expense.paidBy ?? expense.paid_by
    if (cents.has(paidBy)) {
      cents.set(paidBy, cents.get(paidBy) + total)
    }
    splitBetween.forEach((userId, index) => {
      if (!cents.has(userId)) return // el que pagó o participó ya no es miembro del grupo
      cents.set(userId, cents.get(userId) - (index < remainder ? base + 1 : base))
    })
  })

  // Los centavos son exactos, así que se devuelven tal cual: la suma de todos
  // los balances del grupo da exactamente cero.
  cents.forEach((value, userId) => {
    balances[userId].balance = value / 100
  })

  return balances
}

// Deudas mínimas: emparejamiento greedy del que más debe con el que más le
// deben, que minimiza la cantidad de transferencias necesarias. Cubre todo
// balance distinto de cero, así saldarlas todas deja el grupo en cero exacto.
export function calculateDebts(balances) {
  const debtors = []
  const creditors = []

  Object.values(balances).forEach((member) => {
    const balance = toCents(member.balance)
    if (balance < 0) debtors.push({ member, balance })
    else if (balance > 0) creditors.push({ member, balance })
  })

  debtors.sort((a, b) => a.balance - b.balance)
  creditors.sort((a, b) => b.balance - a.balance)

  const debts = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(-debtors[i].balance, creditors[j].balance)
    debts.push({
      from: { ...debtors[i].member },
      to: { ...creditors[j].member },
      amount: amount / 100,
    })

    debtors[i].balance += amount
    creditors[j].balance -= amount
    // Con enteros, cada paso salda al menos a uno de los dos: el bucle avanza siempre.
    if (debtors[i].balance === 0) i++
    if (creditors[j].balance === 0) j++
  }

  return debts
}
