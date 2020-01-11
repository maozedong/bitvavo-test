import { App } from '../src/App'
import settings from '../src/settings'

const app = new App(settings)

describe('app', () => {
  it('should start and stop', async function () {
    await app.start()
    await app.stop()
  })
  it('should start and stop', async function () {
    await app.start()
    await app.stop()
  })
})
