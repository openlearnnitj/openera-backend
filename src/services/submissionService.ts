import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { 
  CreateSubmissionRequest, 
  UpdateSubmissionRequest, 
  SubmissionQueryParams,
  ServiceResponse,
  PaginationOptions,
  SortOptions,
  FilterOptions 
} from '../types';
import { Submission, SubmissionStatus } from '@prisma/client';
import { AuditService } from './auditService';

export class SubmissionService {
  /**
   * Create a new submission
   */
  static async createSubmission(
    data: CreateSubmissionRequest,
    clientInfo: { ipAddress: string; userAgent: string; browserInfo?: any; deviceInfo?: any }
  ): Promise<ServiceResponse<Submission>> {
    try {
      // Check if submission with this email already exists
      const existingSubmission = await prisma.submission.findUnique({
        where: { email: data.email },
      });

      if (existingSubmission) {
        return {
          success: false,
          error: 'A submission with this email already exists',
        };
      }

      const submission = await prisma.submission.create({
        data: {
          teamName: data.teamName,
          teamLeader: data.teamLeader,
          email: data.email,
          demoUrl: data.demoUrl,
          githubRepository: data.githubRepository,
          presentationLink: data.presentationLink,
          status: 'PENDING',
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          browserInfo: clientInfo.browserInfo || undefined,
          deviceInfo: clientInfo.deviceInfo || undefined,
        },
      });

      // Log the submission creation
      await AuditService.logSubmissionCreated(
        submission.id,
        {
          teamName: submission.teamName,
          teamLeader: submission.teamLeader,
          email: submission.email,
          status: submission.status,
        },
        clientInfo
      );

      logger.info('Submission created successfully', {
        submissionId: submission.id,
        teamName: submission.teamName,
        email: submission.email,
        ip: clientInfo.ipAddress,
      });

      return {
        success: true,
        data: submission,
      };
    } catch (error) {
      logger.error('Failed to create submission', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
        clientInfo,
      });

      return {
        success: false,
        error: 'Failed to create submission',
      };
    }
  }

  /**
   * Get submissions with filtering, sorting, and pagination
   */
  static async getSubmissions(params: SubmissionQueryParams): Promise<ServiceResponse<{
    submissions: Submission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        sortBy = 'submittedAt',
        sortOrder = 'desc',
        search,
      } = params;

      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { teamName: { contains: search, mode: 'insensitive' } },
          { teamLeader: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Build order by clause
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const [submissions, total] = await Promise.all([
        prisma.submission.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
        }),
        prisma.submission.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          submissions,
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to get submissions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params,
      });

      return {
        success: false,
        error: 'Failed to retrieve submissions',
      };
    }
  }

  /**
   * Get a single submission by ID
   */
  static async getSubmissionById(id: string): Promise<ServiceResponse<Submission>> {
    try {
      const submission = await prisma.submission.findUnique({
        where: { id },
      });

      if (!submission) {
        return {
          success: false,
          error: 'Submission not found',
        };
      }

      return {
        success: true,
        data: submission,
      };
    } catch (error) {
      logger.error('Failed to get submission by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
      });

      return {
        success: false,
        error: 'Failed to retrieve submission',
      };
    }
  }

  /**
   * Update a submission
   */
  static async updateSubmission(
    id: string,
    data: UpdateSubmissionRequest,
    adminId: string,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<ServiceResponse<Submission>> {
    try {
      // Get the current submission
      const currentSubmission = await prisma.submission.findUnique({
        where: { id },
      });

      if (!currentSubmission) {
        return {
          success: false,
          error: 'Submission not found',
        };
      }

      // Check if email is being changed and if it conflicts
      if (data.email && data.email !== currentSubmission.email) {
        const existingSubmission = await prisma.submission.findUnique({
          where: { email: data.email },
        });

        if (existingSubmission) {
          return {
            success: false,
            error: 'A submission with this email already exists',
          };
        }
      }

      const updatedSubmission = await prisma.submission.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      // Log the submission update
      await AuditService.logSubmissionUpdated(
        id,
        currentSubmission,
        updatedSubmission,
        adminId,
        clientInfo
      );

      // Log status change separately if status was updated
      if (data.status && data.status !== currentSubmission.status) {
        await AuditService.logStatusChange(
          id,
          currentSubmission.status,
          data.status,
          adminId,
          clientInfo
        );
      }

      logger.info('Submission updated successfully', {
        submissionId: id,
        adminId,
        changes: data,
      });

      return {
        success: true,
        data: updatedSubmission,
      };
    } catch (error) {
      logger.error('Failed to update submission', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        data,
        adminId,
      });

      return {
        success: false,
        error: 'Failed to update submission',
      };
    }
  }

  /**
   * Delete a submission
   */
  static async deleteSubmission(
    id: string,
    adminId: string,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Get the current submission
      const submission = await prisma.submission.findUnique({
        where: { id },
      });

      if (!submission) {
        return {
          success: false,
          error: 'Submission not found',
        };
      }

      await prisma.submission.delete({
        where: { id },
      });

      // Log the submission deletion
      await AuditService.createAuditLog({
        action: 'DELETE',
        entityType: 'submission',
        entityId: id,
        oldValues: submission,
        description: `Submission deleted by admin`,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        adminId,
        submissionId: id,
      });

      logger.info('Submission deleted successfully', {
        submissionId: id,
        adminId,
        teamName: submission.teamName,
      });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      logger.error('Failed to delete submission', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        adminId,
      });

      return {
        success: false,
        error: 'Failed to delete submission',
      };
    }
  }

  /**
   * Get submission statistics
   */
  static async getSubmissionStats(): Promise<ServiceResponse<{
    total: number;
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
    requiresChanges: number;
    submissionsToday: number;
    submissionsThisWeek: number;
    submissionsThisMonth: number;
  }>> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisWeek = new Date();
      thisWeek.setDate(today.getDate() - today.getDay());
      thisWeek.setHours(0, 0, 0, 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const [
        total,
        statusCounts,
        submissionsToday,
        submissionsThisWeek,
        submissionsThisMonth,
      ] = await Promise.all([
        prisma.submission.count(),
        prisma.submission.groupBy({
          by: ['status'],
          _count: {
            status: true,
          },
        }),
        prisma.submission.count({
          where: {
            submittedAt: {
              gte: today,
            },
          },
        }),
        prisma.submission.count({
          where: {
            submittedAt: {
              gte: thisWeek,
            },
          },
        }),
        prisma.submission.count({
          where: {
            submittedAt: {
              gte: thisMonth,
            },
          },
        }),
      ]);

      const statusMap = statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<SubmissionStatus, number>);

      return {
        success: true,
        data: {
          total,
          pending: statusMap.PENDING || 0,
          underReview: statusMap.UNDER_REVIEW || 0,
          approved: statusMap.APPROVED || 0,
          rejected: statusMap.REJECTED || 0,
          requiresChanges: statusMap.REQUIRES_CHANGES || 0,
          submissionsToday,
          submissionsThisWeek,
          submissionsThisMonth,
        },
      };
    } catch (error) {
      logger.error('Failed to get submission statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve submission statistics',
      };
    }
  }

  /**
   * Bulk update submission status
   */
  static async bulkUpdateStatus(
    submissionIds: string[],
    status: SubmissionStatus,
    adminId: string,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<ServiceResponse<number>> {
    try {
      // Get current submissions
      const submissions = await prisma.submission.findMany({
        where: {
          id: {
            in: submissionIds,
          },
        },
      });

      if (submissions.length === 0) {
        return {
          success: false,
          error: 'No submissions found',
        };
      }

      // Update submissions
      const result = await prisma.submission.updateMany({
        where: {
          id: {
            in: submissionIds,
          },
        },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      // Log status changes for each submission
      for (const submission of submissions) {
        if (submission.status !== status) {
          await AuditService.logStatusChange(
            submission.id,
            submission.status,
            status,
            adminId,
            clientInfo
          );
        }
      }

      logger.info('Bulk status update completed', {
        count: result.count,
        status,
        adminId,
        submissionIds,
      });

      return {
        success: true,
        data: result.count,
      };
    } catch (error) {
      logger.error('Failed to bulk update status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        submissionIds,
        status,
        adminId,
      });

      return {
        success: false,
        error: 'Failed to bulk update status',
      };
    }
  }
}
