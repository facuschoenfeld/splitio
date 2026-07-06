exports.up = function (knex) {
  return knex.schema.alterTable('group_members', (table) => {
    table.string('nickname', 100)
    table.string('payment_alias', 100)
    table.string('cbu', 22)
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('group_members', (table) => {
    table.dropColumn('nickname')
    table.dropColumn('payment_alias')
    table.dropColumn('cbu')
  })
}
