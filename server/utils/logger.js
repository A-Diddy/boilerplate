const { createLogger, format, transports } = require("winston");

const { combine, timestamp, printf } = format;

// Get environment configuration
const logLevel = process.env.LOG_LEVEL || "info";
const logLocation = process.env.LOG_LOCATION || "logs/app.log";

// Create log format
const combinedFormat = printf(({ level = "info", message, timestamp, metadata = null}) => {
  return `${timestamp} [${level.toUpperCase()}] ${message} ${metadata ? JSON.stringify(metadata) : ""}`;
});

// Create file logger
const logger = createLogger({
  level: logLevel,
  // format: combine(errors({ stack: true }), timestamp(), json()),
  format: combine( timestamp(), combinedFormat ),
  transports: [new transports.File({ filename: logLocation, level: logLevel })],
});

// Create console logger for non-prod environments
if (process.env.LOG_TO_CONSOLE === "true" ||
  process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: combinedFormat,
    })
  );
}

module.exports = logger;
