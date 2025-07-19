import { body, query, param } from 'express-validator';

// Submission validation schemas
export const createSubmissionValidation = [
  body('teamName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Team name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_\.]+$/)
    .withMessage('Team name can only contain letters, numbers, spaces, hyphens, underscores, and dots'),

  body('teamLeader')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Team leader name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-\.]+$/)
    .withMessage('Team leader name can only contain letters, spaces, hyphens, and dots'),

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email address is too long'),

  body('demoUrl')
    .optional()
    .isURL({ require_protocol: true })
    .withMessage('Demo URL must be a valid URL with protocol (http/https)')
    .isLength({ max: 500 })
    .withMessage('Demo URL is too long'),

  body('githubRepository')
    .optional()
    .isURL({ require_protocol: true })
    .withMessage('GitHub repository must be a valid URL')
    .matches(/^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/)
    .withMessage('GitHub repository must be a valid GitHub URL')
    .isLength({ max: 500 })
    .withMessage('GitHub repository URL is too long'),

  body('presentationLink')
    .optional()
    .isURL({ require_protocol: true })
    .withMessage('Presentation link must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Presentation link is too long'),
];

// Admin authentication validation schemas
export const adminLoginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

export const adminChangePasswordValidation = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
];

// Submission update validation schemas
export const updateSubmissionValidation = [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Submission ID is required'),

  body('teamName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Team name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_\.]+$/)
    .withMessage('Team name can only contain letters, numbers, spaces, hyphens, underscores, and dots'),

  body('teamLeader')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Team leader name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-\.]+$/)
    .withMessage('Team leader name can only contain letters, spaces, hyphens, and dots'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email address is too long'),

  body('status')
    .optional()
    .isIn(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_CHANGES'])
    .withMessage('Status must be one of: PENDING, UNDER_REVIEW, APPROVED, REJECTED, REQUIRES_CHANGES'),

  body('demoUrl')
    .optional()
    .isURL({ require_protocol: true })
    .withMessage('Demo URL must be a valid URL with protocol (http/https)')
    .isLength({ max: 500 })
    .withMessage('Demo URL is too long'),

  body('githubRepository')
    .optional()
    .isURL({ require_protocol: true })
    .withMessage('GitHub repository must be a valid URL')
    .matches(/^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/)
    .withMessage('GitHub repository must be a valid GitHub URL')
    .isLength({ max: 500 })
    .withMessage('GitHub repository URL is too long'),

  body('presentationLink')
    .optional()
    .isURL({ require_protocol: true })
    .withMessage('Presentation link must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Presentation link is too long'),
];

// Query parameter validation schemas
export const submissionQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_CHANGES'])
    .withMessage('Status must be one of: PENDING, UNDER_REVIEW, APPROVED, REJECTED, REQUIRES_CHANGES'),

  query('sortBy')
    .optional()
    .isIn(['submittedAt', 'updatedAt', 'teamName', 'status'])
    .withMessage('Sort field must be one of: submittedAt, updatedAt, teamName, status'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
];

// ID parameter validation
export const idParamValidation = [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID parameter is required and must be a valid string'),
];

// Refresh token validation
export const refreshTokenValidation = [
  body('refreshToken')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Refresh token is required'),
];
