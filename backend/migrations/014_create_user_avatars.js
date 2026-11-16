// Los avatares se guardaban en backend/uploads/ (disco local). En hosts con disco
// efímero (ej: Render free) esos archivos se pierden en cada redeploy, reinicio o
// spin-down, así que pasan a vivir en la base. users.avatar sigue guardando la URL
// que consume el front (/api/users/:id/avatar?v=...); los bytes van en esta tabla
// aparte para no inflar cada SELECT de users.
exports.up = async function (knex) {
  await knex.schema.createTable('user_avatars', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE')
    table.binary('data').notNullable()
    table.string('mime_type').notNullable()
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })

  // Los avatares viejos apuntan a archivos en disco que ya no se sirven.
  await knex('users').where('avatar', 'like', '/uploads/%').update({ avatar: null })
}

exports.down = function (knex) {
  return knex.schema.dropTable('user_avatars')
}
