const moment  = require('moment-timezone');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(info => {
    info.timestamp =  moment().format('YYYY-MM-DD HH:mm:ss');
    return `${info.timestamp} [${info.level}] ${info.message}`;
});

moment.tz.setDefault('Asia/Taipei');


const logger = createLogger({
    level: 'debug',
    format: myFormat,
    transports: [
        new transports.File({
            filename: 'tradercomm.log',
            level: 'debug'
        })
    ]
})


module.exports.logger = logger;