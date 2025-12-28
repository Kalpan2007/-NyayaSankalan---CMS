// TypeScript interfaces for the application
export interface User {
  id: string;
  name: string;
  role: 'police' | 'sho' | 'court_clerk' | 'judge';
  badge?: string;
  station?: string;
}

export interface FIR {
  id: string;
  firNumber: string;
  title: string;
  description: string;
  complainant: string;
  accused: string;
  location: string;
  dateTime: string;
  officerId: string;
  officerName: string;
  station: string;
  status: 'draft' | 'registered' | 'case_created';
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  firId: string;
  firNumber: string;
  title: string;
  description: string;
  status: 'preparing' | 'submitted_to_sho' | 'approved_by_sho' | 'submitted_to_court' | 'court_acknowledged' | 'under_review' | 'accepted' | 'locked';
  assignedOfficerId: string;
  assignedOfficerName: string;
  station: string;
  documents: Document[];
  timeline: TimelineEntry[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  acknowledgedAt?: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'fir' | 'charge_sheet' | 'remand_application' | 'evidence_list' | 'witness_list' | 'evidence' | 'statement' | 'report';
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  required: boolean;
  status: 'uploaded' | 'pending' | 'verified';
  ocrExtracted?: string;
}

export interface TimelineEntry {
  id: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface DocumentRequest {
  id: string;
  caseId: string;
  requestedBy: string;
  requestedByName?: string;
  type: 'warrant' | 'charge_sheet' | 'remand_application' | 'other';
  notes?: string;
  status: 'requested' | 'forwarded' | 'accepted' | 'rejected';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  userId: string;
}

export interface Analytics {
  totalCases: number;
  pendingCases: number;
  submittedCases: number;
  averageProcessingTime: number;
  casesByStatus: Record<string, number>;
  monthlySubmissions: Record<string, number>;
}