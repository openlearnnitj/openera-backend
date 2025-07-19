import { Request } from 'express';
import { TokenPayload } from '../utils/jwt';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      admin?: TokenPayload;
      requestId?: string;
    }
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  requestId?: string;
  timestamp: string;
}

// Submission related types
export interface CreateSubmissionRequest {
  teamName: string;
  teamLeader: string;
  email: string;
  demoUrl?: string;
  githubRepository?: string;
  presentationLink?: string;
}

export interface UpdateSubmissionRequest {
  teamName?: string;
  teamLeader?: string;
  email?: string;
  status?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CHANGES';
  demoUrl?: string;
  githubRepository?: string;
  presentationLink?: string;
}

export interface SubmissionQueryParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CHANGES';
  sortBy?: 'submittedAt' | 'updatedAt' | 'teamName' | 'status';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Audit log types
export interface CreateAuditLogData {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'STATUS_CHANGE' | 'REVIEW' | 'APPROVE' | 'REJECT';
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description?: string;
  adminId?: string;
  submissionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: ValidationError[];
}

// Database query types
export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterOptions {
  status?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Service response types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

// Statistics types
export interface SubmissionStats {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  requiresChanges: number;
  submissionsToday: number;
  submissionsThisWeek: number;
  submissionsThisMonth: number;
}

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: 'healthy' | 'unhealthy';
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
  version: string;
  environment: string;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  total: number;
}

// Client information types (re-export from request utils)
export interface ClientInfo {
  ipAddress: string;
  userAgent: string;
  browserInfo: {
    name?: string;
    version?: string;
    os?: string;
    platform?: string;
  };
  deviceInfo: {
    type?: string;
    vendor?: string;
    model?: string;
  };
}
