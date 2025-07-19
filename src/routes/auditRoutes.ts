import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { authenticateToken } from '../middleware/auth';
import { handleValidation } from '../middleware/validation';
import { submissionQueryValidation } from '../validators/validation';
import { adminRateLimit } from '../middleware/rateLimit';

const router = Router();

/**
 * @swagger
 * /api/v1/audit:
 *   get:
 *     summary: Get audit logs (Admin only)
 *     description: Retrieve a paginated list of audit logs with filtering options. Shows all system activities including submissions, admin actions, and status changes.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, STATUS_CHANGE, REVIEW, APPROVE, REJECT]
 *         description: Filter by audit action type
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [SUBMISSION, ADMIN]
 *         description: Filter by entity type
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *         description: Filter by admin who performed the action
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs until this date (YYYY-MM-DD)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, action, entityType]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         logs:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/AuditLog'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                               example: 1
 *                             limit:
 *                               type: integer
 *                               example: 20
 *                             total:
 *                               type: integer
 *                               example: 150
 *                             pages:
 *                               type: integer
 *                               example: 8
 *                         summary:
 *                           type: object
 *                           properties:
 *                             totalActions:
 *                               type: integer
 *                               description: Total number of audit actions
 *                             actionCounts:
 *                               type: object
 *                               description: Count of each action type
 *             examples:
 *               success:
 *                 summary: Successful audit log retrieval
 *                 value:
 *                   success: true
 *                   message: "Audit logs retrieved successfully"
 *                   data:
 *                     logs:
 *                       - id: "audit_123"
 *                         action: "CREATE"
 *                         entityType: "SUBMISSION"
 *                         entityId: "sub_456"
 *                         adminId: null
 *                         description: "New submission created"
 *                         newValues:
 *                           teamName: "AI Innovators"
 *                           email: "john@example.com"
 *                         ipAddress: "192.168.1.1"
 *                         userAgent: "Mozilla/5.0..."
 *                         createdAt: "2025-07-19T09:43:13.000Z"
 *                     pagination:
 *                       page: 1
 *                       limit: 20
 *                       total: 45
 *                       pages: 3
 *                   timestamp: "2025-07-19T10:30:00.000Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', authenticateToken, adminRateLimit, submissionQueryValidation, handleValidation, AuditController.getAuditLogs);

/**
 * @swagger
 * /api/v1/audit/submission/{submissionId}:
 *   get:
 *     summary: Get audit logs for a specific submission (Admin only)
 *     description: Retrieve all audit logs related to a specific submission, showing the complete history of changes and actions.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID to get audit logs for
 *     responses:
 *       200:
 *         description: Submission audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         submissionId:
 *                           type: string
 *                           description: ID of the submission
 *                         logs:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/AuditLog'
 *                         timeline:
 *                           type: array
 *                           description: Chronological timeline of submission events
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 format: date-time
 *                               action:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               admin:
 *                                 type: string
 *                                 nullable: true
 *             examples:
 *               success:
 *                 summary: Submission audit history
 *                 value:
 *                   success: true
 *                   message: "Submission audit logs retrieved successfully"
 *                   data:
 *                     submissionId: "sub_456"
 *                     logs:
 *                       - id: "audit_123"
 *                         action: "CREATE"
 *                         description: "Submission created"
 *                         createdAt: "2025-07-19T09:43:13.000Z"
 *                       - id: "audit_124"
 *                         action: "STATUS_CHANGE"
 *                         description: "Status changed from PENDING to UNDER_REVIEW"
 *                         adminId: "admin_789"
 *                         createdAt: "2025-07-19T10:15:00.000Z"
 *                     timeline:
 *                       - date: "2025-07-19T09:43:13.000Z"
 *                         action: "CREATED"
 *                         description: "Submission received"
 *                       - date: "2025-07-19T10:15:00.000Z"
 *                         action: "REVIEWED"
 *                         description: "Moved to review by Admin"
 *                         admin: "System Administrator"
 *       404:
 *         description: Submission not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/submission/:submissionId', authenticateToken, adminRateLimit, AuditController.getSubmissionAuditLogs);

/**
 * @swagger
 * /api/v1/audit/admin/{adminId}:
 *   get:
 *     summary: Get activity logs for a specific admin (Admin only)
 *     description: Retrieve all audit logs for actions performed by a specific admin user.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID to get activity logs for
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of days to look back (default 30)
 *     responses:
 *       200:
 *         description: Admin activity logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         adminId:
 *                           type: string
 *                         adminName:
 *                           type: string
 *                         logs:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/AuditLog'
 *                         statistics:
 *                           type: object
 *                           properties:
 *                             totalActions:
 *                               type: integer
 *                             loginCount:
 *                               type: integer
 *                             submissionsReviewed:
 *                               type: integer
 *                             statusChanges:
 *                               type: integer
 *                             lastActivity:
 *                               type: string
 *                               format: date-time
 *             examples:
 *               success:
 *                 summary: Admin activity summary
 *                 value:
 *                   success: true
 *                   message: "Admin activity retrieved successfully"
 *                   data:
 *                     adminId: "admin_789"
 *                     adminName: "System Administrator"
 *                     logs:
 *                       - id: "audit_125"
 *                         action: "LOGIN"
 *                         description: "Admin logged in"
 *                         createdAt: "2025-07-19T09:41:07.000Z"
 *                       - id: "audit_126"
 *                         action: "STATUS_CHANGE"
 *                         entityType: "SUBMISSION"
 *                         description: "Changed submission status to APPROVED"
 *                         createdAt: "2025-07-19T10:15:00.000Z"
 *                     statistics:
 *                       totalActions: 25
 *                       loginCount: 5
 *                       submissionsReviewed: 12
 *                       statusChanges: 8
 *                       lastActivity: "2025-07-19T10:15:00.000Z"
 *       404:
 *         description: Admin not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/admin/:adminId', authenticateToken, adminRateLimit, AuditController.getAdminActivity);

/**
 * @swagger
 * /api/v1/audit/stats:
 *   get:
 *     summary: Get audit log statistics (Admin only)
 *     description: Retrieve comprehensive statistics about system activity, including action counts, trends, and usage patterns.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Audit statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         overview:
 *                           type: object
 *                           properties:
 *                             totalActions:
 *                               type: integer
 *                               description: Total number of audit actions
 *                             totalSubmissions:
 *                               type: integer
 *                               description: Total submissions created
 *                             totalLogins:
 *                               type: integer
 *                               description: Total admin logins
 *                             totalStatusChanges:
 *                               type: integer
 *                               description: Total status changes
 *                         actionBreakdown:
 *                           type: object
 *                           description: Count of each action type
 *                           additionalProperties:
 *                             type: integer
 *                         submissionStats:
 *                           type: object
 *                           properties:
 *                             pending:
 *                               type: integer
 *                             underReview:
 *                               type: integer
 *                             approved:
 *                               type: integer
 *                             rejected:
 *                               type: integer
 *                             requiresChanges:
 *                               type: integer
 *                         adminActivity:
 *                           type: array
 *                           description: Most active admins
 *                           items:
 *                             type: object
 *                             properties:
 *                               adminId:
 *                                 type: string
 *                               adminName:
 *                                 type: string
 *                               actionCount:
 *                                 type: integer
 *                               lastActivity:
 *                                 type: string
 *                                 format: date-time
 *                         timeline:
 *                           type: array
 *                           description: Activity timeline for the period
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 format: date
 *                               actions:
 *                                 type: integer
 *                               submissions:
 *                                 type: integer
 *             examples:
 *               success:
 *                 summary: System audit statistics
 *                 value:
 *                   success: true
 *                   message: "Audit statistics retrieved successfully"
 *                   data:
 *                     overview:
 *                       totalActions: 150
 *                       totalSubmissions: 45
 *                       totalLogins: 15
 *                       totalStatusChanges: 32
 *                     actionBreakdown:
 *                       CREATE: 45
 *                       STATUS_CHANGE: 32
 *                       LOGIN: 15
 *                       UPDATE: 8
 *                     submissionStats:
 *                       pending: 12
 *                       underReview: 8
 *                       approved: 20
 *                       rejected: 3
 *                       requiresChanges: 2
 *                     adminActivity:
 *                       - adminId: "admin_789"
 *                         adminName: "System Administrator"
 *                         actionCount: 55
 *                         lastActivity: "2025-07-19T10:15:00.000Z"
 *                     timeline:
 *                       - date: "2025-07-19"
 *                         actions: 25
 *                         submissions: 8
 *                       - date: "2025-07-18"
 *                         actions: 18
 *                         submissions: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats', authenticateToken, adminRateLimit, AuditController.getAuditStats);

export default router;
