import pgtools from 'pgtools'
import CONFIG from './db-config.json'

const dropProm = pgtools.dropdb(CONFIG, CONFIG.databaseName)

dropProm.then(createDb).catch(err => {
  if (!~err.message.indexOf(`does not exist`)) {
    throw(err)
  } else {
    createDb()
  }
})

function createDb() {
  pgtools.createdb(CONFIG, CONFIG.databaseName)
    .then((res) => {
      console.log(res)
    })
    .catch(err => {throw(err)})
}

