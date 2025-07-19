import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { CreateAuditLogData, ServiceResponse } from '../types';
import { AuditAction, AuditLog } from '@prisma/client';

export class AuditService {
  /**
   * Create an audit log entry
   */
  static async createAuditLog(data: CreateAuditLogData): Promise<ServiceResponse<AuditLog>> {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          oldValues: data.oldValues || undefined,
          newValues: data.newValues || undefined,
          description: data.description,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          adminId: data.adminId,
          submissionId: data.submissionId,
        },
      });

      logger.info('Audit log created', {
        auditLogId: auditLog.id,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        adminId: data.adminId,
      });

      return {
        success: true,
        data: auditLog,
      };
    } catch (error) {
      logger.error('Failed to create audit log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      });

      return {
        success: false,
        error: 'Failed to create audit log',
      };
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(params: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    action?: AuditAction;
    adminId?: string;
    submissionId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<ServiceResponse<{ logs: AuditLog[]; total: number }>> {
    try {
      const {
        page = 1,
        limit = 50,
        entityType,
        entityId,
        action,
        adminId,
        submissionId,
        dateFrom,
        dateTo,
      } = params;

      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (entityType) where.entityType = entityType;
      if (entityId) where.entityId = entityId;
      if (action) where.action = action;
      if (adminId) where.adminId = adminId;
      if (submissionId) where.submissionId = submissionId;

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          include: {
            admin: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            submission: {
              select: {
                id: true,
                teamName: true,
                email: true,
              },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        success: true,
        data: { logs, total },
      };
    } catch (error) {
      logger.error('Failed to get audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params,
      });

      return {
        success: false,
        error: 'Failed to retrieve audit logs',
      };
    }
  }

  /**
   * Get audit logs for a specific submission
   */
  static async getSubmissionAuditLogs(
    submissionId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ServiceResponse<{ logs: AuditLog[]; total: number }>> {
    try {
      const offset = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: {
            submissionId,
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          include: {
            admin: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        }),
        prisma.auditLog.count({
          where: { submissionId },
        }),
      ]);

      return {
        success: true,
        data: { logs, total },
      };
    } catch (error) {
      logger.error('Failed to get submission audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        submissionId,
      });

      return {
        success: false,
        error: 'Failed to retrieve submission audit logs',
      };
    }
  }

  /**
   * Log submission creation
   */
  static async logSubmissionCreated(
    submissionId: string,
    submissionData: any,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<void> {
    await this.createAuditLog({
      action: 'CREATE',
      entityType: 'submission',
      entityId: submissionId,
      newValues: submissionData,
      description: `Submission created by ${submissionData.teamName}`,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      submissionId,
    });
  }

  /**
   * Log submission update
   */
  static async logSubmissionUpdated(
    submissionId: string,
    oldData: any,
    newData: any,
    adminId: string,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<void> {
    await this.createAuditLog({
      action: 'UPDATE',
      entityType: 'submission',
      entityId: submissionId,
      oldValues: oldData,
      newValues: newData,
      description: `Submission updated by admin`,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      adminId,
      submissionId,
    });
  }

  /**
   * Log submission status change
   */
  static async logStatusChange(
    submissionId: string,
    oldStatus: string,
    newStatus: string,
    adminId: string,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<void> {
    await this.createAuditLog({
      action: 'STATUS_CHANGE',
      entityType: 'submission',
      entityId: submissionId,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      description: `Status changed from ${oldStatus} to ${newStatus}`,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      adminId,
      submissionId,
    });
  }

  /**
   * Log admin login
   */
  static async logAdminLogin(
    adminId: string,
    adminEmail: string,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<void> {
    await this.createAuditLog({
      action: 'LOGIN',
      entityType: 'admin',
      entityId: adminId,
      description: `Admin ${adminEmail} logged in`,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      adminId,
    });
  }

  /**
   * Log admin logout
   */
  static async logAdminLogout(
    adminId: string,
    adminEmail: string,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<void> {
    await this.createAuditLog({
      action: 'LOGOUT',
      entityType: 'admin',
      entityId: adminId,
      description: `Admin ${adminEmail} logged out`,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      adminId,
    });
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(dateFrom?: Date, dateTo?: Date): Promise<ServiceResponse<any>> {
    try {
      const where: any = {};
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const stats = await prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true,
        },
      });

      const formattedStats = stats.reduce((acc, stat) => {
        acc[stat.action] = stat._count.action;
        return acc;
      }, {} as Record<string, number>);

      return {
        success: true,
        data: formattedStats,
      };
    } catch (error) {
      logger.error('Failed to get audit statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve audit statistics',
      };
    }
  }
}
