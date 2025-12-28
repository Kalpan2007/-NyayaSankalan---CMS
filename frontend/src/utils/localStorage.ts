// LocalStorage utility functions
import { User, FIR, Case, Document, AuditLog, Notification, Analytics } from '../types';

const KEYS = {
  USER: 'police_court_user',
  FIRS: 'police_court_firs',
  CASES: 'police_court_cases',
  DOCUMENTS: 'police_court_documents',
  AUDIT_LOGS: 'police_court_audit_logs',
  NOTIFICATIONS: 'police_court_notifications',
  ANALYTICS: 'police_court_analytics',
  POLICE_OFFICERS: 'police_court_police_officers'
};

// User functions
export const getUser = (): User | null => {
  const user = localStorage.getItem(KEYS.USER);
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: User): void => {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const clearUser = (): void => {
  localStorage.removeItem(KEYS.USER);
};

// FIR functions
export const getFIRs = (): FIR[] => {
  const firs = localStorage.getItem(KEYS.FIRS);
  return firs ? JSON.parse(firs) : [];
};

export const setFIRs = (firs: FIR[]): void => {
  localStorage.setItem(KEYS.FIRS, JSON.stringify(firs));
};

export const addFIR = (fir: FIR): void => {
  const firs = getFIRs();
  firs.push(fir);
  setFIRs(firs);
  addAuditLog({
    action: 'FIR_CREATED',
    resource: 'FIR',
    resourceId: fir.id,
    details: { firNumber: fir.firNumber }
  });
};

// Case functions
export const getCases = (): Case[] => {
  const cases = localStorage.getItem(KEYS.CASES);
  return cases ? JSON.parse(cases) : [];
};

export const setCases = (cases: Case[]): void => {
  localStorage.setItem(KEYS.CASES, JSON.stringify(cases));
};

export const addCase = (case_: Case): void => {
  const cases = getCases();
  cases.push(case_);
  setCases(cases);
  addAuditLog({
    action: 'CASE_CREATED',
    resource: 'CASE',
    resourceId: case_.id,
    details: { caseNumber: case_.caseNumber }
  });
};

export const updateCase = (caseId: string, updates: Partial<Case>): void => {
  const cases = getCases();
  const index = cases.findIndex(c => c.id === caseId);
  if (index !== -1) {
    cases[index] = { ...cases[index], ...updates, updatedAt: new Date().toISOString() };
    setCases(cases);
    addAuditLog({
      action: 'CASE_UPDATED',
      resource: 'CASE',
      resourceId: caseId,
      details: updates
    });
  }
};

// Police Officer functions
export const getPoliceOfficers = (): User[] => {
  const officers = localStorage.getItem(KEYS.POLICE_OFFICERS);
  return officers ? JSON.parse(officers) : [];
};

export const setPoliceOfficers = (officers: User[]): void => {
  localStorage.setItem(KEYS.POLICE_OFFICERS, JSON.stringify(officers));
};

export const addPoliceOfficer = (officer: User): void => {
  const officers = getPoliceOfficers();
  officers.push(officer);
  setPoliceOfficers(officers);
  addAuditLog({
    action: 'POLICE_OFFICER_ADDED',
    resource: 'USER',
    resourceId: officer.id,
    details: { name: officer.name, role: officer.role }
  });
};

// Audit log functions
export const getAuditLogs = (): AuditLog[] => {
  const logs = localStorage.getItem(KEYS.AUDIT_LOGS);
  return logs ? JSON.parse(logs) : [];
};

export const setAuditLogs = (logs: AuditLog[]): void => {
  localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs));
};

export const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName'>): void => {
  const user = getUser();
  if (!user) return;
  
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    ...log
  };
  logs.push(newLog);
  setAuditLogs(logs);
};

// Notification functions
export const getNotifications = (): Notification[] => {
  const notifications = localStorage.getItem(KEYS.NOTIFICATIONS);
  return notifications ? JSON.parse(notifications) : [];
};

export const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>): void => {
  const notifications = getNotifications();
  const newNotification: Notification = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...notification
  };
  notifications.push(newNotification);
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

// Document Request functions
export const getDocumentRequests = (): DocumentRequest[] => {
  const requests = localStorage.getItem(KEYS.ANALYTICS + '_doc_requests');
  return requests ? JSON.parse(requests) : [];
};

export const setDocumentRequests = (requests: DocumentRequest[]): void => {
  localStorage.setItem(KEYS.ANALYTICS + '_doc_requests', JSON.stringify(requests));
};

export const addDocumentRequest = (req: Omit<DocumentRequest, 'id' | 'createdAt' | 'updatedAt'>): void => {
  const requests = getDocumentRequests();
  const newReq: DocumentRequest = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...req
  } as DocumentRequest;
  requests.push(newReq);
  setDocumentRequests(requests);
  addAuditLog({ action: 'DOCUMENT_REQUEST_CREATED', resource: 'DOCUMENT_REQUEST', resourceId: newReq.id, details: { caseId: req.caseId, type: req.type } });
  addNotification({ title: 'Document Request', message: `New ${req.type.replace(/_/g, ' ')} requested for case ${req.caseId}`, type: 'info', read: false, userId: '' });
};

export const updateDocumentRequest = (requestId: string, updates: Partial<DocumentRequest>): void => {
  const requests = getDocumentRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index !== -1) {
    requests[index] = { ...requests[index], ...updates, updatedAt: new Date().toISOString() };
    setDocumentRequests(requests);
    addAuditLog({ action: 'DOCUMENT_REQUEST_UPDATED', resource: 'DOCUMENT_REQUEST', resourceId: requestId, details: updates });
  }
};

// Initialize sample data
export const initializeSampleData = (): void => {
  if (!localStorage.getItem(KEYS.FIRS)) {
    const sampleFIR: FIR = {
      id: '1',
      firNumber: 'FIR-2024-001',
      title: 'Theft at Local Store',
      description: 'Theft incident reported at local convenience store',
      complainant: 'John Doe',
      accused: 'Unknown',
      location: '123 Main Street',
      dateTime: '2024-01-15T14:30:00Z',
      officerId: 'police1',
      officerName: 'Officer Smith',
      station: 'Central Police Station',
      status: 'case_created',
      documents: [],
      createdAt: '2024-01-15T14:30:00Z',
      updatedAt: '2024-01-15T14:30:00Z'
    };
    setFIRs([sampleFIR]);

    const sampleCase: Case = {
      id: '1',
      caseNumber: 'CASE-2024-001',
      firId: '1',
      firNumber: 'FIR-2024-001',
      title: 'Theft at Local Store',
      description: 'Theft incident reported at local convenience store',
      status: 'preparing',
      assignedOfficerId: 'police1',
      assignedOfficerName: 'Officer Smith',
      station: 'Central Police Station',
      documents: [],
      timeline: [{
        id: '1',
        action: 'Case Created',
        description: 'Case automatically created from FIR',
        userId: 'police1',
        userName: 'Officer Smith',
        timestamp: '2024-01-15T14:30:00Z',
        status: 'completed'
      }],
      createdAt: '2024-01-15T14:30:00Z',
      updatedAt: '2024-01-15T14:30:00Z'
    };
    setCases([sampleCase]);
    
    // Initialize sample police officers
    const sampleOfficers: User[] = [
      {
        id: 'police1',
        name: 'Officer Smith',
        role: 'police',
        badge: 'PS-001',
        station: 'Central Police Station'
      },
      {
        id: 'police2',
        name: 'Officer Johnson',
        role: 'police',
        badge: 'PS-002',
        station: 'Central Police Station'
      },
      {
        id: 'police3',
        name: 'Officer Williams',
        role: 'police',
        badge: 'PS-003',
        station: 'Central Police Station'
      },
      {
        id: 'sho1',
        name: 'Senior Officer Davis',
        role: 'sho',
        badge: 'SHO-001',
        station: 'Central Police Station'
      }
    ];
    setPoliceOfficers(sampleOfficers);
  }
};