import { Request, Response, NextFunction } from 'express';
import { ValidationError as ExpressValidationError } from 'express-validator';
import { ApiResponse, ValidationError } from '../types';
import { logger } from '../config/logger';
import { config } from '../config/config';

/**
 * Custom Application Error class
 */
export class CustomError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: ValidationError[];

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    errors?: ValidationError[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error Handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const error = new CustomError(
    `Route ${req.originalUrl} not found`,
    404
  );

  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.requestId,
  });

  next(error);
};

/**
 * Global Error Handler
 */
export const errorHandler = (
  error: Error | CustomError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: string[] = [];

  // Handle Custom Application Errors
  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
    
    if (error.errors) {
      errors = error.errors.map(err => err.message || 'Validation error');
    }
  }
  // Handle Prisma Errors
  else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this information already exists';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
    }
  }
  // Handle Prisma Validation Errors
  else if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
  }
  // Handle JWT Errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Handle Validation Errors from express-validator
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }
  // Handle other common errors
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  else if (error.name === 'SyntaxError') {
    statusCode = 400;
    message = 'Invalid JSON syntax';
  }

  // Log the error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]('Request error', {
    message: error.message,
    stack: config.isDevelopment ? error.stack : undefined,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.requestId,
    adminId: req.admin?.adminId,
  });

  // Prepare response
  const response: ApiResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };

  // Add errors array if present
  if (errors.length > 0) {
    response.errors = errors;
  }

  // Add stack trace in development
  if (config.isDevelopment && error.stack) {
    (response as any).stack = error.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async error wrapper to catch async errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error formatter
 */
export const formatValidationErrors = (errors: ExpressValidationError[]): string[] => {
  return errors.map(error => {
    if ('msg' in error && error.msg) return error.msg;
    return 'Validation error';
  });
};

/**
 * Create standardized error responses
 */
export const createErrorResponse = (
  message: string,
  statusCode: number = 500,
  errors?: string[],
  requestId?: string
): ApiResponse => {
  return {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
    requestId,
  };
};

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
  });
  
  // Exit the process in production
  if (config.isProduction) {
    process.exit(1);
  }
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });
  
  // Exit the process gracefully
  process.exit(1);
});
