import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { handleValidation } from '../middleware/validation';
import { 
  adminLoginValidation, 
  adminChangePasswordValidation, 
  refreshTokenValidation 
} from '../validators/validation';
import { adminRateLimit } from '../middleware/rateLimit';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticate admin user and receive access and refresh tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             admin:
 *               summary: Admin login
 *               value:
 *                 email: "admin@openera.com"
 *                 password: "AdminPassword123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginResponse'
 *             examples:
 *               success:
 *                 summary: Successful login
 *                 value:
 *                   success: true
 *                   message: "Login successful"
 *                   data:
 *                     accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expiresIn: "15m"
 *                     admin:
 *                       id: "cmd9qcf5d000010b31uvyqw8v"
 *                       email: "admin@openera.com"
 *                       name: "System Administrator"
 *                       role: "admin"
 *                       lastLoginAt: "2025-07-19T09:41:07.000Z"
 *                   timestamp: "2025-07-19T09:41:07.123Z"
 *                   requestId: "req_12345"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_credentials:
 *                 summary: Invalid email or password
 *                 value:
 *                   success: false
 *                   message: "Invalid email or password"
 *                   error: "INVALID_CREDENTIALS"
 *                   timestamp: "2025-07-19T09:41:07.123Z"
 *                   requestId: "req_12345"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/login', adminRateLimit, adminLoginValidation, handleValidation, AuthController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Use refresh token to get a new access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token received from login
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: New access token generated
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
 *                         accessToken:
 *                           type: string
 *                           description: New JWT access token
 *                         expiresIn:
 *                           type: string
 *                           description: Token expiration time
 *                           example: "15m"
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/refresh', adminRateLimit, refreshTokenValidation, handleValidation, AuthController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Admin logout
 *     description: Invalidate the current refresh token and log out the admin
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "Logout successful"
 *               timestamp: "2025-07-19T09:41:07.123Z"
 *               requestId: "req_12345"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   put:
 *     summary: Change admin password
 *     description: Change the password for the currently authenticated admin
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Current password
 *                 example: "CurrentPassword123!"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
 *                 description: New password (min 8 chars, must contain uppercase, lowercase, digit, and special character)
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid current password or weak new password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/change-password', authenticateToken, adminChangePasswordValidation, handleValidation, AuthController.changePassword);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get admin profile
 *     description: Get the profile information of the currently authenticated admin
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                         id:
 *                           type: string
 *                           example: "cmd9qcf5d000010b31uvyqw8v"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "admin@openera.com"
 *                         name:
 *                           type: string
 *                           example: "System Administrator"
 *                         role:
 *                           type: string
 *                           example: "admin"
 *                         isActive:
 *                           type: boolean
 *                           example: true
 *                         lastLoginAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-07-19T09:41:07.000Z"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-07-19T09:40:25.000Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

export default router;
