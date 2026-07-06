const { Resend } = require('resend')

// inviterName/groupName son strings controlados por el usuario; hay que escaparlos
// antes de interpolarlos en el HTML del email para evitar inyección.
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

let resend = null

function getClient() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      return null
    }
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Splitio <onboarding@resend.dev>'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

async function sendGroupInvite({ to, token, inviterName, groupName, groupEmoji }) {
  const client = getClient()
  if (!client) {
    console.warn('RESEND_API_KEY not configured — skipping email to', to)
    return
  }

  const emoji = groupEmoji || '👥'
  const inviteUrl = `${FRONTEND_URL}/invitacion/${token}`
  const safeEmoji = escapeHtml(emoji)
  const safeGroupName = escapeHtml(groupName)
  const safeInviterName = escapeHtml(inviterName)

  const { error } = await client.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${inviterName} te invitó a "${groupName}" ${emoji}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">${safeEmoji} ${safeGroupName}</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          <strong>${safeInviterName}</strong> te invitó a unirte al grupo <strong>${safeGroupName}</strong> en Splitio para compartir gastos.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          Hacé clic para ver el grupo y unirte:
        </p>
        <a href="${inviteUrl}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0;">
          Unirme al grupo
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 24px;">
          Si no esperabas esta invitación, podés ignorar este email.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error(`Failed to send invite to ${to}:`, error)
    throw error
  }
}

async function sendBatchGroupInvites({ invites, inviterName, groupName, groupEmoji }) {
  if (!invites.length) return { sent: 0, failed: 0 }

  const results = await Promise.allSettled(
    invites.map(({ email, token }) =>
      sendGroupInvite({ to: email, token, inviterName, groupName, groupEmoji })
    )
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  if (failed > 0) {
    console.warn(`Group invite emails: ${sent} sent, ${failed} failed`)
  }

  return { sent, failed }
}

async function sendPasswordReset({ to, name, resetUrl }) {
  const client = getClient()
  if (!client) {
    console.warn('RESEND_API_KEY not configured — skipping password reset email to', to)
    return
  }

  const safeName = escapeHtml(name)

  const { error } = await client.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Restablecé tu contraseña de Splitio',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">Restablecer contraseña</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          Hola <strong>${safeName}</strong>, recibimos un pedido para restablecer la contraseña de tu cuenta de Splitio.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          Hacé clic en el botón para elegir una nueva contraseña. El enlace expira en 1 hora.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0;">
          Restablecer contraseña
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 24px;">
          Si no pediste este cambio, podés ignorar este email; tu contraseña seguirá siendo la misma.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error(`Failed to send password reset to ${to}:`, error)
    throw error
  }
}

async function sendGroupSummary({ to, groupName, groupEmoji, pdfBuffer }) {
  const client = getClient()
  if (!client) {
    console.warn('RESEND_API_KEY not configured — skipping summary email')
    return
  }

  const emoji = groupEmoji || '👥'
  const safeEmoji = escapeHtml(emoji)
  const safeGroupName = escapeHtml(groupName)

  const { error } = await client.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Resumen de gastos: ${groupName} ${emoji}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">${safeEmoji} ${safeGroupName}</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          Adjunto encontrarás el resumen de gastos del grupo <strong>${safeGroupName}</strong>.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          Descargá el archivo PDF para ver el desglose completo de gastos, balances y deudas pendientes.
        </p>
        <p style="color: #999; font-size: 13px; margin-top: 24px;">
          Este resumen fue generado desde Splitio.
        </p>
      </div>
    `,
    attachments: [{
      filename: `resumen-${groupName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '-')}.pdf`,
      content: pdfBuffer,
    }],
  })

  if (error) {
    console.error('Failed to send group summary:', error)
    throw error
  }
}

module.exports = { sendGroupInvite, sendBatchGroupInvites, sendGroupSummary, sendPasswordReset }
