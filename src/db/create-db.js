import pgtools from 'pgtools'
import CONFIG from './db-config.json'

// Have to remove database from config or else `pgtools` throws error
// https://github.com/olalonde/pgtools/issues/17
const noDbConfig = Object.assign({}, CONFIG, {
  database: undefined
})

pgtools.dropdb(noDbConfig, CONFIG.database).then(createDb)
  .catch(handleDropErrors)

function handleDropErrors (err) {
  if (err.message.indexOf(`does not exist`) === -1) {
    throw(err)
  } else {
    createDb()
  }
}

function endClient (client) {
  client.end((err) => {
    console.log('Client disconnected')
    if (err) {
      console.error('Error during client disconnection')
      throw(err)
    }
  })
}

function createDb() {
  pgtools.createdb(noDbConfig, CONFIG.database)
    .then((res) => {
      console.log(`Created database ${CONFIG.database} => `, res.res)
      endClient(res.client)
    })
    .catch(err => {
      throw(err)
    })
}
