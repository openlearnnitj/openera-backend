import { Router } from 'express';
import { HealthController } from '../controllers/healthController';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     description: Returns the current health status of the API service including database connectivity, memory usage, and system information
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Service is healthy"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       example: "healthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-19T09:41:07.123Z"
 *                     uptime:
 *                       type: number
 *                       description: "Service uptime in seconds"
 *                       example: 3600
 *                     services:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                           example: "healthy"
 *                         memory:
 *                           type: object
 *                           properties:
 *                             used:
 *                               type: number
 *                               description: "Used memory in MB"
 *                               example: 45
 *                             total:
 *                               type: number
 *                               description: "Total memory in MB"
 *                               example: 128
 *                             percentage:
 *                               type: number
 *                               description: "Memory usage percentage"
 *                               example: 35.16
 *                         cpu:
 *                           type: object
 *                           properties:
 *                             usage:
 *                               type: number
 *                               description: "CPU usage percentage"
 *                               example: 15.25
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     environment:
 *                       type: string
 *                       example: "production"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 requestId:
 *                   type: string
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Service is unhealthy"
 *               data:
 *                 status: "unhealthy"
 *                 timestamp: "2025-07-19T09:41:07.123Z"
 *                 uptime: 3600
 *                 services:
 *                   database: "unhealthy"
 *                   memory:
 *                     used: 0
 *                     total: 0
 *                     percentage: 0
 *                   cpu:
 *                     usage: 0
 *                 version: "1.0.0"
 *                 environment: "production"
 *               timestamp: "2025-07-19T09:41:07.123Z"
 *               requestId: "req_12345"
 */
router.get('/', HealthController.healthCheck);

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed system information
 *     description: Returns comprehensive system information including database statistics, memory usage, and platform details
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Detailed system information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "System information retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     systemInfo:
 *                       type: object
 *                       properties:
 *                         nodeVersion:
 *                           type: string
 *                           example: "v18.17.0"
 *                         platform:
 *                           type: string
 *                           example: "linux"
 *                         architecture:
 *                           type: string
 *                           example: "x64"
 *                         uptime:
 *                           type: number
 *                           example: 3600
 *                         pid:
 *                           type: number
 *                           example: 1234
 *                         environment:
 *                           type: string
 *                           example: "production"
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                     databaseStats:
 *                       type: object
 *                       properties:
 *                         totalSubmissions:
 *                           type: number
 *                           example: 150
 *                         totalAdmins:
 *                           type: number
 *                           example: 5
 *                         totalAuditLogs:
 *                           type: number
 *                           example: 500
 *                         recentSubmissions:
 *                           type: number
 *                           description: "Submissions in last 24 hours"
 *                           example: 10
 *                     memoryUsage:
 *                       type: object
 *                       properties:
 *                         rss:
 *                           type: number
 *                           description: "Resident Set Size in bytes"
 *                         heapTotal:
 *                           type: number
 *                           description: "Total heap size in bytes"
 *                         heapUsed:
 *                           type: number
 *                           description: "Used heap size in bytes"
 *                         external:
 *                           type: number
 *                           description: "External memory in bytes"
 *                     cpuUsage:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: number
 *                           description: "User CPU time in microseconds"
 *                         system:
 *                           type: number
 *                           description: "System CPU time in microseconds"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 requestId:
 *                   type: string
 *       500:
 *         description: Failed to retrieve system information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/detailed', HealthController.systemInfo);

/**
 * @swagger
 * /api/health/db:
 *   get:
 *     summary: Database health check
 *     description: Tests database connectivity and returns detailed database health information
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Database is healthy and connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Database connection is healthy"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [connected, disconnected]
 *                       example: "connected"
 *                     responseTime:
 *                       type: number
 *                       description: "Database response time in milliseconds"
 *                       example: 15
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     connectionInfo:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: string
 *                           example: "hackathon_db"
 *                         schema:
 *                           type: string
 *                           example: "public"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 requestId:
 *                   type: string
 *       503:
 *         description: Database is unhealthy or disconnected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Database connection failed"
 *               error: "DATABASE_ERROR"
 *               details:
 *                 connectionError: "Connection timeout"
 *               timestamp: "2025-07-19T09:41:07.123Z"
 *               requestId: "req_12345"
 */
router.get('/db', HealthController.databaseTest);

export default router;
