import { Request, Response } from 'express';
import { OrganizationService } from './organization.service';
import { asyncHandler } from '../../utils/asyncHandler';

const organizationService = new OrganizationService();

/**
 * GET /api/police-stations
 * Get all police stations
 */
export const getAllPoliceStations = asyncHandler(async (req: Request, res: Response) => {
  const policeStations = await organizationService.getPoliceStations();

  res.status(200).json({
    success: true,
    data: policeStations,
  });
});

/**
 * GET /api/courts
 * Get all courts
 */
export const getAllCourts = asyncHandler(async (req: Request, res: Response) => {
  const courts = await organizationService.getCourts();

  res.status(200).json({
    success: true,
    data: courts,
  });
});
