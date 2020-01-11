import * as WebSocket from 'ws'
import { WSSettings } from '../settings'
import * as http from 'http'
import url from 'url'
import { Service, ServiceState, WebSocketExtended, WebSocketHandler } from '../../index'
import { noop } from 'lodash'
import { logger } from '../logger'

export interface $WSBoundary {
  wsBoundary: WSBoundary
}

export class WSBoundary implements Service {
  server: WebSocket.Server
  private _state: ServiceState = 'stopped'
  private _handlers: Map<string, WebSocketHandler>
  private _pingTimerId
  private settings: WSSettings

  constructor (settings: WSSettings) {
    this.settings = settings
    this._handlers = new Map()
  }

  async start () {
    if (this._state === 'running') return
    this._state = 'starting'
    this.server = new WebSocket.Server({
      port: this.settings.port,
      clientTracking: true,
    })
    this.server.on('connection', this.connectionHandler)

    this._pingTimerId = setInterval(() => this.checkClients(), this.settings.heartbeatInterval)
    this._state = 'running'
    logger.info(`${this.constructor.name} started on port ${this.settings.port}`)
  }

  async stop () {
    if (this._state === 'stopped') return
    this._state = 'stopping'
    clearInterval(this._pingTimerId)
    this.server.close()
    this._state = 'stopped'
    logger.info(`server disconnected`)
  }

  public setHandler (route: string, handler: WebSocketHandler) {
    this._handlers.set(route, handler)
    logger.debug(`handler '${handler.constructor.name}' for route '${route}' set`)
  }

  public connectionHandler = async (socket: WebSocketExtended, req: http.IncomingMessage) => {
    const parsedUrl = url.parse(req.url)
    const route = parsedUrl.pathname.replace(/^\//, '')
    const handler = this._handlers.get(route)
    if (!handler) return socket.terminate()

    logger.debug(`client connected to "${route}" with params "${parsedUrl.query}". Currently ${this.server.clients.size} clients`)

    Object.assign(socket, {
      isAlive: true,
      init: () => handler.initSocket(socket, parsedUrl.query),
      finalize: () => handler.finalizeSocket(socket),
    })
    socket.on('pong', () => socket.isAlive = true)
    socket.on('close', () => this.onWSClose(socket))
    socket.on('error', async (error) => {
      logger.error(error)
      await this.onWSClose(socket)
      socket.terminate()
    })
    socket.init()
  }

  public async onWSClose (socket: WebSocketExtended) {
    logger.debug(`client disconnected. Currently ${this.server.clients.size} clients`)
    return socket.finalize()
  }

  getState () {
    return this._state
  }

  private async checkClients () {
    this.server.clients.forEach(async (socket: WebSocketExtended) => {
      if (!socket.isAlive) {
        await this.onWSClose(socket)
        return socket.terminate()
      }
      socket.isAlive = false
      socket.ping(noop)
    })
  }
}
