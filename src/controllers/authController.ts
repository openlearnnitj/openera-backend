import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { RequestUtils } from '../utils/request';
import { logger } from '../config/logger';
import { 
  ApiResponse, 
  LoginRequest, 
  ChangePasswordRequest,
  RefreshTokenRequest 
} from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  /**
   * Admin login
   */
  static login = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const loginData: LoginRequest = req.body;
    const clientInfo = RequestUtils.getClientInfo(req);

    const result = await AuthService.login(loginData, {
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    if (!result.success) {
      res.status(401).json({
        success: false,
        message: result.error || 'Login failed',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Refresh access token
   */
  static refreshToken = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { refreshToken }: RefreshTokenRequest = req.body;
    const clientInfo = RequestUtils.getClientInfo(req);

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    const result = await AuthService.refreshToken(refreshToken, {
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    if (!result.success) {
      res.status(401).json({
        success: false,
        message: result.error || 'Token refresh failed',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Admin logout
   */
  static logout = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { refreshToken }: RefreshTokenRequest = req.body;
    const adminId = req.admin!.adminId;
    const clientInfo = RequestUtils.getClientInfo(req);

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    const result = await AuthService.logout(refreshToken, adminId, {
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.error || 'Logout failed',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Change admin password
   */
  static changePassword = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const passwordData: ChangePasswordRequest = req.body;
    const adminId = req.admin!.adminId;
    const clientInfo = RequestUtils.getClientInfo(req);

    const result = await AuthService.changePassword(adminId, passwordData, {
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error || 'Password change failed',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Get admin profile
   */
  static getProfile = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const adminId = req.admin!.adminId;

    const result = await AuthService.getProfile(adminId);

    if (!result.success) {
      res.status(404).json({
        success: false,
        message: result.error || 'Profile not found',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Validate token (middleware endpoint to check if token is valid)
   */
  static validateToken = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    // If we reach here, the token is valid (checked by auth middleware)
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        admin: {
          id: req.admin!.adminId,
          email: req.admin!.email,
          role: req.admin!.role,
        },
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Get admin session info
   */
  static getSessionInfo = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const adminId = req.admin!.adminId;
    
    try {
      const { prisma } = await import('../config/database');
      
      // Get active refresh tokens count
      const activeTokensCount = await prisma.refreshToken.count({
        where: {
          adminId,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      // Get recent login audit logs
      const recentLogins = await prisma.auditLog.findMany({
        where: {
          adminId,
          action: 'LOGIN',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          createdAt: true,
          ipAddress: true,
          userAgent: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Session info retrieved successfully',
        data: {
          activeTokensCount,
          recentLogins,
          currentSession: {
            ip: RequestUtils.getClientIP(req),
            userAgent: RequestUtils.getUserAgent(req),
            loginTime: new Date().toISOString(),
          },
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('Failed to get session info', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId,
        requestId: req.requestId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve session info',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    }
  });

  /**
   * Revoke all admin sessions (logout from all devices)
   */
  static revokeAllSessions = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const adminId = req.admin!.adminId;
    const clientInfo = RequestUtils.getClientInfo(req);

    try {
      const { prisma } = await import('../config/database');
      
      // Delete all refresh tokens for this admin
      const result = await prisma.refreshToken.deleteMany({
        where: { adminId },
      });

      // Log the action
      const { AuditService } = await import('../services/auditService');
      await AuditService.createAuditLog({
        action: 'LOGOUT',
        entityType: 'admin',
        entityId: adminId,
        description: 'All sessions revoked',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        adminId,
      });

      logger.info('All sessions revoked', {
        adminId,
        tokensRevoked: result.count,
        ip: clientInfo.ipAddress,
      });

      res.status(200).json({
        success: true,
        message: `Successfully revoked ${result.count} active sessions`,
        data: { revokedTokens: result.count },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('Failed to revoke all sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId,
        requestId: req.requestId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to revoke sessions',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    }
  });
}
