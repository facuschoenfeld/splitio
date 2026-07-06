exports.up = function (knex) {
  return knex.schema.createTable('group_members', (table) => {
    table.uuid('group_id').references('id').inTable('groups').onDelete('CASCADE')
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')
    table.timestamp('joined_at').defaultTo(knex.fn.now())
    table.primary(['group_id', 'user_id'])
  })
}

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('group_members')
}
