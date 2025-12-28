import { Request, Response } from 'express';
import { FIRService } from './fir.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import {
  uploadToCloudinary,
  CloudinaryFolder,
  logFileUpload,
} from '../../services/fileUpload.service';

const firService = new FIRService();

/**
 * POST /api/firs
 * Create a new FIR (POLICE only)
 * Supports optional file upload for FIR document
 */
export const createFIR = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('Police officer must be associated with a police station');
  }

  let firDocumentUrl: string = req.body.firDocumentUrl || '';

  // Handle file upload if present
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file, {
      folder: CloudinaryFolder.FIRS,
    });
    firDocumentUrl = uploadResult.secure_url;
  }

  const firData = {
    ...req.body,
    firDocumentUrl,
  };

  const fir = await firService.createFIR(firData, userId, organizationId);

  // Log file upload
  if (req.file) {
    await logFileUpload(userId, 'FIR', fir.id, req.file.originalname);
  }

  res.status(201).json({
    success: true,
    data: fir,
  });
});

/**
 * GET /api/firs/:firId
 * Get FIR by ID
 */
export const getFIRById = asyncHandler(async (req: Request, res: Response) => {
  const { firId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const organizationId = req.user!.organizationId;

  const fir = await firService.getFIRById(firId, userId, userRole, organizationId);

  res.status(200).json({
    success: true,
    data: fir,
  });
});
