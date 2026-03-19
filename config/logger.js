'use strict';

const winston = require('winston');
const path = require('path');

const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };

// ✅ Better level control
const level = () => {
  if (process.env.VERCEL) return 'info'; // Vercel safe
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

// ✅ Console format (used everywhere)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack }) =>
    `${timestamp} ${level}: ${stack || message}`
  )
);

// ✅ File format (only local)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ✅ Always use console
const transports = [
  new winston.transports.Console({ format: consoleFormat }),
];

// ✅ ONLY enable file logging if NOT on Vercel
if (!process.env.VERCEL) {
  const DailyRotateFile = require('winston-daily-rotate-file');

  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxFiles: '30d',
      zippedArchive: true,
    })
  );

  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxFiles: '14d',
      zippedArchive: true,
    })
  );
}

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

module.exports = logger;