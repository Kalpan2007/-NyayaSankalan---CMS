import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Edit,
  Send,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCases, getFIRs, updateCase, addAuditLog, getDocumentRequests, addDocumentRequest, updateDocumentRequest, addNotification } from '../../utils/localStorage';
import { Document, TimelineEntry, DocumentRequest } from '../../types';
import StatusBadge from '../../components/UI/StatusBadge';
import Timeline from '../../components/UI/Timeline';
import Modal from '../../components/UI/Modal';
import { toast } from 'react-hot-toast';

const CaseDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine the role prefix for navigation
  const getRolePrefix = () => {
    if (location.pathname.startsWith('/police')) return '/police';
    if (location.pathname.startsWith('/sho')) return '/sho';
    if (location.pathname.startsWith('/judge')) return '/judge';
    if (location.pathname.startsWith('/clerk')) return '/clerk';
    // fallback based on user role
    if (user?.role === 'police') return '/police';
    if (user?.role === 'sho') return '/sho';
    if (user?.role === 'judge') return '/judge';
    if (user?.role === 'court_clerk') return '/clerk';
    return '';
  };
  
  const rolePrefix = getRolePrefix();
  
  const [, setRefreshKey] = useState(0);
  const allCases = getCases();
  const allFIRs = getFIRs();
  
  const currentCase = allCases.find(c => c.id === caseId);
  const relatedFIR = allFIRs.find(f => f.id === currentCase?.firId);

  // Document requests state
  const [requests, setRequests] = useState<DocumentRequest[]>(() => getDocumentRequests().filter((r: DocumentRequest) => r.caseId === caseId));
  const refreshRequests = () => setRequests(getDocumentRequests().filter((r: DocumentRequest) => r.caseId === caseId));
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<'warrant'|'charge_sheet'|'remand_application'|'other'>('warrant');
  const [requestNotes, setRequestNotes] = useState('');

  // Edit fields (moved up so hooks run unconditionally)
  const [editTitle, setEditTitle] = useState(currentCase?.title || '');
  const [editDescription, setEditDescription] = useState(currentCase?.description || '');

  useEffect(() => {
    setEditTitle(currentCase?.title || '');
    setEditDescription(currentCase?.description || '');
  }, [currentCase]);
  
  if (!currentCase) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-800 pb-4">
          <h1 className="text-2xl font-bold text-white">Case Not Found</h1>
        </div>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">The requested case could not be found.</p>
          <button 
            onClick={() => navigate(`${rolePrefix}/cases`)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </button>
        </div>
      </div>
    );
  }
  
  if (!relatedFIR) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-800 pb-4">
          <h1 className="text-2xl font-bold text-white">Case Not Found</h1>
        </div>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">The related FIR for this case could not be found.</p>
          <button 
            onClick={() => navigate(`${rolePrefix}/cases`)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = () => {
    if (user?.role === 'sho' && currentCase.status === 'submitted_to_sho') {
      updateCase(currentCase.id, {
        status: 'approved_by_sho',
        updatedAt: new Date().toISOString()
      });
      addAuditLog({
        action: 'CASE_APPROVED',
        resource: 'CASE',
        resourceId: currentCase.id,
        details: { 
          previousStatus: currentCase.status,
          newStatus: 'approved_by_sho',
          approvedBy: user.name
        }
      });
      navigate(0); // Refresh the page
    }
  };

  const handleReject = () => {
    if (user?.role === 'sho' && currentCase.status === 'submitted_to_sho') {
      updateCase(currentCase.id, {
        status: 'preparing',
        updatedAt: new Date().toISOString()
      });
      addAuditLog({
        action: 'CASE_REJECTED',
        resource: 'CASE',
        resourceId: currentCase.id,
        details: { 
          previousStatus: currentCase.status,
          newStatus: 'preparing',
          rejectedBy: user.name
        }
      });
      navigate(0); // Refresh the page
    }
  };

  const handleSubmitToCourt = () => {
    if (user?.role === 'sho' && currentCase.status === 'approved_by_sho') {
      updateCase(currentCase.id, {
        status: 'submitted_to_court',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      addAuditLog({
        action: 'CASE_SUBMITTED_TO_COURT',
        resource: 'CASE',
        resourceId: currentCase.id,
        details: { 
          previousStatus: currentCase.status,
          newStatus: 'submitted_to_court',
          submittedBy: user.name
        }
      });
      navigate(0); // Refresh the page
    }
  };

  const handleAccept = () => {
    if (user?.role === 'court_clerk' && currentCase.status === 'submitted_to_court') {
      updateCase(currentCase.id, {
        status: 'court_acknowledged',
        acknowledgedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      addAuditLog({
        action: 'CASE_ACCEPTED_BY_COURT',
        resource: 'CASE',
        resourceId: currentCase.id,
        details: { 
          previousStatus: currentCase.status,
          newStatus: 'court_acknowledged',
          acceptedBy: user.name
        }
      });
      navigate(0); // Refresh the page
    }
  };

  const canEdit = user?.role === 'police' && currentCase.status === 'preparing' && currentCase.assignedOfficerId === user.id;
  const canApprove = user?.role === 'sho' && currentCase.status === 'submitted_to_sho';
  const canSubmitToCourt = user?.role === 'sho' && currentCase.status === 'approved_by_sho';
  const canAccept = user?.role === 'court_clerk' && currentCase.status === 'submitted_to_court';

  // Edit mode via query param ?edit=true
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';


  const handleSaveEdit = () => {
    if (!canEdit) return;
    updateCase(currentCase.id, {
      title: editTitle,
      description: editDescription,
      updatedAt: new Date().toISOString()
    });
    addAuditLog({
      action: 'CASE_EDITED',
      resource: 'CASE',
      resourceId: currentCase.id,
      details: { editedBy: user?.name }
    });
    // navigate back to case view without edit param
    navigate(`${rolePrefix}/cases/${currentCase.id}`);
  };

  const handleStartEdit = () => {
    navigate(`${rolePrefix}/cases/${currentCase.id}?edit=true`);
  };

  const handleCreateRequest = () => {
    if (!user || !currentCase) return;
    addDocumentRequest({
      caseId: currentCase.id,
      requestedBy: user.id,
      requestedByName: user.name,
      type: requestType,
      notes: requestNotes,
      status: 'requested'
    });
    addAuditLog({ action: 'DOCUMENT_REQUEST_SUBMITTED', resource: 'DOCUMENT_REQUEST', resourceId: currentCase.id, details: { type: requestType } });
    toast.success('Request submitted');
    setIsRequestModalOpen(false);
    setRequestNotes('');
    refreshRequests();
  };

  const handleForwardRequest = (requestId: string) => {
    updateDocumentRequest(requestId, { status: 'forwarded' });
    toast.success('Request forwarded to Clerk');
    refreshRequests();
  };

  const handleAcceptRequest = (requestId: string, type: string) => {
    const reqs = getDocumentRequests();
    const req = reqs.find((r: DocumentRequest) => r.id === requestId);
    if (!req || !currentCase) return;

    const docTypeMapping: Record<string, Document['type']> = {
      warrant: 'report',
      charge_sheet: 'charge_sheet',
      remand_application: 'remand_application',
      other: 'report'
    };

    const newDoc: Document = {
      id: Date.now().toString(),
      name: `${type.replace(/_/g,' ')} - ${currentCase.caseNumber}`,
      type: docTypeMapping[type] || 'report',
      fileName: `${type}-${Date.now()}.pdf`,
      fileSize: 0,
      uploadedBy: user?.name || 'Clerk',
      uploadedAt: new Date().toISOString(),
      required: true,
      status: 'uploaded'
    };

    updateCase(currentCase.id, { documents: [...(currentCase.documents || []), newDoc] });
    updateDocumentRequest(requestId, { status: 'accepted', assignedTo: user?.id });
    addNotification({ title: 'Document Ready', message: `Document ${newDoc.name} attached to case ${currentCase.caseNumber}`, type: 'success', read: false, userId: currentCase.assignedOfficerId });
    toast.success('Document attached and receipt sent');
    setRefreshKey(k => k + 1);
    refreshRequests();
  };

  const getActionButtons = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {canEdit && !isEditMode && (
          <button onClick={handleStartEdit} className="inline-flex items-center px-3 py-2 text-sm font-medium rounded border border-gray-600 text-gray-300 hover:bg-gray-700">
            <Edit className="h-4 w-4 mr-1" />
            Edit Case
          </button>
        )}

        {isEditMode && canEdit && (
          <>
            <button onClick={handleSaveEdit} className="inline-flex items-center px-3 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700">
              Save
            </button>
            <button onClick={() => navigate(`${rolePrefix}/cases/${currentCase.id}`)} className="inline-flex items-center px-3 py-2 text-sm font-medium rounded border border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancel
            </button>
          </>
        )}

        {canApprove && (
          <>
            <button 
              onClick={handleApprove}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </button>
            <button 
              onClick={handleReject}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </button>
          </>
        )}
        
        {canSubmitToCourt && (
          <button 
            onClick={handleSubmitToCourt}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-1" />
            Submit to Court
          </button>
        )}
        
        {canAccept && (
          <button 
            onClick={handleAccept}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Accept Case
          </button>
        )}
        
        <Link 
          to={`${rolePrefix}/documents?caseId=${currentCase.id}`}
          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <FileText className="h-4 w-4 mr-1" />
          View Documents
        </Link>
        
        <Link 
          to={`${rolePrefix}/evidence/${currentCase.id}`}
          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <Shield className="h-4 w-4 mr-1" />
          View Evidence
        </Link>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <button 
                onClick={() => navigate(`${rolePrefix}/cases`)}
                className="inline-flex items-center text-gray-400 hover:text-white mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-white">{currentCase.title}</h1>
            </div>
            <p className="text-gray-400 mt-1">Case #{currentCase.caseNumber} | FIR #{relatedFIR.firNumber}</p>
          </div>
          <StatusBadge status={currentCase.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Details */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">Case Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Case Number</p>
                <p className="text-white font-medium">{currentCase.caseNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">FIR Number</p>
                <p className="text-white font-medium">{relatedFIR.firNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <div>
                  <StatusBadge status={currentCase.status} />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Assigned Officer</p>
                <p className="text-white font-medium">{currentCase.assignedOfficerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Station</p>
                <p className="text-white font-medium">{currentCase.station}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Created</p>
                <p className="text-white font-medium">{formatDate(currentCase.createdAt)}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-400">Description</p>
                <p className="text-white">{currentCase.description}</p>
              </div>
            </div>
          </div>

          {/* FIR Details */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">FIR Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">FIR Number</p>
                <p className="text-white font-medium">{relatedFIR.firNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Date & Time</p>
                <p className="text-white font-medium">{formatDate(relatedFIR.dateTime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Complainant</p>
                <p className="text-white font-medium">{relatedFIR.complainant}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Accused</p>
                <p className="text-white font-medium">{relatedFIR.accused}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-400">Location</p>
                <p className="text-white font-medium">{relatedFIR.location}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-400">Description</p>
                <p className="text-white">{relatedFIR.description}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-white">Documents</h2>
              <div className="flex items-center space-x-3">
                {user?.role === 'police' && (
                  <button onClick={() => setIsRequestModalOpen(true)} className="inline-flex items-center text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">
                    <Send className="h-4 w-4 mr-1" /> Request Document
                  </button>
                )}
                <Link 
                  to={`${rolePrefix}/documents?caseId=${currentCase.id}`}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                >
                  View All <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                </Link>
              </div>
            </div>

            <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Request Court Document">
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Document Type</label>
                  <select value={requestType} onChange={(e) => setRequestType(e.target.value as 'warrant'|'charge_sheet'|'remand_application'|'other')} className="mt-1 block w-full bg-gray-800 text-white p-2 rounded border border-gray-700">
                    <option value="warrant">Warrant</option>
                    <option value="charge_sheet">Charge Sheet</option>
                    <option value="remand_application">Remand Application</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Notes (optional)</label>
                  <textarea value={requestNotes} onChange={(e) => setRequestNotes(e.target.value)} className="mt-1 block w-full bg-gray-800 text-white p-2 rounded border border-gray-700" rows={3} />
                </div>
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setIsRequestModalOpen(false)} className="px-3 py-2 border rounded text-sm text-gray-300">Cancel</button>
                  <button onClick={handleCreateRequest} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Submit Request</button>
                </div>
              </div>
            </Modal> 
            {currentCase.documents && currentCase.documents.length > 0 ? (
              <div className="space-y-3">
                {currentCase.documents.slice(0, 3).map((doc: Document) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-white">{doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} • {formatDate(doc.uploadedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={doc.status} />
                      <button className="text-gray-400 hover:text-white">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-white">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {currentCase.documents.length > 3 && (
                  <p className="text-sm text-gray-400 mt-2">
                    + {currentCase.documents.length - 3} more documents
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No documents uploaded yet.</p>
            )}

            {requests.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-white mb-2">Document Requests</h3>
                <div className="space-y-2">
                  {requests.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm text-white">{r.type.replace(/_/g,' ')} {r.notes ? `— ${r.notes}` : ''}</p>
                        <p className="text-xs text-gray-400">Requested by {r.requestedByName || r.requestedBy} • {new Date(r.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={r.status === 'requested' ? 'preparing' : r.status === 'forwarded' ? 'submitted_to_sho' : 'approved_by_sho'} />
                        {user?.role === 'sho' && r.status === 'requested' && (
                          <button onClick={() => handleForwardRequest(r.id)} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-yellow-600 text-white hover:bg-yellow-700">Forward</button>
                        )}
                        {user?.role === 'court_clerk' && r.status === 'forwarded' && (
                          <button onClick={() => handleAcceptRequest(r.id, r.type)} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700">Accept & Attach</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">Actions</h2>
            {getActionButtons()}
          </div>

          {/* Timeline */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">Case Timeline</h2>
            <Timeline entries={currentCase.timeline as TimelineEntry[]} />
          </div>

          {/* Case Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">Case Status</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                {['preparing', 'submitted_to_sho', 'approved_by_sho', 'submitted_to_court', 'court_acknowledged', 'under_review', 'accepted'].includes(currentCase.status) ? (
                  <>
                    <div className={`h-3 w-3 rounded-full ${['preparing', 'submitted_to_sho'].includes(currentCase.status) ? 'bg-yellow-500' : 'bg-green-500'} mr-3`}></div>
                    <span className="text-sm text-gray-300">Preparing</span>
                  </>
                ) : (
                  <>
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-3"></div>
                    <span className="text-sm text-gray-300">Preparing</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center">
                {['submitted_to_sho', 'approved_by_sho', 'submitted_to_court', 'court_acknowledged', 'under_review', 'accepted'].includes(currentCase.status) ? (
                  <>
                    <div className={`h-3 w-3 rounded-full ${['submitted_to_sho', 'approved_by_sho'].includes(currentCase.status) ? 'bg-yellow-500' : 'bg-green-500'} mr-3`}></div>
                    <span className="text-sm text-gray-300">Submitted to SHO</span>
                  </>
                ) : (
                  <>
                    <div className="h-3 w-3 rounded-full bg-gray-600 mr-3"></div>
                    <span className="text-sm text-gray-300">Submitted to SHO</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center">
                {['approved_by_sho', 'submitted_to_court', 'court_acknowledged', 'under_review', 'accepted'].includes(currentCase.status) ? (
                  <>
                    <div className={`h-3 w-3 rounded-full ${currentCase.status === 'approved_by_sho' ? 'bg-yellow-500' : 'bg-green-500'} mr-3`}></div>
                    <span className="text-sm text-gray-300">Approved by SHO</span>
                  </>
                ) : (
                  <>
                    <div className="h-3 w-3 rounded-full bg-gray-600 mr-3"></div>
                    <span className="text-sm text-gray-300">Approved by SHO</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center">
                {['submitted_to_court', 'court_acknowledged', 'under_review', 'accepted'].includes(currentCase.status) ? (
                  <>
                    <div className={`h-3 w-3 rounded-full ${currentCase.status === 'submitted_to_court' ? 'bg-yellow-500' : 'bg-green-500'} mr-3`}></div>
                    <span className="text-sm text-gray-300">Submitted to Court</span>
                  </>
                ) : (
                  <>
                    <div className="h-3 w-3 rounded-full bg-gray-600 mr-3"></div>
                    <span className="text-sm text-gray-300">Submitted to Court</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center">
                {['court_acknowledged', 'under_review', 'accepted'].includes(currentCase.status) ? (
                  <>
                    <div className={`h-3 w-3 rounded-full ${currentCase.status === 'court_acknowledged' ? 'bg-yellow-500' : 'bg-green-500'} mr-3`}></div>
                    <span className="text-sm text-gray-300">Court Acknowledged</span>
                  </>
                ) : (
                  <>
                    <div className="h-3 w-3 rounded-full bg-gray-600 mr-3"></div>
                    <span className="text-sm text-gray-300">Court Acknowledged</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center">
                {['under_review', 'accepted'].includes(currentCase.status) ? (
                  <>
                    <div className={`h-3 w-3 rounded-full ${currentCase.status === 'under_review' ? 'bg-yellow-500' : 'bg-green-500'} mr-3`}></div>
                    <span className="text-sm text-gray-300">Under Review</span>
                  </>
                ) : (
                  <>
                    <div className="h-3 w-3 rounded-full bg-gray-600 mr-3"></div>
                    <span className="text-sm text-gray-300">Under Review</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center">
                {currentCase.status === 'accepted' ? (
                  <>
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-3"></div>
                    <span className="text-sm text-gray-300">Accepted</span>
                  </>
                ) : (
                  <>
                    <div className="h-3 w-3 rounded-full bg-gray-600 mr-3"></div>
                    <span className="text-sm text-gray-300">Accepted</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetail;