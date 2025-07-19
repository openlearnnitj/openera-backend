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
