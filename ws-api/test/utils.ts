import WebSocket from 'ws'
import settings from '../src/settings'

export function createClient (route: string, query?: string) {
  return new WebSocket(`ws://localhost:${settings.ws.port}/${route}${query ? '?' + query : ''}`)
}
