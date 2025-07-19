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
 * @route POST /api/auth/login
 * @desc Admin login
 * @access Public
 */
router.post('/login', adminRateLimit, adminLoginValidation, handleValidation, AuthController.login);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public (requires refresh token)
 */
router.post('/refresh', adminRateLimit, refreshTokenValidation, handleValidation, AuthController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Admin logout (invalidates refresh token)
 * @access Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route PUT /api/auth/change-password
 * @desc Change admin password
 * @access Private
 */
router.put('/change-password', authenticateToken, adminChangePasswordValidation, handleValidation, AuthController.changePassword);

/**
 * @route GET /api/auth/profile
 * @desc Get admin profile
 * @access Private
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

export default router;
