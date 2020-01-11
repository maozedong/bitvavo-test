require('dotenv-safe').config()

const { promisify } = require('util')
const sqlite3 = require('sqlite3')
const fastify = require('fastify')
const cors = require('fastify-cors');

(async () => {
  const db = await getDB(process.env.DB_PATH)
  console.log(`sqlite3 connected to ${process.env.DB_PATH}`)
  const app = fastify()
  app.register(cors, { origin: true })

  app.get('/trade/:market', async (req, rep) => {
    // console.log(`new request params: ${req.raw}`)
    const { market } = req.params
    const { start, end } = req.query
    const dbResponse = await db.allAsync(
      `SELECT timestamp, price FROM trades WHERE market = ? AND timestamp > ? AND timestamp < ?`,
      [market, start, end],
    )

    return {
      market,
      data: dbResponse.map(({ timestamp, price }) => [timestamp, price]),
    }
  })

  try {
    await app.listen(process.env.PORT)
    console.log(`app is listening on port ${process.env.PORT}`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()

async function getDB (dbFile) {
  const db = new sqlite3.Database(dbFile)
  db.on('error', (e) => {
    console.error(e)
    process.exit(1)
  })
  db.allAsync = promisify(db.all)

  return db
}
