exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('payment_alias', 100)
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('payment_alias')
  })
}
