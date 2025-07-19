import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    submissionMax: parseInt(process.env.SUBMISSION_RATE_LIMIT_MAX || '5', 10),
    submissionWindowMs: parseInt(process.env.SUBMISSION_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
  },
  
  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },
  
  // Admin Configuration
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@openera.com',
    password: process.env.ADMIN_PASSWORD || 'SecureAdminPassword123!',
    name: process.env.ADMIN_NAME || 'System Administrator',
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/openera.log',
  },
  
  // API Documentation Configuration
  api: {
    docsUrl: process.env.API_DOCS_URL || '/docs',
    title: process.env.API_TITLE || 'Open Era Hackathon API',
    version: process.env.API_VERSION || '1.0.0',
    description: process.env.API_DESCRIPTION || 'Backend API for Open Era Hackathon submission system',
  },
  
  // Development mode check
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
