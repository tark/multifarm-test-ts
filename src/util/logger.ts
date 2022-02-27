import winston, {LeveledLogMethod} from 'winston'
import chalk from 'chalk'
import moment from 'moment'
import DailyRotateFile from 'winston-daily-rotate-file'

const tagLength = 20

export default class Logger {
  tag: string
  logger: winston.Logger

  constructor(tag: string) {
    this.tag = tag
    this.logger = this.createLogger(tag)
  }

  l = (message: string, color: string) => {
    if (color == 'green') {
      this.h(message)
    } else if (color == 'red') {
      this.e(message)
    } else {
      this.i(message)
    }
  }

  x = (message: string, success: boolean) => {
    if (success) {
      this.h(message)
    } else {
      this.e(message)
    }
  }

  i = (message: string) => {
    this.logger.info(message)
  }

  e = (message: string) => {
    this.logger.error(message)
  }

  h = (message: string) => {
    this.logger.http(message)
  }

  w = (message: string) => {
    this.logger.warn(message)
  }

  //
  pad = (tag: string) => {
    let result = '>'
    for (let i = 0; i < tagLength - tag.length; i++) {
      result += ' '
    }
    result += tag
    return result
  }

  createLogger = (label: string = 'General', filename?: string): winston.Logger => {
    const logsPath = process.env.LOGS_PATH || 'logs'

    const transports = []

    if (process.env.NODE_ENV !== 'production') {
      transports.push(new winston.transports.Console())
    }

    transports.push(new DailyRotateFile({
      dirname: logsPath,
      filename: `%DATE%-all.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      zippedArchive: true
    }))

    transports.push(new DailyRotateFile({
      dirname: logsPath,
      filename: `%DATE%-errors.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      zippedArchive: true
    }))

    if (filename) {
      transports.push(new DailyRotateFile({
        dirname: logsPath,
        filename: `%DATE%-${filename}.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        zippedArchive: true
      }))
    }

    return winston.createLogger({
      levels: {
        'info': 0,
        'http': 0,
        'warn': 0,
        'error': 0,
      },
      format: winston.format.combine(
        winston.format.label({label}),
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(info => {
          const {timestamp, level, label, message} = info
          const date = moment(timestamp).format('HH:mm:ss.SSS')
          let coloredMessage
          if (level.includes('error')) {
            coloredMessage = chalk.red(message)
          } else if (level.includes('http')) {
            coloredMessage = chalk.green(message)
          } else if (level.includes('warn')) {
            coloredMessage = chalk.yellow(message)
          } else {
            coloredMessage = message
          }
          return `${date}${chalk.grey(this.pad(label))} - ${coloredMessage}\n`
        })
      ),
      transports
    })

  }
}

