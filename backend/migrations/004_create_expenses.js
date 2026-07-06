exports.up = function (knex) {
  return knex.schema.createTable('expenses', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.uuid('group_id').references('id').inTable('groups').onDelete('CASCADE')
    table.string('description', 255).notNullable()
    table.decimal('amount', 12, 2).notNullable()
    table.uuid('paid_by').references('id').inTable('users')
    table.string('category', 50).notNullable()
    table.date('date').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
  })
}

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('expenses')
}
