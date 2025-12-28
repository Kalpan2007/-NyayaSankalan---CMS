import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';
import { CaseState } from '@prisma/client';

export class CaseService {
  /**
   * Get case by ID
   */
  async getCaseById(caseId: string, userRole: string, organizationId: string | null) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        fir: {
          include: {
            policeStation: true,
          },
        },
        state: true,
        stateHistory: {
          orderBy: { changedAt: 'desc' },
          take: 10,
        },
        assignments: {
          include: {
            assignedUser: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
        accused: true,
        evidence: true,
        witnesses: true,
        documents: true,
        courtSubmissions: {
          include: { court: true },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    // Access control
    if ((userRole === 'POLICE' || userRole === 'SHO') && 
        caseRecord.fir.policeStationId !== organizationId) {
      throw ApiError.forbidden('Access denied');
    }

    return caseRecord;
  }

  /**
   * List cases for police station
   */
  async getCases(organizationId: string, userRole: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where = userRole === 'POLICE' || userRole === 'SHO'
      ? { fir: { policeStationId: organizationId } }
      : {};

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          fir: {
            include: { policeStation: true },
          },
          state: true,
          assignments: {
            where: { unassignedAt: null },
            include: {
              assignedUser: {
                select: { id: true, name: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.case.count({ where }),
    ]);

    return {
      cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Assign case to officer
   */
  async assignCase(
    caseId: string,
    assignedTo: string,
    assignmentReason: string,
    assignedBy: string,
    policeStationId: string
  ) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: { fir: true },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    if (caseRecord.fir.policeStationId !== policeStationId) {
      throw ApiError.forbidden('Access denied');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Unassign previous
      await tx.caseAssignment.updateMany({
        where: { caseId, unassignedAt: null },
        data: { unassignedAt: new Date() },
      });

      // Create new assignment
      const assignment = await tx.caseAssignment.create({
        data: {
          caseId,
          assignedTo,
          assignedBy,
          assignmentReason,
        },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Update case state
      await tx.currentCaseState.update({
        where: { caseId },
        data: { currentState: CaseState.CASE_ASSIGNED },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: assignedBy,
          action: 'CASE_ASSIGNED',
          entity: 'CASE',
          entityId: caseId,
        },
      });

      return assignment;
    });

    return result;
  }

  /**
   * Update case state
   */
  async updateCaseState(
    caseId: string,
    newState: CaseState,
    changeReason: string,
    userId: string,
    policeStationId: string
  ) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: { fir: true, state: true },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    if (caseRecord.fir.policeStationId !== policeStationId) {
      throw ApiError.forbidden('Access denied');
    }

    const currentState = caseRecord.state?.currentState || CaseState.FIR_REGISTERED;

    const result = await prisma.$transaction(async (tx) => {
      // Record history
      await tx.caseStateHistory.create({
        data: {
          caseId,
          fromState: currentState,
          toState: newState,
          changedBy: userId,
          changeReason,
        },
      });

      // Update current state
      await tx.currentCaseState.upsert({
        where: { caseId },
        update: { currentState: newState },
        create: { caseId, currentState: newState },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'STATE_CHANGED',
          entity: 'CASE',
          entityId: caseId,
        },
      });

      return { caseId, previousState: currentState, newState };
    });

    return result;
  }
}
