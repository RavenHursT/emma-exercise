import pgPool from './db-pool'
import profileTableConfig from './profiles.table.json'
const {query} = pgPool

function buildCreateTableQuery (tableConfig) {
  const {columns} = tableConfig
  const itemsStr = Object.keys(columns).map(col => {
    const colDef = columns[col]
    const constraintStr = colDef.constraint ? ` ${colDef.constraint}` : ``
    return `${col} ${colDef.type}${constraintStr}`
  }).join(`, `)
  return `CREATE TABLE ${tableConfig.name}(${itemsStr});`
}

query(buildCreateTableQuery(profileTableConfig))
  .subscribe(
    console.log,
    err => {
      throw(err)
    }, end => {
      console.log(`Created table => `, end)
      // pg-rxjs doesn't give us access to Pool.end(), so unfortunately, have to kill it.
      process.exit()
    }
  )
