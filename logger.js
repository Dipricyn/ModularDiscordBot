const {transports, createLogger, format} = require('winston');

const logDir = 'data/'

// Configure logger settings
const logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.json()
    ),
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      //
      new transports.File({ filename: `${logDir}error.log`, level: 'error'}),
      new transports.File({ filename: `${logDir}combined.log`})
    ]
  });
  
  //
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  // 
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
      format: format.simple(),
      level: 'debug'
    }));
  }

  module.exports = logger