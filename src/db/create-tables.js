import pool, {getDbClient} from './db-pool'
import profileTableConfig from './profiles.table.json'

function buildCreateTableQuery (tableConfig) {
  const {columns} = tableConfig
  const itemsStr = Object.keys(columns).map(col => {
    const colDef = columns[col]
    const notNullStr = colDef.notNull ? ` NOT NULL` : ``
    const constraintStr = colDef.constraint ? ` ${colDef.constraint}` : ``
    return `${col} ${colDef.type}${notNullStr}${constraintStr}`
  }).join(`, `)
  return `CREATE TABLE ${tableConfig.name}(${itemsStr});`
}

function runQuery (q, client) {
  return client.query(q)
    .then((res) => {
      client.release()
      console.info(`Successfully ran query => ${q}`)
      return res
    })
    .catch((err) => {
      client.release()
      console.error(`Error running query => ${q}`)
      throw (err)
    })
}

function createProfilesTable() {
  return getDbClient().then(client => {
    return runQuery(buildCreateTableQuery(profileTableConfig), client)
  })
}

function createEdgesTable() {
  const q = `
    CREATE TABLE edges (
      a INTEGER NOT NULL REFERENCES profiles(user_id) 
        ON UPDATE CASCADE ON DELETE CASCADE, 
      b INTEGER NOT NULL REFERENCES profiles(user_id) 
        ON UPDATE CASCADE ON DELETE CASCADE, 
      PRIMARY KEY (a, b)
    );
  `

  return getDbClient().then(client => {
    return runQuery(q, client)
  })
}

function buildIndexes() {
  const aIndx = getDbClient().then(client => {
    const q = `CREATE INDEX a_idx ON edges (a);`
    return runQuery(q, client)
  })
  const bIndx = getDbClient().then(client => {
    const q = `CREATE INDEX b_idx ON edges (b);`
    return runQuery(q, client)
  })
  const uniqueIndx = getDbClient().then(client => {
    const q = `
      CREATE UNIQUE INDEX pair_unique_idx
      ON edges (LEAST(a, b), GREATEST(a, b))
    `
    return runQuery(q, client)
  })

  return Promise.all([aIndx, bIndx, uniqueIndx])
}

createProfilesTable()
  .then(() => createEdgesTable())
  .then(() => buildIndexes())
  .then(() => {
    endPool()
  }).catch(err => {
    endPool()
    throw(err)
  })

function endPool() {
  pool.end().then(() => console.log('Pool has ended'))
    .catch(err => {
      console.error(`Error on ending pool`)
      throw(err)
    })
}
