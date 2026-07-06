exports.up = function (knex) {
  return knex.schema.createTable('group_invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE')
    // email seteado ⇒ invitación personal (single-use); null ⇒ código compartible reusable.
    table.string('email')
    // Token en claro: permite re-mostrar el código/enlace compartible y unifica el lookup.
    // Baja sensibilidad, mitigado con expiración + revocación.
    table.string('token').notNullable().unique()
    table.uuid('invited_by').references('id').inTable('users').onDelete('SET NULL')
    table.timestamp('expires_at')
    table.timestamp('accepted_at')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.index('group_id')
  })
}

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('group_invitations')
}
