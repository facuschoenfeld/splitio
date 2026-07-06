exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('status', 20).notNullable().defaultTo('active')
    table.string('password', 255).nullable().alter()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('status')
    table.string('password', 255).notNullable().alter()
  })
}
