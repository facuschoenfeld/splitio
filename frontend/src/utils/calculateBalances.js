export function calculateGroupBalances(expenses, members) {
  const balances = {}

  members.forEach((member) => {
    balances[member.id] = { ...member, balance: 0 }
  })

  expenses.forEach((expense) => {
    const count = expense.splitBetween.length
    if (count === 0) return // sin splits no se puede repartir; evita división por cero
    const baseSplit = Math.floor(expense.amount * 100 / count) / 100
    const totalBase = Math.round(baseSplit * count * 100) / 100
    const remainderCents = Math.round((expense.amount - totalBase) * 100)

    if (balances[expense.paidBy]) {
      balances[expense.paidBy].balance += expense.amount
    }
    expense.splitBetween.forEach((id, idx) => {
      if (balances[id]) {
        balances[id].balance -= idx < remainderCents ? baseSplit + 0.01 : baseSplit
      }
    })
  })

  Object.values(balances).forEach((member) => {
    member.balance = Math.round(member.balance * 100) / 100
    if (Math.abs(member.balance) <= 0.01) member.balance = 0
  })

  return balances
}

export function calculateDebts(balances) {
  const debtors = []
  const creditors = []

  Object.values(balances).forEach((member) => {
    if (member.balance < -0.01) {
      debtors.push({ ...member })
    } else if (member.balance > 0.01) {
      creditors.push({ ...member })
    }
  })

  debtors.sort((a, b) => a.balance - b.balance)
  creditors.sort((a, b) => b.balance - a.balance)

  const debts = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.round(Math.min(-debtors[i].balance, creditors[j].balance) * 100) / 100
    debts.push({
      from: debtors[i],
      to: creditors[j],
      amount,
    })
    debtors[i].balance += amount
    creditors[j].balance -= amount

    if (Math.abs(debtors[i].balance) < 0.01) i++
    if (Math.abs(creditors[j].balance) < 0.01) j++
  }

  return debts
}
