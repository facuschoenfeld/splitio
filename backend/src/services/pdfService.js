const PDFDocument = require('pdfkit')

const formatCurrency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
}).format

const C = {
  primary: '#464BD8',
  primaryLight: '#DDDCFE',
  accent: '#2AEFC8',
  accentDark: '#0EAE8F',
  dark: '#151B28',
  text: '#2A3249',
  muted: '#5A6384',
  success: '#0EAE8F',
  successBg: '#EAFEF8',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  headerBg: '#EEEDFF',
  rowAlt: '#F5F7FA',
  border: '#D3D8E5',
  white: '#ffffff',
}

const PAGE_LEFT = 40
const PAGE_RIGHT = 555
const PAGE_WIDTH = PAGE_RIGHT - PAGE_LEFT

function generateGroupSummaryPDF({ group, members, expenses, balances, debts }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const chunks = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const memberMap = {}
    members.forEach((m) => { memberMap[m.id] = m.name })

    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

    drawHeader(doc, group)
    drawStatCards(doc, total, expenses.length, members.length)
    drawMembersTable(doc, members, balances)
    drawExpensesTable(doc, expenses, memberMap)
    drawDebtsSection(doc, debts)
    drawFooter(doc)

    doc.end()
  })
}

function drawHeader(doc, group) {
  const boxY = 40
  const boxH = 70
  doc.save()
  doc.roundedRect(PAGE_LEFT, boxY, PAGE_WIDTH, boxH, 10).fill(C.primary)
  doc.fontSize(24).fillColor(C.accent)
    .text(group.name, PAGE_LEFT, boxY + 15, { width: PAGE_WIDTH, align: 'center' })
  doc.fontSize(11).fillColor(C.white)
    .text(group.description || '', PAGE_LEFT, boxY + 44, { width: PAGE_WIDTH, align: 'center' })
  doc.restore()

  doc.y = boxY + boxH + 10
  doc.fontSize(9).fillColor(C.muted)
    .text(
      `Resumen generado el ${new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      PAGE_LEFT, doc.y, { width: PAGE_WIDTH, align: 'center' }
    )
  doc.y += 20
}

function drawStatCards(doc, total, expenseCount, memberCount) {
  const cardW = (PAGE_WIDTH - 30) / 4
  const cardH = 52
  const startY = doc.y
  const stats = [
    { label: 'Total gastado', value: formatCurrency(total) },
    { label: 'Gastos', value: `${expenseCount}` },
    { label: 'Miembros', value: `${memberCount}` },
    { label: 'Promedio', value: formatCurrency(expenseCount ? total / expenseCount : 0) },
  ]

  stats.forEach((stat, i) => {
    const x = PAGE_LEFT + i * (cardW + 10)
    doc.save()
    doc.roundedRect(x, startY, cardW, cardH, 6).fill(C.headerBg)
    doc.fontSize(8).fillColor(C.muted)
      .text(stat.label, x, startY + 10, { width: cardW, align: 'center' })
    doc.fontSize(12).fillColor(C.dark)
      .text(stat.value, x, startY + 26, { width: cardW, align: 'center' })
    doc.restore()
  })

  doc.y = startY + cardH + 20
}

function drawMembersTable(doc, members, balances) {
  sectionTitle(doc, 'Miembros y Balances')

  const cols = [
    { label: 'Nombre', x: PAGE_LEFT, w: 180, align: 'left' },
    { label: 'Email', x: PAGE_LEFT + 180, w: 195, align: 'left' },
    { label: 'Balance', x: PAGE_LEFT + 375, w: PAGE_WIDTH - 375, align: 'right' },
  ]
  const rowH = 22

  drawTableHeader(doc, cols, rowH)

  members.forEach((m, i) => {
    checkPageBreak(doc, rowH + 5)
    const y = doc.y

    if (i % 2 === 0) {
      doc.save()
      doc.rect(PAGE_LEFT, y, PAGE_WIDTH, rowH).fill(C.rowAlt)
      doc.restore()
    }

    const bal = balances[m.id]?.balance || 0

    doc.fontSize(9).fillColor(C.text)
      .text(m.name, cols[0].x + 8, y + 6, { width: cols[0].w - 8 })
    doc.fillColor(C.muted)
      .text(m.email || '—', cols[1].x + 4, y + 6, { width: cols[1].w - 4 })

    const settled = bal === 0
    const balText = (bal > 0 ? '+' : '') + formatCurrency(bal)
    const balColor = settled ? C.muted : bal > 0 ? C.success : C.danger
    const pillBg = settled ? C.rowAlt : bal > 0 ? C.successBg : C.dangerBg
    const pillW = doc.widthOfString(balText, { fontSize: 9 }) + 14
    const pillX = cols[2].x + cols[2].w - pillW - 4
    doc.save()
    doc.roundedRect(pillX, y + 3, pillW, 16, 8).fill(pillBg)
    doc.fontSize(9).fillColor(balColor)
      .text(balText, pillX, y + 6, { width: pillW, align: 'center' })
    doc.restore()

    doc.y = y + rowH
  })

  drawTableBottom(doc)
  doc.y += 18
}

function drawExpensesTable(doc, expenses, memberMap) {
  sectionTitle(doc, 'Desglose de Gastos')

  const cols = [
    { label: 'Fecha', x: PAGE_LEFT, w: 70, align: 'center' },
    { label: 'Descripcion', x: PAGE_LEFT + 70, w: 175, align: 'left' },
    { label: 'Categoria', x: PAGE_LEFT + 245, w: 75, align: 'center' },
    { label: 'Pago', x: PAGE_LEFT + 320, w: 90, align: 'left' },
    { label: 'Monto', x: PAGE_LEFT + 410, w: PAGE_WIDTH - 410, align: 'right' },
  ]
  const rowH = 22

  drawTableHeader(doc, cols, rowH)

  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))

  sorted.forEach((expense, i) => {
    checkPageBreak(doc, rowH + 5)
    const y = doc.y

    if (i % 2 === 0) {
      doc.save()
      doc.rect(PAGE_LEFT, y, PAGE_WIDTH, rowH).fill(C.rowAlt)
      doc.restore()
    }

    const date = new Date(expense.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    const desc = expense.description.length > 28 ? expense.description.slice(0, 27) + '...' : expense.description
    const paidByName = memberMap[expense.paid_by] || '?'
    const shortPaid = paidByName.length > 13 ? paidByName.slice(0, 12) + '.' : paidByName
    const cat = (expense.category || '').charAt(0).toUpperCase() + (expense.category || '').slice(1)

    doc.fontSize(9).fillColor(C.muted)
      .text(date, cols[0].x, y + 6, { width: cols[0].w, align: 'center' })
    doc.fillColor(C.text)
      .text(desc, cols[1].x + 6, y + 6, { width: cols[1].w - 6 })
    doc.fillColor(C.muted)
      .text(cat, cols[2].x, y + 6, { width: cols[2].w, align: 'center' })
    doc.fillColor(C.text)
      .text(shortPaid, cols[3].x + 6, y + 6, { width: cols[3].w - 6 })
    doc.fillColor(C.dark).font('Helvetica-Bold')
      .text(formatCurrency(parseFloat(expense.amount)), cols[4].x, y + 6, { width: cols[4].w - 6, align: 'right' })
    doc.font('Helvetica')

    doc.y = y + rowH
  })

  const totalAmount = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)
  const footerY = doc.y
  doc.save()
  doc.rect(PAGE_LEFT, footerY, PAGE_WIDTH, rowH).fill(C.primaryLight)
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark)
    .text('TOTAL', cols[1].x + 6, footerY + 6, { width: cols[1].w })
  doc.text(formatCurrency(totalAmount), cols[4].x, footerY + 6, { width: cols[4].w - 6, align: 'right' })
  doc.font('Helvetica')
  doc.restore()
  doc.y = footerY + rowH

  drawTableBottom(doc)
  doc.y += 18
}

function drawDebtsSection(doc, debts) {
  if (!debts.length) return

  checkPageBreak(doc, 80)
  sectionTitle(doc, 'Deudas Pendientes')

  const rowH = 30
  const colFrom = { x: PAGE_LEFT, w: 150 }
  const colAmount = { x: PAGE_LEFT + 150, w: PAGE_WIDTH - 300 }
  const colTo = { x: PAGE_LEFT + PAGE_WIDTH - 150, w: 150 }

  debts.forEach((debt, i) => {
    checkPageBreak(doc, rowH + 6)
    const y = doc.y
    const midY = y + rowH / 2

    doc.save()
    doc.roundedRect(PAGE_LEFT, y, PAGE_WIDTH, rowH, 6)
      .fillAndStroke(i % 2 === 0 ? C.rowAlt : C.white, C.border)
    doc.restore()

    doc.save()
    const fromPillW = 130
    const fromPillX = colFrom.x + (colFrom.w - fromPillW) / 2
    doc.roundedRect(fromPillX, midY - 10, fromPillW, 20, 10).fill(C.dangerBg)
    doc.fontSize(10).fillColor(C.danger)
      .text(debt.from.name, fromPillX, midY - 6, { width: fromPillW, align: 'center' })
    doc.restore()

    doc.save()
    doc.fontSize(9).fillColor(C.muted)
      .text('debe', colAmount.x, midY - 6, { width: (colAmount.w - 10) / 2, align: 'right' })
    doc.fontSize(12).font('Helvetica-Bold').fillColor(C.primary)
      .text(formatCurrency(debt.amount), colAmount.x + (colAmount.w + 10) / 2, midY - 7, { width: (colAmount.w - 10) / 2, align: 'left' })
    doc.font('Helvetica')
    doc.restore()

    doc.save()
    const toPillW = 130
    const toPillX = colTo.x + (colTo.w - toPillW) / 2
    doc.roundedRect(toPillX, midY - 10, toPillW, 20, 10).fill(C.successBg)
    doc.fontSize(10).fillColor(C.success)
      .text(debt.to.name, toPillX, midY - 6, { width: toPillW, align: 'center' })
    doc.restore()

    doc.y = y + rowH + 4
  })
}

function drawFooter(doc) {
  doc.y += 20
  doc.save()
  doc.moveTo(PAGE_LEFT, doc.y).lineTo(PAGE_RIGHT, doc.y)
    .strokeColor(C.border).lineWidth(0.5).stroke()
  doc.fontSize(8).fillColor(C.muted)
    .text('Splitio', PAGE_LEFT, doc.y + 8, { width: PAGE_WIDTH, align: 'center' })
  doc.restore()
}

function sectionTitle(doc, title) {
  const y = doc.y
  doc.save()
  doc.roundedRect(PAGE_LEFT, y, PAGE_WIDTH, 26, 5).fill(C.primary)
  doc.fontSize(11).fillColor(C.white)
    .text(title, PAGE_LEFT + 12, y + 8, { width: PAGE_WIDTH - 24 })
  doc.restore()
  doc.y = y + 30
}

function drawTableHeader(doc, cols, rowH) {
  const y = doc.y
  doc.save()
  doc.rect(PAGE_LEFT, y, PAGE_WIDTH, rowH).fill(C.headerBg)
  doc.fontSize(8).font('Helvetica-Bold').fillColor(C.primary)
  cols.forEach((col) => {
    doc.text(col.label, col.x + (col.align === 'left' ? 6 : 0), y + 7, {
      width: col.w - (col.align === 'right' ? 6 : 0),
      align: col.align,
    })
  })
  doc.font('Helvetica')
  doc.restore()
  doc.y = y + rowH
}

function drawTableBottom(doc) {
  doc.save()
  doc.moveTo(PAGE_LEFT, doc.y).lineTo(PAGE_RIGHT, doc.y)
    .strokeColor(C.border).lineWidth(0.5).stroke()
  doc.restore()
}

function checkPageBreak(doc, needed) {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage()
    doc.y = 40
  }
}

module.exports = { generateGroupSummaryPDF }
