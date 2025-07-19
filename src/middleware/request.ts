import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';
import { logger } from '../config/logger';
import { config } from '../config/config';

/**
 * Add unique request ID to each request
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id = uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

/**
 * Enhanced request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.requestId,
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      requestId: req.requestId,
      adminId: req.admin?.adminId,
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Morgan HTTP request logger
 */
export const httpLogger = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms',
  {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
    skip: (req: Request) => {
      // Skip logging for health check endpoints in production
      if (config.isProduction && req.originalUrl === '/health') {
        return true;
      }
      return false;
    },
  }
);

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add HSTS header in production
  if (config.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

/**
 * CORS preflight handler
 */
export const corsHandler = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  const allowedOrigins = config.security.corsOrigin;
  
  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (config.isDevelopment) {
    // Allow all origins in development
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID');
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  next();
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = req.headers['content-length'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    logger.warn('Request size too large', {
      contentLength,
      maxSize,
      ip: req.ip,
      requestId: req.requestId,
    });
    
    res.status(413).json({
      success: false,
      message: 'Request entity too large',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
    return;
  }
  
  next();
};

/**
 * Bot detection middleware
 */
export const botDetection = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = req.headers['user-agent'] || '';
  
  const botPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /crawler/i,
    /spider/i,
  ];
  
  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  
  if (isBot) {
    logger.info('Bot detected', {
      userAgent,
      ip: req.ip,
      requestId: req.requestId,
    });
    
    // You can decide how to handle bots
    // For now, we'll just log and continue
  }
  
  next();
};
