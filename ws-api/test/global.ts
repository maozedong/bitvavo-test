import dotenvSafe from 'dotenv-safe'

dotenvSafe.load({ allowEmptyValues: true })

process.env.WS_PORT = '9032'
process.env.DB_PATH = './test/mocks/.sqlite3'

process.env.LOG_LEVEL = 'TRACE'
process.env.NODE_ENV = 'test'
