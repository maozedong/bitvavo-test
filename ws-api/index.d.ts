import * as WebSocket from 'ws'

export interface WebSocketExtended extends WebSocket {
  isAlive: boolean,

  init (): void

  finalize (): void
}

export interface WebSocketHandler {
  initSocket (socket: WebSocketExtended, query: string): void

  finalizeSocket (socket: WebSocketExtended): void
}

export type ServiceState = 'stopped' | 'starting' | 'running' | 'stopping'

export interface Service {
  start (): Promise<void>

  stop (): Promise<void>

  getState (): ServiceState
}
