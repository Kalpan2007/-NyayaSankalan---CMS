import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.routes';
import organizationRoutes from './modules/organization/organization.routes';
import firRoutes from './modules/fir/fir.routes';
import caseRoutes from './modules/case/case.routes';
import investigationRoutes from './modules/investigation/investigation.routes';
import documentRoutes from './modules/document/document.routes';
import courtRoutes from './modules/court/court.routes';
import bailRoutes from './modules/bail/bail.routes';
import auditRoutes from './modules/audit/audit.routes';
import documentRequestRoutes from './modules/document-requests/document-requests.routes';
import caseReopenRoutes from './modules/case-reopen/case-reopen.routes';
import timelineRoutes from './modules/timeline/timeline.routes';
import searchRoutes from './modules/search/search.routes';
import closureReportRoutes from './modules/closure-report/closure-report.routes';
import aiRoutes from './modules/ai/ai.routes';
import { errorHandler } from './middleware/error.middleware';
import { ApiError } from './utils/ApiError';
import { validateCloudinaryConfig } from './config/cloudinary';

export const createApp = (): Application => {
  const app = express();

  // Validate Cloudinary configuration
  validateCloudinaryConfig();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root endpoint - API info
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to NyayaSankalan API',
      version: '1.0.0',
      description: 'Police-Court Case Management System',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        organizations: '/api/police-stations, /api/courts',
        firs: '/api/firs',
        cases: '/api/cases',
        investigation: '/api/cases/:caseId/investigation-events, /evidence, /witnesses, /accused',
        documents: '/api/cases/:caseId/documents',
        court: '/api/cases/:caseId/submit-to-court, /intake, /court-actions',
        bail: '/api/cases/:caseId/bail-applications',
        audit: '/api/cases/:caseId/audit-logs',
        timeline: '/api/cases/:caseId/timeline',
      },
      documentation: 'See API_DOCUMENTATION.md for complete API reference',
      timestamp: new Date().toISOString(),
    });
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api', organizationRoutes); // /api/police-stations, /api/courts
  app.use('/api/firs', firRoutes);
  app.use('/api/cases', caseRoutes);
  app.use('/api', investigationRoutes); // /api/cases/:caseId/investigation-events, etc.
  app.use('/api', documentRoutes); // /api/cases/:caseId/documents
  app.use('/api', courtRoutes); // /api/cases/:caseId/submit-to-court, etc.
  app.use('/api', bailRoutes); // /api/cases/:caseId/bail-applications
  app.use('/api', auditRoutes); // /api/cases/:caseId/audit-logs
  app.use('/api/document-requests', documentRequestRoutes); // /api/document-requests
  app.use('/api', caseReopenRoutes);
  app.use('/api', timelineRoutes); // /api/cases/:caseId/timeline
  app.use('/api/search', searchRoutes); // /api/search?q=query
  app.use('/api', closureReportRoutes); // /api/cases/:caseId/closure-report
  app.use('/api/ai', aiRoutes); // /api/ai/search, /api/ai/index

  // 404 handler
  app.use((req, res, next) => {
    next(ApiError.notFound(`Route ${req.originalUrl} not found`));
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};
