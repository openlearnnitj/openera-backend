import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/config';
import { logger } from './config/logger';
import prisma from './config/database';
import routes from './routes';

// Middleware imports
import { requestLogger } from './middleware/request';
import { errorHandler } from './middleware/errorHandler';
import { generalRateLimit } from './middleware/rateLimit';

const app = express();

// Trust proxy if behind reverse proxy (for IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.security.corsOrigin;
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const error = new Error('Not allowed by CORS');
    error.name = 'CorsError';
    callback(error, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Rate limiting
app.use(generalRateLimit);

// Request logging
app.use(requestLogger);

// API routes
app.use('/', routes);

// Health check endpoint (outside of rate limiting)
app.get('/ping', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    const port = config.port || 3000;
    const server = app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`JWT Secret configured: ${!!config.jwt.secret}`);
      logger.info(`Database URL configured: ${!!config.databaseUrl}`);
    });

    // Handle server errors
    server.on('error', (error: Error) => {
      logger.error('Server error:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
