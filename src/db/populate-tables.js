import Pool, {getDbClient} from './db-pool'
import fs from 'fs'
import profilesConf from './profiles.table.json'
import {from as copyFrom} from 'pg-copy-streams'
import RxNode from 'rx-node'

import yargs from 'yargs'

yargs.usage(`$0 [-n{number of rows}] [path to files]`)
  .example(
    `$0`,
    `Populate DB w/ entire dataset from .txt files in project root [default]`
  )
  .example(
    `$0 -n100 ~/Downloads/`,
    `Take first 100 profiles and relationships and populate the DB from files in custom path`
  )
  .options({
    n: {
      alias: `limit`,
      number: true,
      description: `Limit the sample to process`
    }
  })
  .alias(`h`, `help`)
  .help()
  .argv

const profileColumnsLen = Object.keys(profilesConf.columns).length

export function splitBufferByLine ({ buffer }, b) {
  const splitted = buffer.concat(b).split(`\n`)
  const rest = splitted.pop()
  return { buffer: rest, items: splitted }
}

const dataFilesPath = yargs.argv._[0] || `./`

function importRelationships (client) {

}

getDbClient().then(client => {
  let line = 0
  const profilesColumns = Object.keys(profilesConf.columns).join(`,`)
  const q = `COPY profiles (${profilesColumns}) FROM STDIN WITH NULL as 'null'`
  console.log(q)
  const queryStream = client.query(copyFrom(q))
  queryStream.on(`error`, (err) => {
    console.error(`Error in query stream => ${err.message}`)
    console.error(err.stack)
    process.exit()
  })

  const reactiveQueryStream = RxNode.fromReadableStream(queryStream)
    .scan(
      splitBufferByLine,
      { buffer: ``, items: [] }
    )
    .concatMap(({ items }) => items)
    .map((row, i) => {
      const fields = row.split(`\t`)
      if(fields.length > 1 && fields.length < 59) {
        console.dir(row, {colors:true, depth:3})
        console.error(`WTF?? ${i}:${fields.length}`)
      }
      return row
    })
    .subscribe((row, i) => {

    }, console.error, () => {console.log(`Reactive Stream done.`)})

  queryStream.on(`end`, () => {
    console.log(`Done.`)
    process.exit()
  })
  const fileStream = RxNode
    .fromReadableStream(fs.createReadStream(`${dataFilesPath}profiles.txt`))

    .scan(
      splitBufferByLine,
      { buffer: ``, items: [] }
    )
    // Each item here is a pair { buffer: string, items: string[] }
    // such that buffer contains the remaining input text that has no newline
    // and items contains the lines that have been produced by the last buffer
    .concatMap(({ items }) => items)
    .take(yargs.argv.limit === 0 || yargs.argv.limit || Infinity)
    .map((row) => {
      if (row.indexOf(`\\.`) > 0) {
        row = row.replace(/\\\./g, `\\\\.`)
      }
      let fields = row.split(`\t`)
      // console.log(`orig fields length => ${fields.length}`)
      if (fields.length === profileColumnsLen) {
        return row
      }
      fields = fields.slice(0, profileColumnsLen - 1)

      if (fields.length < profileColumnsLen)  {
        fields = fields.concat(new Array(profileColumnsLen - fields.length).fill('null'))
      }
      if (fields.length !== profileColumnsLen || !fields[profileColumnsLen - 1]) {
        console.error(`length mismatch! ${fields.join(`\t`)}`)
        process.exit()
      }
      // console.log(`${i}: ${fields.length}`)
      return `${fields.join(`\t`)}\n`
    })

  RxNode.writeToStream(fileStream, queryStream, `utf8`)
})
