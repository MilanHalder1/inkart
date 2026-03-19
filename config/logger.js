'use strict';

const winston = require('winston');

const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };

const level = () => {
  if (process.env.VERCEL) return 'info';
  return process.env.NODE_ENV === 'development' ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack }) =>
    `${timestamp} ${level}: ${stack || message}`
  )
);

const transports = [
  new winston.transports.Console({ format: consoleFormat }),
];

// ✅ ONLY load file logging if NOT on Vercel
if (!process.env.VERCEL) {
  const path = require('path');
  const DailyRotateFile = require('winston-daily-rotate-file');

  const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
    })
  );

  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
    })
  );
}

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

module.exports = logger;