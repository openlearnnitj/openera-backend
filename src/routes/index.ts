import { Router } from 'express';
import submissionRoutes from './submissionRoutes';
import authRoutes from './authRoutes';
import auditRoutes from './auditRoutes';
import healthRoutes from './healthRoutes';
import docsRoutes from './docsRoutes';

const router = Router();

// Mount route modules
router.use('/api/v1/submissions', submissionRoutes);
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/audit', auditRoutes);
router.use('/api/v1/health', healthRoutes);

// Documentation routes
router.use('/docs', docsRoutes);

// API root endpoint
/**
 * @swagger
 * /api/v1:
 *   get:
 *     summary: API information and available endpoints
 *     description: Returns general information about the API including version, environment, and available endpoints
 *     tags: [General]
 *     security: []
 *     responses:
 *       200:
 *         description: API information retrieved successfully
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
 *                   example: "Open Era Hackathon API v1.0"
 *                 data:
 *                   $ref: '#/components/schemas/ApiInfoResponse'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 requestId:
 *                   type: string
 *             example:
 *               success: true
 *               message: "Open Era Hackathon API v1.0"
 *               data:
 *                 version: "1.0.0"
 *                 environment: "production"
 *                 timestamp: "2025-07-19T09:41:07.123Z"
 *                 endpoints:
 *                   submissions: "/api/v1/submissions"
 *                   auth: "/api/v1/auth"
 *                   audit: "/api/v1/audit"
 *                   health: "/api/v1/health"
 *                   docs: "/docs"
 *               timestamp: "2025-07-19T09:41:07.123Z"
 *               requestId: "req_12345"
 */
router.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'Open Era Hackathon API v1.0',
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      endpoints: {
        submissions: '/api/v1/submissions',
        auth: '/api/v1/auth',
        audit: '/api/v1/audit',
        health: '/api/v1/health',
        docs: '/docs',
      },
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

export default router;
