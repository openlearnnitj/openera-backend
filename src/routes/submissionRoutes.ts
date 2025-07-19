import { Router } from 'express';
import { SubmissionController } from '../controllers/submissionController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidation, preventDuplicateSubmission } from '../middleware/validation';
import { submissionRateLimit, adminRateLimit } from '../middleware/rateLimit';
import {
  createSubmissionValidation,
  updateSubmissionValidation,
  submissionQueryValidation,
  idParamValidation,
} from '../validators/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/submissions:
 *   post:
 *     summary: Create a new submission
 *     tags: [Submissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamName
 *               - teamLeader
 *               - email
 *             properties:
 *               teamName:
 *                 type: string
 *                 example: "AI Innovators"
 *               teamLeader:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               demoUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://demo.aiinnovators.com"
 *               githubRepository:
 *                 type: string
 *                 format: uri
 *                 example: "https://github.com/aiinnovators/fintech-ai"
 *               presentationLink:
 *                 type: string
 *                 format: uri
 *                 example: "https://drive.google.com/file/d/1234567890"
 *     responses:
 *       201:
 *         description: Submission created successfully
 *       400:
 *         description: Validation error or duplicate submission
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  '/',
  submissionRateLimit,
  createSubmissionValidation,
  handleValidation,
  preventDuplicateSubmission,
  SubmissionController.createSubmission
);

/**
 * @swagger
 * /api/v1/submissions/check-email:
 *   get:
 *     summary: Check if email is already used for submission
 *     tags: [Submissions]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Email check completed
 */
router.get(
  '/check-email',
  SubmissionController.checkEmailExists
);

/**
 * @swagger
 * /api/v1/submissions:
 *   get:
 *     summary: Get all submissions (Admin only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, UNDER_REVIEW, APPROVED, REJECTED, REQUIRES_CHANGES]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [submittedAt, updatedAt, teamName, status]
 *           default: submittedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submissions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  adminRateLimit,
  authenticateToken,
  requireRole(['admin']),
  submissionQueryValidation,
  handleValidation,
  SubmissionController.getSubmissions
);

/**
 * @swagger
 * /api/v1/submissions/stats:
 *   get:
 *     summary: Get submission statistics (Admin only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Submission statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/stats',
  adminRateLimit,
  authenticateToken,
  requireRole(['admin']),
  SubmissionController.getSubmissionStats
);

/**
 * @swagger
 * /api/v1/submissions/bulk-update:
 *   patch:
 *     summary: Bulk update submission status (Admin only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - submissionIds
 *               - status
 *             properties:
 *               submissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, UNDER_REVIEW, APPROVED, REJECTED, REQUIRES_CHANGES]
 *     responses:
 *       200:
 *         description: Submissions updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch(
  '/bulk-update',
  adminRateLimit,
  authenticateToken,
  requireRole(['admin']),
  SubmissionController.bulkUpdateStatus
);

/**
 * @swagger
 * /api/v1/submissions/{id}:
 *   get:
 *     summary: Get a submission by ID (Admin only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submission retrieved successfully
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/:id',
  adminRateLimit,
  authenticateToken,
  requireRole(['admin']),
  idParamValidation,
  handleValidation,
  SubmissionController.getSubmissionById
);

/**
 * @swagger
 * /api/v1/submissions/{id}:
 *   put:
 *     summary: Update a submission (Admin only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teamName:
 *                 type: string
 *               teamLeader:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               status:
 *                 type: string
 *                 enum: [PENDING, UNDER_REVIEW, APPROVED, REJECTED, REQUIRES_CHANGES]
 *               demoUrl:
 *                 type: string
 *                 format: uri
 *               githubRepository:
 *                 type: string
 *                 format: uri
 *               presentationLink:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Submission updated successfully
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  '/:id',
  adminRateLimit,
  authenticateToken,
  requireRole(['admin']),
  updateSubmissionValidation,
  handleValidation,
  SubmissionController.updateSubmission
);

/**
 * @swagger
 * /api/v1/submissions/{id}:
 *   delete:
 *     summary: Delete a submission (Admin only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submission deleted successfully
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/:id',
  adminRateLimit,
  authenticateToken,
  requireRole(['admin']),
  idParamValidation,
  handleValidation,
  SubmissionController.deleteSubmission
);

export default router;
