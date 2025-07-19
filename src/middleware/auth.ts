import { Request, Response, NextFunction } from 'express';
import { JWTUtils, TokenPayload } from '../utils/jwt';
import { ApiResponse } from '../types';
import { logger } from '../config/logger';

/**
 * Authentication middleware to verify JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    // Verify the token
    const decoded = JWTUtils.verifyAccessToken(token);
    
    // Attach admin info to request
    req.admin = decoded;
    
    logger.info(`Admin ${decoded.adminId} authenticated successfully`, {
      adminId: decoded.adminId,
      email: decoded.email,
      requestId: req.requestId,
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches admin info if token is valid, but doesn't fail if no token
 */
export const optionalAuthentication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = JWTUtils.verifyAccessToken(token);
        req.admin = decoded;
      } catch (error) {
        // Token is invalid, but we don't fail the request
        logger.debug('Optional authentication failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId: req.requestId,
        });
      }
    }

    next();
  } catch (error) {
    // Even if there's an error, we continue without authentication
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      logger.warn('Authorization failed - insufficient permissions', {
        adminId: req.admin.adminId,
        role: req.admin.role,
        requiredRoles: allowedRoles,
        requestId: req.requestId,
      });

      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    next();
  };
};

/**
 * Check if admin account is active
 */
export const requireActiveAccount = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    // Here you could add database check to verify if admin account is still active
    // For now, we assume the token validation is sufficient
    
    next();
  } catch (error) {
    logger.error('Error checking account status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.admin?.adminId,
      requestId: req.requestId,
    });

    res.status(500).json({
      success: false,
      message: 'Error verifying account status',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  }
};
