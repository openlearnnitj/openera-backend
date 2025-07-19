import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response } from 'express';
import { config } from '../config/config';
import { ApiResponse } from '../types';
import { logger } from '../config/logger';

/**
 * Custom key generator for rate limiting
 */
const keyGenerator = (req: Request): string => {
  // Use IP address as the key
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.connection.remoteAddress;
  return ip || 'unknown';
};

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req: Request, res: Response<ApiResponse>): void => {
  const clientIP = keyGenerator(req);
  
  logger.warn('Rate limit exceeded', {
    ip: clientIP,
    path: req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
    requestId: req.requestId,
  });

  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
};

/**
 * General rate limiter for all API endpoints
 */
export const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.maxRequests, // 100 requests per window
  keyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString(),
  },
});

/**
 * Strict rate limiter for submission endpoints
 */
export const submissionRateLimit = rateLimit({
  windowMs: config.rateLimit.submissionWindowMs, // 1 hour
  max: config.rateLimit.submissionMax, // 5 submissions per hour
  keyGenerator,
  handler: (req: Request, res: Response<ApiResponse>): void => {
    const clientIP = keyGenerator(req);
    
    logger.warn('Submission rate limit exceeded', {
      ip: clientIP,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });

    res.status(429).json({
      success: false,
      message: 'Too many submission attempts. You can submit up to 5 times per hour.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  keyGenerator,
  handler: (req: Request, res: Response<ApiResponse>): void => {
    const clientIP = keyGenerator(req);
    
    logger.warn('Authentication rate limit exceeded', {
      ip: clientIP,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });

    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Progressive delay middleware for authentication endpoints
 */
export const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 3, // Allow 3 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  keyGenerator,
});

/**
 * Rate limiter for admin endpoints
 */
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes for admin endpoints
  keyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for file operations (if needed)
 */
export const fileOperationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 file operations per minute
  keyGenerator,
  handler: (req: Request, res: Response<ApiResponse>): void => {
    const clientIP = keyGenerator(req);
    
    logger.warn('File operation rate limit exceeded', {
      ip: clientIP,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });

    res.status(429).json({
      success: false,
      message: 'Too many file operations. Please try again later.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Dynamic rate limiter based on endpoint sensitivity
 */
export const createDynamicRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator,
    handler: (req: Request, res: Response<ApiResponse>): void => {
      const clientIP = keyGenerator(req);
      
      logger.warn('Dynamic rate limit exceeded', {
        ip: clientIP,
        path: req.path,
        method: req.method,
        windowMs,
        max,
        requestId: req.requestId,
      });

      res.status(429).json({
        success: false,
        message: message || 'Rate limit exceeded. Please try again later.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
