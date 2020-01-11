const settings = {
  shutdownTimeout: 3000,
  env: process.env.NODE_ENV,
  logLevel: process.env.LOG_LEVEL,
  updateInterval: 1000,
  ws: {
    port: parseInt(process.env.WS_PORT, 10),
    heartbeatInterval: 30000,
  },
  db: {
    filename: process.env.DB_PATH,
  },
}

export default settings
export type AppSettings = typeof settings
export type WSSettings = typeof settings.ws
export type DBSettings = typeof settings.db
