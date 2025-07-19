import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Open Era Hackathon API',
      version: '1.0.0',
      description: `
        Backend API for the Open Era Hackathon submission system.
        
        This API allows:
        - Hackathon participants to submit their projects
        - Admins to review, approve, and manage submissions
        - Comprehensive audit logging of all activities
        - Secure JWT-based authentication for admin users
        
        ## Security
        - Rate limiting on all endpoints
        - IP tracking and duplicate submission prevention
        - Secure password hashing with bcrypt
        - JWT tokens with refresh token rotation
        
        ## Features
        - RESTful API design
        - Comprehensive validation
        - Audit logging for all operations
        - Filtering and sorting capabilities
        - Health check endpoints
      `,
      contact: {
        name: 'Open Era Support',
        email: 'support@openera.openlearn.org.in',
        url: 'https://openera.openlearn.org.in'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: config.isProduction ? 'https://api.openera.openlearn.org.in' : `http://localhost:${config.port}`,
        description: config.isProduction ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Enter your JWT token (without "Bearer " prefix)'
        }
      },
      schemas: {
        // Common response schemas
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful'
            },
            message: {
              type: 'string',
              description: 'Human-readable message'
            },
            data: {
              type: 'object',
              description: 'Response data (structure varies by endpoint)'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'ISO timestamp of the response'
            },
            requestId: {
              type: 'string',
              description: 'Unique request identifier for tracking'
            }
          },
          required: ['success', 'message', 'timestamp']
        },
        
        // Error response schema
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Error code or type'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            requestId: {
              type: 'string'
            }
          },
          required: ['success', 'message', 'timestamp']
        },
        
        // Submission schemas
        Submission: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique submission identifier'
            },
            teamName: {
              type: 'string',
              description: 'Name of the team',
              example: 'AI Innovators'
            },
            teamLeader: {
              type: 'string',
              description: 'Name of the team leader',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Contact email address',
              example: 'john@example.com'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_CHANGES'],
              description: 'Current submission status'
            },
            demoUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL to live demo',
              example: 'https://demo.aiinnovators.com'
            },
            githubRepository: {
              type: 'string',
              format: 'uri',
              description: 'GitHub repository URL',
              example: 'https://github.com/aiinnovators/fintech-ai'
            },
            presentationLink: {
              type: 'string',
              format: 'uri',
              description: 'Presentation file link (Google Drive, etc.)',
              example: 'https://drive.google.com/file/d/1234567890'
            },
            submittedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Submission timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          },
          required: ['teamName', 'teamLeader', 'email']
        },
        
        CreateSubmissionRequest: {
          type: 'object',
          properties: {
            teamName: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Name of the team',
              example: 'AI Innovators'
            },
            teamLeader: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Name of the team leader',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Contact email address',
              example: 'john@example.com'
            },
            demoUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL to live demo (optional)',
              example: 'https://demo.aiinnovators.com'
            },
            githubRepository: {
              type: 'string',
              format: 'uri',
              description: 'GitHub repository URL (optional)',
              example: 'https://github.com/aiinnovators/fintech-ai'
            },
            presentationLink: {
              type: 'string',
              format: 'uri',
              description: 'Presentation file link (optional)',
              example: 'https://drive.google.com/file/d/1234567890'
            }
          },
          required: ['teamName', 'teamLeader', 'email']
        },
        
        // Auth schemas
        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Admin email address'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Admin password'
            }
          },
          required: ['email', 'password']
        },
        
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token'
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token'
            },
            expiresIn: {
              type: 'string',
              description: 'Access token expiration time'
            },
            admin: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                lastLoginAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        
        // Change password request
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              minLength: 8,
              description: 'Current password'
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
              description: 'New password (min 8 chars, must contain uppercase, lowercase, digit, and special character)'
            }
          }
        },

        // Refresh token request
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Valid refresh token received from login'
            }
          }
        },

        // Status update request
        StatusUpdateRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_CHANGES'],
              description: 'New status for the submission'
            },
            reason: {
              type: 'string',
              description: 'Optional reason for status change'
            }
          }
        },

        // API info response
        ApiInfoResponse: {
          type: 'object',
          properties: {
            version: {
              type: 'string',
              example: '1.0.0'
            },
            environment: {
              type: 'string',
              example: 'production'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            endpoints: {
              type: 'object',
              properties: {
                submissions: {
                  type: 'string',
                  example: '/api/v1/submissions'
                },
                auth: {
                  type: 'string',
                  example: '/api/v1/auth'
                },
                audit: {
                  type: 'string',
                  example: '/api/v1/audit'
                },
                health: {
                  type: 'string',
                  example: '/api/v1/health'
                },
                docs: {
                  type: 'string',
                  example: '/docs'
                }
              }
            }
          }
        },

        // Audit log schema (if not already defined)
        AuditLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique audit log identifier'
            },
            action: {
              type: 'string',
              description: 'Action performed'
            },
            entity: {
              type: 'string',
              description: 'Entity affected'
            },
            entityId: {
              type: 'string',
              description: 'ID of the affected entity'
            },
            adminId: {
              type: 'string',
              description: 'ID of the admin who performed the action'
            },
            ipAddress: {
              type: 'string',
              description: 'IP address of the request'
            },
            userAgent: {
              type: 'string',
              description: 'User agent string'
            },
            details: {
              type: 'object',
              description: 'Additional details about the action'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'When the action occurred'
            }
          }
        }
      },
      
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                missing_token: {
                  summary: 'Missing authentication token',
                  value: {
                    success: false,
                    message: 'Access token required',
                    error: 'MISSING_TOKEN',
                    timestamp: '2025-07-19T09:41:07.123Z',
                    requestId: 'req_12345'
                  }
                },
                invalid_token: {
                  summary: 'Invalid or expired token',
                  value: {
                    success: false,
                    message: 'Invalid or expired token',
                    error: 'INVALID_TOKEN',
                    timestamp: '2025-07-19T09:41:07.123Z',
                    requestId: 'req_12345'
                  }
                }
              }
            }
          }
        },
        
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Insufficient permissions',
                error: 'FORBIDDEN',
                timestamp: '2025-07-19T09:41:07.123Z',
                requestId: 'req_12345'
              }
            }
          }
        },
        
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                general_rate_limit: {
                  summary: 'General rate limit exceeded',
                  value: {
                    success: false,
                    message: 'Rate limit exceeded. Try again later.',
                    error: 'RATE_LIMIT_EXCEEDED',
                    timestamp: '2025-07-19T09:41:07.123Z',
                    requestId: 'req_12345'
                  }
                },
                submission_rate_limit: {
                  summary: 'Submission rate limit exceeded',
                  value: {
                    success: false,
                    message: 'Too many submission attempts. Only 5 submissions allowed per hour.',
                    error: 'SUBMISSION_RATE_LIMIT',
                    timestamp: '2025-07-19T09:41:07.123Z',
                    requestId: 'req_12345'
                  }
                }
              }
            }
          }
        },
        
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Validation failed',
                error: 'VALIDATION_ERROR',
                details: {
                  errors: [
                    {
                      field: 'email',
                      message: 'Invalid email format'
                    },
                    {
                      field: 'teamName',
                      message: 'Team name is required'
                    }
                  ]
                },
                timestamp: '2025-07-19T09:41:07.123Z',
                requestId: 'req_12345'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'General',
        description: 'General API information and endpoints'
      },
      {
        name: 'Submissions',
        description: 'Hackathon submission management'
      },
      {
        name: 'Authentication',
        description: 'Admin authentication and authorization'
      },
      {
        name: 'Audit',
        description: 'Audit log management and tracking'
      },
      {
        name: 'Health',
        description: 'System health and monitoring'
      },
      {
        name: 'Documentation',
        description: 'API documentation endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts'
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
