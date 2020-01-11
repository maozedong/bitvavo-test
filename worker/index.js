require('dotenv-safe').config();
const _bitvavo = require('bitvavo');
const sqlite3 = require('sqlite3');
const {promisify} = require('util');

(async () => {
    const db = await getDB(process.env.DB_PATH);
    console.log(`sqlite connected to ${process.env.DB_PATH}`);
    const bitvavo = await getBitvavo();
    console.log(`bitvavo SDK ready`);

    await bitvavo.websocket.subscriptionTrades(process.env.MARKET, async (res) => {
        try {
            if(res.event !== 'trade') return;

            await handleTrade(res, db);
            console.log(`trade written`)
        } catch (e) {
            console.error(e);
        }
    });
    console.log(`listening to ${process.env.MARKET} trades`);
})();

async function getDB(dbFile) {
    const db = new sqlite3.Database(dbFile);
    db.on('error', (e) => {
        console.error(e);
        process.exit(1);
    });
    db.runAsync = promisify(db.run);

    await db.runAsync(`CREATE TABLE IF NOT EXISTS trades (
      id TEXT,
      timestamp INTEGER NOT NULL,
      market TEXT NOT NULL,
      amount REAL,
      price REAL,
      side TEXT
      )`);

    await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_prices_market ON trades (market)`);
    await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_prices_timestamp ON trades (timestamp)`);

    return db;
}

async function getBitvavo() {
    return _bitvavo().options({})
}

async function handleTrade(trade, db) {
    const {id, timestamp, market, amount, price, side} = trade;

    await db.runAsync(
        `INSERT INTO trades
            (id, timestamp, market, amount, price, side )
        VALUES
            (?, ?, ?, ?, ?, ?)`,
        [id, timestamp, market, amount, price, side]
    );
}
