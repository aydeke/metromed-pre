/**
 * './server/logs.js'
 */

import winston from 'winston';

const logger = winston.createLogger({
  /**
   * Level option allows to specify the message level.
   * The logger will only output messages of a specified level and higher.
   * Here, we simply said the following:
   * in production mode, only log messages with the level info or higher;
   * in development mode, only log messages with the level debug or higher.
   * There are 6 levels of messages, from highest (0) to lowest priority (5):
   * error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5
   * It's clear now that in production mode,
   * we want to see error, warn, and info messages,
   * but we don't want to see verbose, debug, and silly ones.
   * In development mode, we will also see debug and verbose messages.
   * The debug messages are handy if you debug often and
   * occasionaly forget to delete a debug code
   * when preparing your app for production.
   */
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  /**
   * Format option allows to choose the format of our output.
   * We chose the simple format winston.format.simple(), which is
   * ${info.level}: ${info.message} JSON.stringify({ ...rest })
   */
  format: winston.format.simple(),
  /**
   * Transport option allows to send and save logs to a particular file.
   * However, we won't save logs to a file.
   * We will only output messages to our terminal
   * with the [new winston.transports.Console()] option.
   */
  transports: [new winston.transports.Console()],
});

export default logger;
