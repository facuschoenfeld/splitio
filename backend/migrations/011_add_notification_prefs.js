exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.boolean('notify_group_invites').notNullable().defaultTo(true)
    table.boolean('notify_group_summaries').notNullable().defaultTo(true)
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('notify_group_invites')
    table.dropColumn('notify_group_summaries')
  })
}
