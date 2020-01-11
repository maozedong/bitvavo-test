import { logger } from './logger'
import { AppSettings } from './settings'
import { $WSBoundary, WSBoundary } from './services/WSBoundary'
import { $TradesHandler, TradesHandler } from './services/TradesHandler'
import { $DBBoundary, DBBoundary } from './services/DBBoundary'

type AppServices =
  $WSBoundary &
  $DBBoundary &
  $TradesHandler

export class App {
  services: AppServices

  constructor (private settings: AppSettings) {
    const wsBoundary = new WSBoundary(this.settings.ws)
    const dbBoundary = new DBBoundary(this.settings.db)
    this.services = {
      wsBoundary,
      dbBoundary,
      tradesHandler: new TradesHandler({ wsBoundary, dbBoundary }),
    }
  }

  async start () {
    logger.info('Starting...')

    // Setup kernel signals stop handlers before start
    // so everything will shutdown at least partially
    if (!this.isTestEnv()) {
      ['SIGTERM', 'SIGINT', 'SIGHUP'].forEach((sigEvent) => {
        process.on(sigEvent as NodeJS.Signals, () => this.stop())
      })
    }

    try {
      await this.services.dbBoundary.start()
      await this.services.wsBoundary.start()
      await this.services.tradesHandler.start()
    } catch (error) {
      if (!this.isTestEnv()) {
        logger.error(error, 'Error during startup')
        process.exit(1)
      } else {
        throw error
      }
    }

    logger.info('Started')
  }

  async stop () {
    logger.info('Stopping...')

    // Last resort fallback to shutdown application no matter what
    const timeoutId = setTimeout(() => {
      if (!this.isTestEnv()) {
        logger.error(`Stopped forcefully`)
        process.exit(1)
      } else {
        throw new Error(`Failed to stop process gracefully`)
      }
    }, this.settings.shutdownTimeout)

    try {
      await this.services.tradesHandler.stop()
      await this.services.wsBoundary.stop()
      await this.services.dbBoundary.stop()
      clearTimeout(timeoutId)
      logger.info('Stopped')
    } catch (error) {
      if (!this.isTestEnv()) {
        logger.error(error, 'Error during shutdown')
        process.exit(1)
      } else {
        throw error
      }
    }
  }

  private isTestEnv () {
    return this.settings.env === 'test'
  }
}
