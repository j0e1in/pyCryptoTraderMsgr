const appRoot = require('app-root-path')
const moment  = require('moment-timezone')
const { createLogger, format, transports } = require('winston')

const fmt = format.printf(info => {
    info.timestamp = moment().format('YYYY-MM-DD HH:mm:ss')
    return `${info.timestamp} [${info.level}] ${info.message}`
})

moment.tz.setDefault('Asia/Taipei')
time = moment().format("YYYY-MM-DD_HH:mm:ss")

const logger = createLogger({
    level: 'debug',
    format: fmt,
    transports: [
        new transports.Console(),
        new transports.File({
            filename: `${appRoot}/../log/msgr/bot-${time}.log`,
        })
    ]
})

module.exports = logger