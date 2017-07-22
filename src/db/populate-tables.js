import pgPool from './db-pool'
import fs from 'fs'
import {from as copyFrom} from 'pg-copy-streams'

const stream = pgPool.stream(copyFrom(`COPY profiles FROM STDIN text`))
const fileStream = fs.createReadStream(`../../soc-pkoc-profiles.txt`)

fileStream.on('error', (err) => { throw(err) })
stream.subscribe(console.log, err => {throw err}, () => {
  console.log('done')
  process.exit()
})
fileStream.pipe(stream)