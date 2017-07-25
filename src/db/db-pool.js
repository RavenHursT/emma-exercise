import pg from 'pg'
import CONFIG from './db-config.json'

const pool = new pg.Pool(CONFIG)

export function getDbClient() {
  return pool.connect().then(client => client)
}

export default pool