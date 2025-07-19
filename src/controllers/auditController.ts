import { Request, Response } from 'express';
import { AuditService } from '../services/auditService';
import { logger } from '../config/logger';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { AuditAction } from '@prisma/client';

export class AuditController {
  /**
   * Get audit logs with filtering and pagination
   */
  static getAuditLogs = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const {
      page = '1',
      limit = '50',
      entityType,
      entityId,
      action,
      adminId,
      submissionId,
      dateFrom,
      dateTo,
    } = req.query;

    const params = {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 100), // Max 100 items per page
      entityType: entityType as string,
      entityId: entityId as string,
      action: action as AuditAction,
      adminId: adminId as string,
      submissionId: submissionId as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const result = await AuditService.getAuditLogs(params);

    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to retrieve audit logs',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    const totalPages = Math.ceil(result.data!.total / params.limit);

    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: result.data!.logs,
      meta: {
        page: params.page,
        limit: params.limit,
        total: result.data!.total,
        totalPages,
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Get audit logs for a specific submission
   */
  static getSubmissionAuditLogs = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { submissionId } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50); // Max 50 items per page

    const result = await AuditService.getSubmissionAuditLogs(
      submissionId,
      pageNum,
      limitNum
    );

    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to retrieve submission audit logs',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    const totalPages = Math.ceil(result.data!.total / limitNum);

    res.status(200).json({
      success: true,
      message: 'Submission audit logs retrieved successfully',
      data: result.data!.logs,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: result.data!.total,
        totalPages,
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Get audit statistics
   */
  static getAuditStats = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { dateFrom, dateTo } = req.query;

    const params = {
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const result = await AuditService.getAuditStats(params.dateFrom, params.dateTo);

    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to retrieve audit statistics',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Audit statistics retrieved successfully',
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Get admin activity summary
   */
  static getAdminActivity = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { adminId } = req.params;
    const { page = '1', limit = '30', dateFrom, dateTo } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);

    const params = {
      page: pageNum,
      limit: limitNum,
      adminId,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const result = await AuditService.getAuditLogs(params);

    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to retrieve admin activity',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    const totalPages = Math.ceil(result.data!.total / limitNum);

    res.status(200).json({
      success: true,
      message: 'Admin activity retrieved successfully',
      data: result.data!.logs,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: result.data!.total,
        totalPages,
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Get system activity summary
   */
  static getSystemActivity = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const { prisma } = await import('../config/database');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisWeek = new Date();
      thisWeek.setDate(today.getDate() - today.getDay());
      thisWeek.setHours(0, 0, 0, 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const [
        totalAuditLogs,
        todayActivity,
        weekActivity,
        monthActivity,
        recentActivity,
        actionBreakdown,
      ] = await Promise.all([
        // Total audit logs
        prisma.auditLog.count(),

        // Today's activity
        prisma.auditLog.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),

        // This week's activity
        prisma.auditLog.count({
          where: {
            createdAt: {
              gte: thisWeek,
            },
          },
        }),

        // This month's activity
        prisma.auditLog.count({
          where: {
            createdAt: {
              gte: thisMonth,
            },
          },
        }),

        // Recent activity (last 10 entries)
        prisma.auditLog.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
          include: {
            admin: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        }),

        // Action breakdown for the last 30 days
        prisma.auditLog.groupBy({
          by: ['action'],
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          _count: {
            action: true,
          },
        }),
      ]);

      const actionStats = actionBreakdown.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {} as Record<string, number>);

      res.status(200).json({
        success: true,
        message: 'System activity retrieved successfully',
        data: {
          summary: {
            totalAuditLogs,
            todayActivity,
            weekActivity,
            monthActivity,
          },
          actionBreakdown: actionStats,
          recentActivity,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('Failed to get system activity', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.requestId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve system activity',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    }
  });

  /**
   * Export audit logs (CSV format)
   */
  static exportAuditLogs = asyncHandler(async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const {
      entityType,
      entityId,
      action,
      adminId,
      submissionId,
      dateFrom,
      dateTo,
      format = 'csv',
    } = req.query;

    try {
      const params = {
        page: 1,
        limit: 10000, // Large limit for export
        entityType: entityType as string,
        entityId: entityId as string,
        action: action as AuditAction,
        adminId: adminId as string,
        submissionId: submissionId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const result = await AuditService.getAuditLogs(params);

      if (!result.success || !result.data) {
        res.status(500).json({
          success: false,
          message: 'Failed to export audit logs',
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        });
        return;
      }

      if (format === 'csv') {
        // Generate CSV
        const csvHeader = 'Date,Action,Entity Type,Entity ID,Admin ID,IP Address,Description\n';
        const csvRows = result.data.logs.map(log => {
          const date = log.createdAt.toISOString();
          const adminId = log.adminId || 'System';
          const description = log.description ? `"${log.description.replace(/"/g, '""')}"` : '';
          
          return `"${date}","${log.action}","${log.entityType}","${log.entityId}","${adminId}","${log.ipAddress || ''}","${description}"`;
        }).join('\n');

        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      } else {
        // JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);
        res.json(result.data.logs);
      }
    } catch (error) {
      logger.error('Failed to export audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.requestId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to export audit logs',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    }
  });
}
