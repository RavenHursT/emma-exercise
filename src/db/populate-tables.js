import Pool, {getDbClient} from './db-pool'
import fs from 'fs'
import profilesConf from './profiles.table.json'
import {from as copyFrom} from 'pg-copy-streams'
import RxNode from 'rx-node'

export function splitBufferByLine ({ buffer }, b) {
  const splitted = buffer.concat(b).split(`\n`)
  const rest = splitted.pop()
  return { buffer: rest, items: splitted }
}

const stream = RxNode
  .fromReadableStream(fs.createReadStream('./test.txt'))
  .scan(
    splitBufferByLine,
    { buffer: ``, items: [] }
  )
  // Each item here is a pair { buffer: string, items: string[] }
  // such that buffer contains the remaining input text that has no newline
  // and items contains the lines that have been produced by the last buffer
  .concatMap(({ items }) => items)

stream.map(row => {
  console.log(row[row.length - 1] === `\t` ? `Tab` : row[row.length - 1])
  return row
})
  .subscribe()



// getDbClient().then(client => {
//   const profilesColumns = Object.keys(profilesConf.columns).join(`,`)
//   const q = `COPY profiles (${profilesColumns}) FROM STDIN WITH NULL as 'null'`
//   console.log(q)
//   const stream = client.query(copyFrom(q))
//   const fileStream = fs.createReadStream(`./test.txt`)
//   fileStream.on('error', (err) => { throw(err) })
//   stream.on(`error`, (err) => {
//     console.error(`Error in query stream =>`)
//     throw(err)
//   })
//   stream.on(`end`, () => {
//     console.log('done')
//     process.exit()
//   })
//   fileStream.pipe(stream)
// })
