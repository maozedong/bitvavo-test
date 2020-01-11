import { createLogger, LogLevel, stdSerializers } from 'bunyan'
const packagejson = require('../../package.json')

const SpecificLevelStream = require('./specific-level-stream')
const { name, version } = packagejson

export const logger = createLogger({
  name,
  version,
  streams: [
    {
      type: 'raw',
      name: 'stdout',
      level: (process.env.LOG_LEVEL || 'trace') as LogLevel,
      stream: new SpecificLevelStream(['trace', 'debug', 'info', 'warn'], process.stdout),
    },
    {
      type: 'raw',
      name: 'stderr',
      level: 'error',
      stream: new SpecificLevelStream(['error', 'fatal'], process.stderr),
    },
  ],
  serializers: {
    error: stdSerializers.err,
  },
})
