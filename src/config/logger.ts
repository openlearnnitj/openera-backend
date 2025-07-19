import winston from 'winston';
import { config } from './config';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: config.isDevelopment }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `[${timestamp}] ${level}: ${stack || message}`;
  })
);

// Create winston logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'openera-backend' },
  transports: [
    // Console transport
    new winston.transports.Console({
      silent: false,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Separate file for error logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add request ID to logs
export const addRequestId = (requestId: string) => {
  return logger.child({ requestId });
};

// Export logger types for TypeScript
export type Logger = typeof logger;
