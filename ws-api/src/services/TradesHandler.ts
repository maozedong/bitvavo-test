import * as WebSocket from 'ws'
import {
  Service,
  ServiceState,
  WebSocketExtended,
  WebSocketHandler,
} from '../../index'
import * as querystring from 'querystring'
import { $WSBoundary } from './WSBoundary'
import { logger } from '../logger'
import settings from '../settings'
import { $DBBoundary } from './DBBoundary'
import Timer = NodeJS.Timer

interface TradeMessage {
  market: string,
  data: [number, number][]
}

interface Subscription {
  market: string,
  lastTradeTimestamp: number,
  clients: Set<TradeWebSocket>
}

interface TradeWebSocket extends WebSocketExtended {
  subscription: Subscription
}

export interface $TradesHandler {
  tradesHandler: TradesHandler
}

export class TradesHandler implements WebSocketHandler, Service {
  static readonly ROUTE = 'trades'
  private _state: ServiceState = 'stopped'
  private subscriptions: Map<string, Subscription>
  private updateTimer: Timer

  private static send (socket: TradeWebSocket, msg: TradeMessage) {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg))
  }

  constructor (private services: $WSBoundary & $DBBoundary) {}

  async start () {
    if (this._state === 'running') return
    this._state = 'starting'
    this.subscriptions = new Map()
    this.updateTimer = setInterval(() => this.getAndSendUpdates(),
      settings.updateInterval)

    this.services.wsBoundary.setHandler(TradesHandler.ROUTE, this)

    this._state = 'running'
    logger.debug(`${this.constructor.name} started`)
  }

  async stop () {
    if (this._state === 'stopped') return
    clearInterval(this.updateTimer)
    this._state = 'stopped'
    logger.debug(`${this.constructor.name} stopped`)
  }

  getState () {
    return this._state
  }

  async initSocket (socket: TradeWebSocket, query: string) {
    const { market, start } = this.getParams(query)
    let subscription = this.subscriptions.get(market)
    if (!subscription) {
      subscription = await this.createSubscription(market)
      this.addSubscription(market, subscription)
    }
    socket.subscription = subscription
    subscription.clients.add(socket)
    const trades = await this.services.dbBoundary.getTrades(market, parseInt(start, 10))
    const data = trades.map(t => ([t.timestamp, t.price])) as [number, number][]
    TradesHandler.send(socket, { market, data })
  }

  async finalizeSocket (socket: TradeWebSocket) {
    const { subscription } = socket
    subscription.clients.delete(socket)
    // maybe deletion is not needed at all, check that in future at some point :)
    if (!subscription.clients.size) {
      this.subscriptions.delete(subscription.market)
      logger.debug(
        `${this.constructor.name}:: subscription '${subscription.market}' removed. Currently ${this.subscriptions.size} subscriptions`)
    }
  }

  private async createSubscription (market): Promise<Subscription> {
    const lastTrade = await this.services.dbBoundary.getLastTrade(market)

    return {
      market: market,
      lastTradeTimestamp: lastTrade.timestamp,
      clients: new Set(),
    }
  }

  private getParams (query: string) {
    const parsedQuery = querystring.parse(query)
    const { market, start } = parsedQuery
    return { market, start } as { market: string, start: string | undefined }
  }

  private addSubscription (market: string, subscription: Subscription) {
    this.subscriptions.set(market, subscription)
    logger.debug(
      `${this.constructor.name}:: subscription '${market}' added. Currently ${this.subscriptions.size} subscriptions`)
  }

  private async getAndSendUpdates () {
    for (const subscription of this.subscriptions.values()) {
      const { market, clients, lastTradeTimestamp } = subscription
      const trades = await this.services.dbBoundary.getTradesSince(market, lastTradeTimestamp)
      if (!trades.length) continue
      subscription.lastTradeTimestamp = trades[trades.length - 1].timestamp
      const data = trades.map(t => ([t.timestamp, t.price])) as [number, number][]
      for (const client of clients) {
        TradesHandler.send(client, { market, data })
      }
    }
  }
}
