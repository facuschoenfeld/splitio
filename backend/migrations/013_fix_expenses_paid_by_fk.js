// La FK expenses.paid_by se creó sin ON DELETE (migración 004), así que PostgreSQL
// aplicaba NO ACTION: borrar un usuario que pagó algún gasto fallaba con violación
// de FK. Es la única FK del esquema sin política explícita — el resto usa CASCADE
// para pertenencia y SET NULL para autoría. Alineamos paid_by con created_by e
// invited_by: el gasto sobrevive al borrado del usuario y conserva el historial.
exports.up = function (knex) {
  return knex.schema.alterTable('expenses', (table) => {
    table.dropForeign('paid_by')
    table.foreign('paid_by').references('id').inTable('users').onDelete('SET NULL')
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('expenses', (table) => {
    table.dropForeign('paid_by')
    // Sin onDelete: vuelve al NO ACTION implícito de la migración 004.
    table.foreign('paid_by').references('id').inTable('users')
  })
}
