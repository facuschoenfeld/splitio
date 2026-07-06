exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    // Guardamos el hash del token (no el token en claro) y su expiración.
    table.string('reset_token_hash', 64).nullable()
    table.timestamp('reset_token_expires').nullable()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('reset_token_hash')
    table.dropColumn('reset_token_expires')
  })
}
