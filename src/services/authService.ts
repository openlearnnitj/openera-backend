import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { JWTUtils, TokenPayload } from '../utils/jwt';
import { PasswordUtils } from '../utils/password';
import { 
  LoginRequest, 
  LoginResponse, 
  ChangePasswordRequest,
  ServiceResponse 
} from '../types';
import { Admin, RefreshToken } from '@prisma/client';
import { AuditService } from './auditService';

export class AuthService {
  /**
   * Authenticate admin and return tokens
   */
  static async login(
    credentials: LoginRequest,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<ServiceResponse<LoginResponse>> {
    try {
      // Find admin by email
      const admin = await prisma.admin.findUnique({
        where: { email: credentials.email },
      });

      if (!admin) {
        logger.warn('Login attempt with non-existent email', {
          email: credentials.email,
          ip: clientInfo.ipAddress,
        });

        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Check if admin account is active
      if (!admin.isActive) {
        logger.warn('Login attempt with inactive account', {
          email: credentials.email,
          adminId: admin.id,
          ip: clientInfo.ipAddress,
        });

        return {
          success: false,
          error: 'Account is disabled',
        };
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.comparePassword(
        credentials.password,
        admin.password
      );

      if (!isPasswordValid) {
        logger.warn('Login attempt with invalid password', {
          email: credentials.email,
          adminId: admin.id,
          ip: clientInfo.ipAddress,
        });

        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Generate tokens
      const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
      };

      const accessToken = JWTUtils.generateAccessToken(tokenPayload);

      // Create refresh token record
      const refreshTokenRecord = await prisma.refreshToken.create({
        data: {
          token: '',
          adminId: admin.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      const refreshToken = JWTUtils.generateRefreshToken({
        adminId: admin.id,
        tokenId: refreshTokenRecord.id,
      });

      // Update the refresh token record with the actual token
      await prisma.refreshToken.update({
        where: { id: refreshTokenRecord.id },
        data: { token: refreshToken },
      });

      // Update last login time
      await prisma.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      // Log the login
      await AuditService.logAdminLogin(admin.id, admin.email, clientInfo);

      logger.info('Admin login successful', {
        adminId: admin.id,
        email: admin.email,
        ip: clientInfo.ipAddress,
      });

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          admin: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
          },
        },
      };
    } catch (error) {
      logger.error('Login error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: credentials.email,
        ip: clientInfo.ipAddress,
      });

      return {
        success: false,
        error: 'Login failed',
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(
    refreshToken: string,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<ServiceResponse<{ accessToken: string; refreshToken: string }>> {
    try {
      // Verify refresh token
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);

      // Find refresh token in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { 
          id: decoded.tokenId,
          token: refreshToken,
        },
        include: {
          admin: true,
        },
      });

      if (!tokenRecord) {
        logger.warn('Invalid refresh token used', {
          tokenId: decoded.tokenId,
          ip: clientInfo.ipAddress,
        });

        return {
          success: false,
          error: 'Invalid refresh token',
        };
      }

      // Check if token is expired
      if (tokenRecord.expiresAt < new Date()) {
        // Delete expired token
        await prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });

        logger.warn('Expired refresh token used', {
          tokenId: decoded.tokenId,
          adminId: decoded.adminId,
          ip: clientInfo.ipAddress,
        });

        return {
          success: false,
          error: 'Refresh token expired',
        };
      }

      // Check if admin account is still active
      if (!tokenRecord.admin.isActive) {
        logger.warn('Refresh token used for inactive account', {
          adminId: tokenRecord.adminId,
          ip: clientInfo.ipAddress,
        });

        return {
          success: false,
          error: 'Account is disabled',
        };
      }

      // Generate new access token
      const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
        adminId: tokenRecord.admin.id,
        email: tokenRecord.admin.email,
        role: tokenRecord.admin.role,
      };

      const newAccessToken = JWTUtils.generateAccessToken(tokenPayload);

      // Generate new refresh token
      const newRefreshTokenRecord = await prisma.refreshToken.create({
        data: {
          token: '',
          adminId: tokenRecord.adminId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      const newRefreshToken = JWTUtils.generateRefreshToken({
        adminId: tokenRecord.adminId,
        tokenId: newRefreshTokenRecord.id,
      });

      // Update the new refresh token record
      await prisma.refreshToken.update({
        where: { id: newRefreshTokenRecord.id },
        data: { token: newRefreshToken },
      });

      // Delete old refresh token
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });

      logger.info('Token refreshed successfully', {
        adminId: tokenRecord.adminId,
        ip: clientInfo.ipAddress,
      });

      return {
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      logger.error('Token refresh error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: clientInfo.ipAddress,
      });

      return {
        success: false,
        error: 'Token refresh failed',
      };
    }
  }

  /**
   * Logout admin and invalidate refresh token
   */
  static async logout(
    refreshToken: string,
    adminId: string,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Find and delete refresh token
      const tokenRecord = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          adminId,
        },
        include: {
          admin: true,
        },
      });

      if (tokenRecord) {
        await prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });

        // Log the logout
        await AuditService.logAdminLogout(
          adminId,
          tokenRecord.admin.email,
          clientInfo
        );
      }

      logger.info('Admin logout successful', {
        adminId,
        ip: clientInfo.ipAddress,
      });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      logger.error('Logout error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId,
        ip: clientInfo.ipAddress,
      });

      return {
        success: false,
        error: 'Logout failed',
      };
    }
  }

  /**
   * Change admin password
   */
  static async changePassword(
    adminId: string,
    passwordData: ChangePasswordRequest,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Get admin
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        return {
          success: false,
          error: 'Admin not found',
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await PasswordUtils.comparePassword(
        passwordData.currentPassword,
        admin.password
      );

      if (!isCurrentPasswordValid) {
        logger.warn('Invalid current password during password change', {
          adminId,
          ip: clientInfo.ipAddress,
        });

        return {
          success: false,
          error: 'Current password is incorrect',
        };
      }

      // Validate new password strength
      const passwordValidation = PasswordUtils.validatePasswordStrength(
        passwordData.newPassword
      );

      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: 'Password does not meet security requirements',
        };
      }

      // Hash new password
      const hashedPassword = await PasswordUtils.hashPassword(
        passwordData.newPassword
      );

      // Update password
      await prisma.admin.update({
        where: { id: adminId },
        data: { password: hashedPassword },
      });

      // Invalidate all refresh tokens for this admin
      await prisma.refreshToken.deleteMany({
        where: { adminId },
      });

      // Log password change
      await AuditService.createAuditLog({
        action: 'UPDATE',
        entityType: 'admin',
        entityId: adminId,
        description: 'Password changed',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        adminId,
      });

      logger.info('Password changed successfully', {
        adminId,
        ip: clientInfo.ipAddress,
      });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      logger.error('Change password error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId,
        ip: clientInfo.ipAddress,
      });

      return {
        success: false,
        error: 'Password change failed',
      };
    }
  }

  /**
   * Get admin profile
   */
  static async getProfile(adminId: string): Promise<ServiceResponse<Admin>> {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!admin) {
        return {
          success: false,
          error: 'Admin not found',
        };
      }

      return {
        success: true,
        data: admin as Admin,
      };
    } catch (error) {
      logger.error('Get profile error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId,
      });

      return {
        success: false,
        error: 'Failed to get profile',
      };
    }
  }

  /**
   * Cleanup expired refresh tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info('Expired refresh tokens cleaned up', {
        count: result.count,
      });
    } catch (error) {
      logger.error('Failed to cleanup expired tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
