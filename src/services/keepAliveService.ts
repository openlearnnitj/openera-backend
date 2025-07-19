import cron from 'node-cron';
import { logger } from '../config/logger';
import { config } from '../config/config';

/**
 * Keep-alive service to prevent Render free instances from sleeping
 * Pings the server every 30 seconds during active hours
 */
export class KeepAliveService {
  private static instance: KeepAliveService;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): KeepAliveService {
    if (!KeepAliveService.instance) {
      KeepAliveService.instance = new KeepAliveService();
    }
    return KeepAliveService.instance;
  }

  /**
   * Start the keep-alive cron job
   * Runs every 30 seconds to ping the server and keep it awake
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Keep-alive service is already running');
      return;
    }

    // Only run keep-alive in production on Render
    if (!config.isProduction) {
      logger.info('Keep-alive service disabled in development mode');
      return;
    }

    // Run every 30 seconds
    this.cronJob = cron.schedule('*/30 * * * * *', async () => {
      await this.pingServer();
    }, {
      scheduled: false, // Don't start immediately
      name: 'keep-alive-ping',
      timezone: 'UTC'
    });

    this.cronJob.start();
    this.isRunning = true;

    logger.info('Keep-alive service started - pinging every 30 seconds');
  }

  /**
   * Stop the keep-alive service
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    logger.info('Keep-alive service stopped');
  }

  /**
   * Get the status of the keep-alive service
   */
  getStatus(): { isRunning: boolean; nextRun?: Date } {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob ? new Date(Date.now() + 30000) : undefined // Next run in 30 seconds
    };
  }

  /**
   * Internal ping method to keep the server alive
   */
  private async pingServer(): Promise<void> {
    try {
      // Simple internal health check - just touch the database
      const { prisma } = await import('../config/database');
      
      await prisma.$queryRaw`SELECT 1 as ping`;
      
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      logger.debug('Keep-alive ping successful', {
        uptime: Math.round(uptime),
        memoryMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        timestamp: new Date().toISOString()
      });

      // Optional: Clean up old audit logs to prevent database bloat
      if (Math.random() < 0.1) { // 10% chance to run cleanup
        await this.cleanupOldAuditLogs();
      }

    } catch (error) {
      logger.error('Keep-alive ping failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Clean up old audit logs (older than 30 days) to prevent database bloat
   */
  private async cleanupOldAuditLogs(): Promise<void> {
    try {
      const { prisma } = await import('../config/database');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      if (deletedCount.count > 0) {
        logger.info(`Cleaned up ${deletedCount.count} old audit logs`);
      }
    } catch (error) {
      logger.error('Failed to cleanup old audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Manual trigger for testing purposes
   */
  async triggerPing(): Promise<void> {
    logger.info('Manual keep-alive ping triggered');
    await this.pingServer();
  }
}

export const keepAliveService = KeepAliveService.getInstance();
