# Open Era Hackathon Backend API

A secure, scalable backend API for the Open Era Hackathon submission system built with Node.js, TypeScript, Express, Prisma, and PostgreSQL.

## Features

- **Secure Submission System**: Accept and manage hackathon submissions with duplicate prevention
- **Admin Dashboard API**: Complete CRUD operations for submission management
- **JWT Authentication**: Secure admin authentication with refresh token rotation
- **Comprehensive Audit Logging**: Track all system activities and changes
- **Rate Limiting**: Protect against spam and abuse
- **IP Tracking**: Monitor submission sources and prevent fraud
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Docker Support**: Containerized deployment ready
- **Health Monitoring**: Health check endpoints for system monitoring

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Validation**: express-validator with custom schemas
- **Security**: helmet, cors, rate limiting, bcrypt
- **Documentation**: Swagger/OpenAPI 3.0
- **Containerization**: Docker & Docker Compose
- **Logging**: Custom Winston-based logger

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- Docker & Docker Compose (optional but recommended)
- npm or yarn package manager

## Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd openera-backend
   ```

2. **Start with Docker Compose**
   ```bash
   # For development
   npm run docker:dev
   
   # For production
   npm run docker:prod
   ```

3. **Setup database and seed admin**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Access the API**
   - API Base URL: http://localhost:3000
   - Documentation: http://localhost:3000/docs
   - Health Check: http://localhost:3000/ping

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup database**
   ```bash
   # Start PostgreSQL (if not using Docker)
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev:watch
   ```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/openera_hackathon

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin Configuration
ADMIN_EMAIL=admin@openera.com
ADMIN_PASSWORD=SecureAdminPassword123!
ADMIN_NAME=System Administrator

# Security
CORS_ORIGIN=http://localhost:3000,https://openera.openlearn.org.in
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SUBMISSION_RATE_LIMIT_MAX=5
SUBMISSION_RATE_LIMIT_WINDOW_MS=3600000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/openera.log
```

## API Documentation

### Interactive Documentation
Visit `/docs` endpoint for interactive Swagger UI documentation.

### API Endpoints

#### Submissions
- `POST /api/v1/submissions` - Create new submission
- `GET /api/v1/submissions` - List submissions (Admin)
- `GET /api/v1/submissions/:id` - Get submission details (Admin)
- `PUT /api/v1/submissions/:id` - Update submission (Admin)
- `DELETE /api/v1/submissions/:id` - Delete submission (Admin)
- `PATCH /api/v1/submissions/:id/status` - Update submission status (Admin)

#### Authentication
- `POST /api/v1/auth/login` - Admin login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Admin logout
- `PUT /api/v1/auth/change-password` - Change admin password
- `GET /api/v1/auth/profile` - Get admin profile

#### Audit Logs
- `GET /api/v1/audit` - List audit logs (Admin)
- `GET /api/v1/audit/submission/:id` - Get submission audit logs (Admin)
- `GET /api/v1/audit/admin/:id` - Get admin activity logs (Admin)
- `GET /api/v1/audit/stats` - Get audit statistics (Admin)

#### Health & Monitoring
- `GET /ping` - Basic health check
- `GET /api/v1/health` - System health check
- `GET /api/v1/health/detailed` - Detailed system information
- `GET /api/v1/health/db` - Database connectivity check

## Security Features

### Authentication & Authorization
- JWT-based authentication for admin users
- Refresh token rotation for enhanced security
- Role-based access control
- Password hashing with bcrypt (12 rounds)

### Rate Limiting
- Global rate limiting: 100 requests per 15 minutes
- Submission rate limiting: 5 submissions per hour per IP
- Admin endpoint rate limiting: Enhanced protection for admin operations
- Dynamic rate limiting based on endpoint sensitivity

### Data Protection
- Input validation and sanitization
- SQL injection prevention with Prisma
- XSS protection with helmet
- CORS configuration for cross-origin requests
- IP address tracking and logging

### Audit Trail
- Comprehensive logging of all admin actions
- Submission tracking and history
- IP address and user agent logging
- Automatic audit log creation for sensitive operations

## Database Schema

### Core Models
- **Admin**: Administrator users with authentication
- **Submission**: Hackathon project submissions
- **AuditLog**: System activity tracking
- **RefreshToken**: JWT refresh token management

### Key Features
- Email uniqueness for submissions (prevents duplicates)
- Automatic timestamp tracking
- Soft delete support for submissions
- Comprehensive audit trail relationships

## Monitoring & Logging

### Health Checks
- `/ping` - Basic server responsiveness
- `/api/v1/health` - Comprehensive system health
- `/api/v1/health/db` - Database connectivity
- Docker health checks included

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking and reporting
- Audit trail logging
- Configurable log levels

## Deployment

### Docker Deployment
```bash
# Build and deploy
docker-compose up -d

# Check logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale app=3
```

### Manual Deployment
```bash
# Build application
npm run build

# Start production server
npm start
```

### Environment-Specific Configurations

#### Development
- Enhanced logging and debugging
- CORS enabled for localhost
- Database migrations run automatically

#### Production
- Optimized for performance
- Security headers enforced
- Rate limiting strictly enforced
- Health checks enabled

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run dev:watch` - Start development server with auto-reload
- `npm run build` - Build production application
- `npm start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with admin user
- `npm run db:studio` - Open Prisma Studio
- `npm run docker:dev` - Start development Docker environment
- `npm run docker:prod` - Start production Docker environment
- `npm run setup:dev` - Complete development setup

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Links

- [Documentation](https://api.openera.openlearn.org.in/docs)
- [Website](https://openera.openlearn.org.in)

