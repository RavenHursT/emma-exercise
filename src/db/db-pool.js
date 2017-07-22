import pg from 'pg-rxjs'
import CONFIG from './db-config.json'

const connectionURI = buildConnStr(CONFIG)
console.log(`connectionURI = > `, connectionURI)

function buildConnStr (config) {
  const userStr = `${config.user ? config.user : ``}`
  const passStr = `${config.password ? `:${config.password}` : ``}`
  return `postgres://${userStr}${passStr}@${config.host}/${config.databaseName}`
}

export default pg.Pool(connectionURI, {debug: false})