import { LogLevel, resolveLevel, safeCycles } from 'bunyan'

class SpecificLevelStream {
  levels: { [key: string]: boolean }
  stream: NodeJS.WritableStream

  constructor (levels: Array<LogLevel>, stream: NodeJS.WritableStream) {
    this.levels = {}
    for (const level of levels) {
      this.levels[resolveLevel(level)] = true
    }
    this.stream = stream
  }

  write (rec) {
    if (this.levels[rec.level]) {
      this.stream.write(`${JSON.stringify(rec, safeCycles())}\n`)
    }
  }
}

module.exports = SpecificLevelStream
