const path = require('node:path');
const winston = require('winston');
const env = require('./env');

const transports = [];

transports.push(new winston.transports.Console({
  silent: env.nodeEnv === 'test',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
}));

if (env.nodeEnv === 'production' && !process.env.VERCEL) {
  transports.push(new winston.transports.File({
    dirname: path.resolve(process.cwd(), 'logs'),
    filename: 'app.log'
  }));
}

const logger = winston.createLogger({
  level: env.logLevel,
  defaultMeta: { service: 'license-addon-bank' },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports
});

module.exports = logger;
