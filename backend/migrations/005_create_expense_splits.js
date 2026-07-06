exports.up = function (knex) {
  return knex.schema.createTable('expense_splits', (table) => {
    table.uuid('expense_id').references('id').inTable('expenses').onDelete('CASCADE')
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')
    table.primary(['expense_id', 'user_id'])
  })
}

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('expense_splits')
}
