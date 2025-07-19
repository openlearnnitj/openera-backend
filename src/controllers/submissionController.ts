import { Request, Response } from 'express';
import { SubmissionService } from '../services/submissionService';
import { RequestUtils } from '../utils/request';
import { logger } from '../config/logger';
import { 
  ApiResponse, 
  CreateSubmissionRequest, 
  UpdateSubmissionRequest,
  SubmissionQueryParams 
} from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export class SubmissionController {
  /**
   * Create a new submission
   */
  static createSubmission = asyncHandler(async (
    req: Request<{}, ApiResponse, CreateSubmissionRequest>,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const clientInfo = RequestUtils.getClientInfo(req);

    const result = await SubmissionService.createSubmission(req.body, {
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      browserInfo: clientInfo.browserInfo,
      deviceInfo: clientInfo.deviceInfo,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to create submission',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Get all submissions with filtering and pagination (Admin only)
   */
  static getSubmissions = asyncHandler(async (
    req: Request<{}, ApiResponse, {}, SubmissionQueryParams>,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const queryParams: SubmissionQueryParams = {
      page: req.query.page ? parseInt(req.query.page.toString()) : 1,
      limit: req.query.limit ? parseInt(req.query.limit.toString()) : 20,
      status: req.query.status,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      search: req.query.search,
    };

    const result = await SubmissionService.getSubmissions(queryParams);

    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to retrieve submissions',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Submissions retrieved successfully',
      data: result.data?.submissions,
      meta: {
        page: result.data?.page,
        limit: result.data?.limit,
        total: result.data?.total,
        totalPages: result.data?.totalPages,
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Get a single submission by ID (Admin only)
   */
  static getSubmissionById = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { id } = req.params;

    const result = await SubmissionService.getSubmissionById(id);

    if (!result.success) {
      const statusCode = result.error === 'Submission not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: result.error || 'Failed to retrieve submission',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Submission retrieved successfully',
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Update a submission (Admin only)
   */
  static updateSubmission = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { id } = req.params;
    const adminId = req.admin!.adminId;
    const clientInfo = RequestUtils.getClientInfo(req);

    const result = await SubmissionService.updateSubmission(
      id,
      req.body,
      adminId,
      {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      }
    );

    if (!result.success) {
      const statusCode = result.error === 'Submission not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: result.error || 'Failed to update submission',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Submission updated successfully',
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Delete a submission (Admin only)
   */
  static deleteSubmission = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { id } = req.params;
    const adminId = req.admin!.adminId;
    const clientInfo = RequestUtils.getClientInfo(req);

    const result = await SubmissionService.deleteSubmission(
      id,
      adminId,
      {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      }
    );

    if (!result.success) {
      const statusCode = result.error === 'Submission not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: result.error || 'Failed to delete submission',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Submission deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Get submission statistics (Admin only)
   */
  static getSubmissionStats = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const result = await SubmissionService.getSubmissionStats();

    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to retrieve submission statistics',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Submission statistics retrieved successfully',
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Bulk update submission status (Admin only)
   */
  static bulkUpdateStatus = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { submissionIds, status } = req.body;
    const adminId = req.admin!.adminId;
    const clientInfo = RequestUtils.getClientInfo(req);

    // Validate status
    const validStatuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_CHANGES'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status provided',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    const result = await SubmissionService.bulkUpdateStatus(
      submissionIds,
      status as any,
      adminId,
      {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      }
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to update submission statuses',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.data} submissions`,
      data: { updatedCount: result.data },
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });

  /**
   * Check if email is already used for submission
   */
  static checkEmailExists = asyncHandler(async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Email parameter is required',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
      return;
    }

    try {
      const { prisma } = await import('../config/database');
      const existingSubmission = await prisma.submission.findUnique({
        where: { email: email as string },
        select: { id: true, teamName: true, submittedAt: true },
      });

      res.status(200).json({
        success: true,
        message: 'Email check completed',
        data: {
          exists: !!existingSubmission,
          submission: existingSubmission || null,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('Email check error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
        requestId: req.requestId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to check email',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    }
  });
}
