import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError as ExpressValidationError } from 'express-validator';
import { ApiResponse } from '../types';
import { logger } from '../config/logger';
import { formatValidationErrors } from './errorHandler';

/**
 * Validation middleware to handle express-validator results
 */
export const handleValidation = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array() as ExpressValidationError[];
    const formattedErrors = formatValidationErrors(validationErrors);

    logger.warn('Validation failed', {
      errors: formattedErrors,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
      requestId: req.requestId,
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
    return;
  }

  next();
};

/**
 * Sanitize request body to prevent XSS and injection attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        // Basic HTML encoding to prevent XSS
        obj[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  }
}

/**
 * Validate content type for specific endpoints
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      res.status(400).json({
        success: false,
        message: 'Content-Type header is required',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    const isAllowed = allowedTypes.some(type => contentType.includes(type));
    
    if (!isAllowed) {
      logger.warn('Invalid content type', {
        contentType,
        allowedTypes,
        ip: req.ip,
        requestId: req.requestId,
      });

      res.status(415).json({
        success: false,
        message: `Unsupported Media Type. Allowed types: ${allowedTypes.join(', ')}`,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    next();
  };
};

/**
 * Validate request method for specific endpoints
 */
export const validateMethod = (allowedMethods: string[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!allowedMethods.includes(req.method)) {
      res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    next();
  };
};

/**
 * Validate required headers
 */
export const validateHeaders = (requiredHeaders: string[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const missingHeaders = requiredHeaders.filter(header => 
      !req.headers[header.toLowerCase()]
    );

    if (missingHeaders.length > 0) {
      logger.warn('Missing required headers', {
        missingHeaders,
        headers: req.headers,
        ip: req.ip,
        requestId: req.requestId,
      });

      res.status(400).json({
        success: false,
        message: `Missing required headers: ${missingHeaders.join(', ')}`,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    next();
  };
};

/**
 * Prevent duplicate submissions based on email
 */
export const preventDuplicateSubmission = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      next();
      return;
    }

    // Import prisma here to avoid circular dependency
    const { prisma } = await import('../config/database');
    
    const existingSubmission = await prisma.submission.findUnique({
      where: { email },
      select: { id: true, submittedAt: true, teamName: true },
    });

    if (existingSubmission) {
      logger.warn('Duplicate submission attempt', {
        email,
        existingSubmissionId: existingSubmission.id,
        ip: req.ip,
        requestId: req.requestId,
      });

      res.status(409).json({
        success: false,
        message: 'A submission with this email already exists. Each team can only submit once.',
        data: {
          existingSubmission: {
            teamName: existingSubmission.teamName,
            submittedAt: existingSubmission.submittedAt,
          },
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error checking duplicate submission', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email,
      requestId: req.requestId,
    });

    res.status(500).json({
      success: false,
      message: 'Error validating submission',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  }
};
