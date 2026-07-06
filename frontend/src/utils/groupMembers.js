// Devuelve los miembros "efectivos" de un grupo: el usuario global con los
// overrides del grupo aplicados (apodo como name, alias/cbu por-grupo con
// fallback al dato global). `allMembers` es la lista global de usuarios.
export function resolveGroupMembers(group, allMembers) {
  if (!group) return []
  const overrides = group.memberOverrides || {}
  return group.members
    .map((memberId) => {
      const user = allMembers.find((m) => m.id === memberId)
      if (!user) return null
      const o = overrides[memberId] || {}
      return {
        ...user,
        name: o.nickname || user.name,
        payment_alias: o.payment_alias ?? user.payment_alias,
        cbu: o.cbu ?? user.cbu,
        nickname: o.nickname || '',
        realName: user.name,
        isAdmin: String(group.created_by) === String(memberId),
      }
    })
    .filter(Boolean)
}
