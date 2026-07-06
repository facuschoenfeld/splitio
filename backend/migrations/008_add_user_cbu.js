exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('cbu', 22)
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('cbu')
  })
}
