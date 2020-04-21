const { inspect } = require("util");
const { format, createLogger, transports } = require("winston");
const { combine, timestamp, printf } = format;
const printFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level.toUpperCase()}: ${message}`;
});

module.exports = class Logger {
  constructor({ level = "info", mute = true }) {
    this.level = level;
    this.mute = mute;
    const silent = mute;
    this.logger = createLogger({
      format: combine(timestamp(), printFormat),
      silent,
      transports: [new transports.Console({ level })],
    });
  }
  log(data) {
    const message = inspect(data);
    this.logger.log(this.level, { message });
  }
};
