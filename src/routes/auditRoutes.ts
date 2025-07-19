import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { authenticateToken } from '../middleware/auth';
import { handleValidation } from '../middleware/validation';
import { submissionQueryValidation } from '../validators/validation';
import { adminRateLimit } from '../middleware/rateLimit';

const router = Router();

/**
 * @route GET /api/audit
 * @desc Get audit logs with filtering and pagination
 * @access Private (Admin only)
 */
router.get('/', authenticateToken, adminRateLimit, submissionQueryValidation, handleValidation, AuditController.getAuditLogs);

/**
 * @route GET /api/audit/submission/:submissionId
 * @desc Get audit logs for a specific submission
 * @access Private (Admin only)
 */
router.get('/submission/:submissionId', authenticateToken, adminRateLimit, AuditController.getSubmissionAuditLogs);

/**
 * @route GET /api/audit/admin/:adminId
 * @desc Get audit logs for a specific admin
 * @access Private (Admin only)
 */
router.get('/admin/:adminId', authenticateToken, adminRateLimit, AuditController.getAdminActivity);

/**
 * @route GET /api/audit/stats
 * @desc Get audit log statistics
 * @access Private (Admin only)
 */
router.get('/stats', authenticateToken, adminRateLimit, AuditController.getAuditStats);

export default router;
