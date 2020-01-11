import { logger } from './logger'

process.on('SIGUSR1', () => {
  logger.info('Received debug signal SIGUSER1')
})

process.on('unhandledRejection', (reason) => {
  logger.fatal({ error: reason }, 'Unhandled Rejection')
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  logger.fatal(error, 'Unhandled Exception')
  process.exit(1)
})

process.on('warning', (error) => {
  logger.error(error, 'Warning detected')
})

process.on('message', (message, sendHandle) => {
  logger.fatal(
    { message, sendHandle },
    'Mesage from parent detected. It looks like a error')
})

process.on('exit', (code) => {
  logger.info(`Stopped with code: ${code}`)
})
