import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { config } from '../config/config';
import { ApiResponse, HealthCheckResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export class HealthController {
  /**
   * Basic health check endpoint
   */
  static healthCheck = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse<HealthCheckResponse>>
  ): Promise<void> => {
    try {
      // Check database connection
      const { prisma } = await import('../config/database');
      
      let databaseStatus: 'healthy' | 'unhealthy' = 'healthy';
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        databaseStatus = 'unhealthy';
        logger.error('Database health check failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Get memory usage
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      // Get CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      const cpuPercentage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

      // Calculate uptime
      const uptime = process.uptime();

      const healthData: HealthCheckResponse = {
        status: databaseStatus === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime,
        services: {
          database: databaseStatus,
          memory: {
            used: Math.round(usedMemory / 1024 / 1024), // MB
            total: Math.round(totalMemory / 1024 / 1024), // MB
            percentage: Math.round(memoryPercentage * 100) / 100,
          },
          cpu: {
            usage: Math.round(cpuPercentage * 100) / 100,
          },
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
      };

      const statusCode = healthData.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        success: healthData.status === 'healthy',
        message: `Service is ${healthData.status}`,
        data: healthData,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('Health check error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.requestId,
      });

      res.status(503).json({
        success: false,
        message: 'Health check failed',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          services: {
            database: 'unhealthy',
            memory: {
              used: 0,
              total: 0,
              percentage: 0,
            },
            cpu: {
              usage: 0,
            },
          },
          version: process.env.npm_package_version || '1.0.0',
          environment: config.nodeEnv,
        } as HealthCheckResponse,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    }
  });

  /**
   * Detailed system information endpoint
   */
  static systemInfo = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const { prisma } = await import('../config/database');

      // Get database statistics
      const [
        totalSubmissions,
        totalAdmins,
        totalAuditLogs,
        recentSubmissions,
      ] = await Promise.all([
        prisma.submission.count(),
        prisma.admin.count(),
        prisma.auditLog.count(),
        prisma.submission.count({
          where: {
            submittedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

      // Get system metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Get Node.js version and other info
      const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        uptime: process.uptime(),
        pid: process.pid,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
      };

      const databaseStats = {
        totalSubmissions,
        totalAdmins,
        totalAuditLogs,
        recentSubmissions,
      };

      const performanceMetrics = {
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
          arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024), // MB
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
      };

      res.status(200).json({
        success: true,
        message: 'System information retrieved successfully',
        data: {
          system: systemInfo,
          database: databaseStats,
          performance: performanceMetrics,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('System info error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.requestId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve system information',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    }
  });

  /**
   * Database connection test
   */
  static databaseTest = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const { prisma } = await import('../config/database');
      
      const startTime = Date.now();
      
      // Test database connection with a simple query
      await prisma.$queryRaw`SELECT 1 as test`;
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Test database operations
      const testResults = {
        connection: 'successful',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        message: 'Database test completed successfully',
        data: testResults,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('Database test error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.requestId,
      });

      res.status(503).json({
        success: false,
        message: 'Database test failed',
        data: {
          connection: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    }
  });

  /**
   * API metrics endpoint
   */
  static metrics = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const { prisma } = await import('../config/database');

      // Get submission metrics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        submissionsLast24h,
        submissionsLastWeek,
        submissionsLastMonth,
        auditLogsLast24h,
        statusDistribution,
      ] = await Promise.all([
        prisma.submission.count({
          where: { submittedAt: { gte: oneDayAgo } },
        }),
        prisma.submission.count({
          where: { submittedAt: { gte: oneWeekAgo } },
        }),
        prisma.submission.count({
          where: { submittedAt: { gte: oneMonthAgo } },
        }),
        prisma.auditLog.count({
          where: { createdAt: { gte: oneDayAgo } },
        }),
        prisma.submission.groupBy({
          by: ['status'],
          _count: {
            status: true,
          },
        }),
      ]);

      const metrics = {
        submissions: {
          last24Hours: submissionsLast24h,
          lastWeek: submissionsLastWeek,
          lastMonth: submissionsLastMonth,
        },
        auditLogs: {
          last24Hours: auditLogsLast24h,
        },
        statusDistribution: statusDistribution.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        timestamp: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        message: 'API metrics retrieved successfully',
        data: metrics,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('Metrics error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.requestId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    }
  });
}
