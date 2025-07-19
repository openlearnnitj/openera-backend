import { Router } from 'express';
import { HealthController } from '../controllers/healthController';

const router = Router();

/**
 * @route GET /api/health
 * @desc Basic health check
 * @access Public
 */
router.get('/', HealthController.healthCheck);

/**
 * @route GET /api/health/detailed
 * @desc Detailed system information
 * @access Public
 */
router.get('/detailed', HealthController.systemInfo);

/**
 * @route GET /api/health/db
 * @desc Database health check
 * @access Public
 */
router.get('/db', HealthController.databaseTest);

export default router;
