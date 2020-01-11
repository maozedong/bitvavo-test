import WebSocket from 'ws'
import { expect } from 'chai'
import { App } from '../src/App'
import settings from '../src/settings'
import * as querystring from 'querystring'
import { createClient } from './utils'

describe('trades flow', () => {
  let app
  let wsClient: WebSocket
  let snapshotMock

  beforeEach(async () => {
    app = new App(settings)
    await app.start()
  })

  afterEach(async () => {
    await app.stop()
    snapshotMock = null
    wsClient && wsClient.close()
    wsClient = null
  })

  it('should respond with market data, mentioned in subscription',
    function (done) {
      const start = new Date('2020-01-11T11:25:00Z').valueOf()
      wsClient = createClient('trades', querystring.stringify({
        market: 'BTC-EUR',
        start,
      }))
      wsClient.on('message', (data: string) => {
        expect(JSON.parse(data)).to.eql({
          'data': [
            [1578742167371, 7243.7],
            [1578742177761, 7241.8],
          ],
          'market': 'BTC-EUR',
        })
        done()
      })
    })
})
