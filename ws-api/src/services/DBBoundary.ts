import { Database } from 'sqlite3'
import { DBSettings } from '../settings'
import {
  Service,
  ServiceState,
} from '../../index'
import { logger } from '../logger'

export interface Trade {
  id: string,
  market: string,
  timestamp: number,
  amount: number,
  price: number,
  side: 'sell' | 'buy'
}

export interface $DBBoundary {
  dbBoundary: DBBoundary
}

export class DBBoundary implements Service {
  _db: Database
  private _state: ServiceState = 'stopped'
  private settings: DBSettings

  constructor (settings: DBSettings) {
    this.settings = settings
  }

  async start () {
    return new Promise<void>((resolve, reject) => {
      if (this._state === 'running') return
      this._state = 'starting'
      this._db = new Database(this.settings.filename, (e) => {
        if (e) {
          reject(e)
        } else {
          this._state = 'running'
          resolve()
        }
      })
      logger.info(
        `${this.constructor.name} connected to ${this.settings.filename}`)
    })
  }

  async stop () {
    return new Promise<void>((resolve, reject) => {
      if (this._state === 'stopped') return
      this._state = 'stopping'
      this._db.close(e => {
        if (e) {
          reject(e)
        } else {
          this._state = 'stopped'
          logger.info(`server disconnected`)
          resolve()
        }
      })
    })
  }

  getState () {
    return this._state
  }

  getTrades (market: string, start: number): Promise<Trade[]> {
    return new Promise((resolve, reject) => {
      this._db.all(
        `SELECT * FROM trades WHERE market = ? AND timestamp > ?`,
        [market, start],
        (e, data) => {
          if (e) return reject(e)
          resolve(data)
        },
      )
    })
  }

  getTradesSince (market: string, timestamp: number): Promise<Trade[]> {
    return new Promise((resolve, reject) => {
      this._db.all(
        `SELECT id, timestamp, price FROM trades WHERE market = ? AND timestamp > ?`,
        [market, timestamp],
        (e, data) => {
          if (e) return reject(e)
          resolve(data)
        },
      )
    })
  }

  getLastTrade (market: string): Promise<Trade> {
    return new Promise((resolve, reject) => {
      this._db.get(
        `SELECT id, timestamp, price FROM trades WHERE market = ? ORDER BY timestamp desc LIMIT 1`,
        [market],
        (e, data) => {
          if (e) return reject(e)
          resolve(data)
        },
      )
    })
  }
}
