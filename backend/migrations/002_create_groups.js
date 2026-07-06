exports.up = function (knex) {
  return knex.schema.createTable('groups', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.string('name', 100).notNullable()
    table.text('description')
    table.string('emoji', 10)
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    table.timestamp('created_at').defaultTo(knex.fn.now())
  })
}

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('groups')
}
