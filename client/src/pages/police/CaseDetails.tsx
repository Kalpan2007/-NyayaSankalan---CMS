import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Loader } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { caseApi, investigationApi } from '../../api';
import { documentRequestsApi } from '../../api/documentRequests.api';
import { useAuth } from '../../context/AuthContext';
import type { Case, DocumentRequest } from '../../types/api.types';
import { CaseState, EvidenceCategory, AccusedStatus } from '../../types/api.types';
import { getCaseStateBadgeVariant, getCaseStateLabel } from '../../utils/caseState';

export const PoliceCaseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [showWitnessForm, setShowWitnessForm] = useState(false);
  const [showAccusedForm, setShowAccusedForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document requests for this case
  const [caseRequests, setCaseRequests] = useState<DocumentRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Evidence form
  const [evidenceCategory, setEvidenceCategory] = useState<EvidenceCategory>(EvidenceCategory.PHOTO);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  // Witness form
  const [witnessName, setWitnessName] = useState('');
  const [witnessContact, setWitnessContact] = useState('');
  const [witnessAddress, setWitnessAddress] = useState('');
  const [witnessStatement, setWitnessStatement] = useState('');

  // Accused form
  const [accusedName, setAccusedName] = useState('');
  const [accusedAddress, setAccusedAddress] = useState('');

  useEffect(() => {
    if (id) {
      fetchCaseDetails();
      loadCaseRequests();
    }
  }, [id]);

  const fetchCaseDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await caseApi.getCaseById(id!);
      setCaseData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load case details');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current user is assigned to this case
  const isAssignedToMe = caseData?.assignments?.some(
    a => !a.unassignedAt && a.assignedTo === user?.id
  );

  // Check if case can be edited
  const currentState = caseData?.state?.currentState || 'UNKNOWN';
  const canEdit = isAssignedToMe && (
    currentState === CaseState.CASE_ASSIGNED ||
    currentState === CaseState.UNDER_INVESTIGATION
  );

  const handleAddEvidence = async () => {
    if (!evidenceDescription.trim()) {
      toast.error('Please provide evidence description');
      return;
    }

    try {
      setIsSubmitting(true);
      await investigationApi.createEvidence(id!, {
        category: evidenceCategory as EvidenceCategory,
        description: evidenceDescription,
        file: evidenceFile || undefined,
      });
      toast.success('Evidence added successfully');
      setShowEvidenceForm(false);
      setEvidenceCategory(EvidenceCategory.PHOTO);
      setEvidenceDescription('');
      setEvidenceFile(null);
      fetchCaseDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddWitness = async () => {
    if (!witnessName.trim() || !witnessStatement.trim()) {
      toast.error('Please provide witness name and statement');
      return;
    }

    try {
      setIsSubmitting(true);
      await investigationApi.createWitness(id!, {
        name: witnessName,
        contact: witnessContact || undefined,
        address: witnessAddress || undefined,
        statement: witnessStatement,
      });
      toast.success('Witness added successfully');
      setShowWitnessForm(false);
      setWitnessName('');
      setWitnessContact('');
      setWitnessAddress('');
      setWitnessStatement('');
      fetchCaseDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add witness');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAccused = async () => {
    if (!accusedName.trim()) {
      toast.error('Please provide accused name');
      return;
    }

    try {
      setIsSubmitting(true);
      await investigationApi.createAccused(id!, {
        name: accusedName,
        address: accusedAddress || undefined,
        status: AccusedStatus.ABSCONDING,
      });
      toast.success('Accused added successfully');
      setShowAccusedForm(false);
      setAccusedName('');
      setAccusedAddress('');
      fetchCaseDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add accused');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteInvestigation = async () => {
    if (!window.confirm('Are you sure you want to mark this investigation as complete? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await caseApi.completeInvestigation(id!);
      toast.success('Investigation marked as complete! SHO can now submit this case to court.');
      fetchCaseDetails();
      await loadCaseRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete investigation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadCaseRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await documentRequestsApi.getByCase(id!);
      setCaseRequests(res);
    } catch (err: any) {
      // Ignore silently - show empty list
    } finally {
      setRequestsLoading(false);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error} retry={fetchCaseDetails} />;
  if (!caseData) return <ErrorMessage message="Case not found" />;

  const fir = caseData.fir;

  return (
    <>
      <Header
        title={`Case: ${fir?.firNumber || caseData.id.slice(0, 8)}`}
        subtitle={`Status: ${currentState.replace(/_/g, ' ')}`}
      />

      <div className="space-y-6">
        {/* Assignment Status Banner */}
        {!isAssignedToMe && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">
              ⚠️ You are viewing this case in read-only mode
            </p>
            <p className="text-yellow-600 text-sm mt-1">
              You are not currently assigned to this case. Contact your SHO for assignment.
            </p>
          </div>
        )}

        {isAssignedToMe && !canEdit && (
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <p className="text-gray-800 font-medium">
              📋 Case is locked for editing
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Current state: {currentState.replace(/_/g, ' ')}. Editing is not allowed in this state.
            </p>
          </div>
        )}

        {canEdit && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              ✓ You are assigned to this case
            </p>
            <p className="text-green-600 text-sm mt-1">
              You can add evidence, witnesses, and accused to this case.
            </p>
          </div>
        )}

        {/* Case Overview */}
        <Card title="Case Information">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">FIR Number</p>
              <p className="font-semibold text-lg">{fir?.firNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Case State</p>
              <Badge variant={getCaseStateBadgeVariant(currentState)}>
                {getCaseStateLabel(currentState)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created On</p>
              <p className="font-semibold">
                {new Date(caseData.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* FIR Details */}
        {fir && (
          <Card title="FIR Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">FIR Source</p>
                <p className="font-semibold">{fir.firSource}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Incident Date</p>
                <p className="font-semibold">
                  {new Date(fir.incidentDate).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Sections Applied</p>
                <p className="font-semibold">{fir.sectionsApplied}</p>
              </div>
              {fir.policeStation && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Police Station</p>
                  <p className="font-semibold">
                    {fir.policeStation.name}, {fir.policeStation.district}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Investigation Actions */}
        {canEdit && (
          <Card title="🔍 Investigation Actions">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => setShowEvidenceForm(!showEvidenceForm)}
              >
                + Add Evidence
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowWitnessForm(!showWitnessForm)}
              >
                + Add Witness
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAccusedForm(!showAccusedForm)}
              >
                + Add Accused
              </Button>

              <Button
                variant="secondary"
                onClick={() => window.location.assign(`/police/request-documents?caseId=${id}`)}
              >
                Request Document for this Case
              </Button>
            </div>

            {/* Mark Investigation Complete */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">✅ Complete Investigation</h4>
                <p className="text-sm text-orange-600 mb-3">
                  Once you have collected all evidence, recorded all witness statements, and identified all accused, 
                  mark the investigation as complete. The SHO will then review and submit the case to court.
                </p>
                <Button
                  variant="primary"
                  onClick={handleCompleteInvestigation}
                  isLoading={isSubmitting}
                >
                  Mark Investigation Complete
                </Button>
              </div>
            </div>

            {/* Evidence Form */}
            {showEvidenceForm && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-3">Add Evidence</h4>
                <div className="space-y-3">
                  <Select
                    label="Category"
                    value={evidenceCategory}
                    onChange={(e) => setEvidenceCategory(e.target.value as EvidenceCategory)}
                    options={[
                      { value: EvidenceCategory.PHOTO, label: 'Photo' },
                      { value: EvidenceCategory.REPORT, label: 'Report' },
                      { value: EvidenceCategory.FORENSIC, label: 'Forensic' },
                      { value: EvidenceCategory.STATEMENT, label: 'Statement' },
                    ]}
                  />
                  <Textarea
                    label="Description"
                    placeholder="Describe the evidence..."
                    value={evidenceDescription}
                    onChange={(e) => setEvidenceDescription(e.target.value)}
                    rows={3}
                  />
                  <Input
                    label="File (Optional)"
                    type="file"
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleAddEvidence}
                      isLoading={isSubmitting}
                    >
                      Save Evidence
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowEvidenceForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

        {showWitnessForm && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold mb-3">Add Witness</h4>
            <div className="space-y-3">
              <Input
                label="Name"
                placeholder="Witness full name"
                value={witnessName}
                onChange={(e) => setWitnessName(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Contact (Optional)"
                  placeholder="Phone number"
                  value={witnessContact}
                  onChange={(e) => setWitnessContact(e.target.value)}
                />
                <Input
                  label="Address (Optional)"
                  placeholder="Full address"
                  value={witnessAddress}
                  onChange={(e) => setWitnessAddress(e.target.value)}
                />
              </div>

              <Textarea
                label="Statement"
                placeholder="Witness statement..."
                value={witnessStatement}
                onChange={(e) => setWitnessStatement(e.target.value)}
                rows={4}
                required
              />

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleAddWitness}
                  isLoading={isSubmitting}
                >
                  Save Witness
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowWitnessForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {showAccusedForm && (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-semibold mb-3">Add Accused</h4>
            <div className="space-y-3">
              <Input
                label="Name"
                placeholder="Accused full name"
                value={accusedName}
                onChange={(e) => setAccusedName(e.target.value)}
                required
              />
              <Input
                label="Address (Optional)"
                placeholder="Last known address"
                value={accusedAddress}
                onChange={(e) => setAccusedAddress(e.target.value)}
              />

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleAddAccused}
                  isLoading={isSubmitting}
                >
                  Save Accused
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowAccusedForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

          </Card>
        )}

        {/* Investigation Summary */}
        <Card title="Investigation Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {caseData.evidence?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Evidence</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {caseData.witnesses?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Witnesses</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {caseData.accused?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Accused</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {caseData.documents?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Documents</p>
            </div>
          </div>
        </Card>

        {/* Evidence List */}
        {caseData.evidence && caseData.evidence.length > 0 && (
          <Card title="Evidence">
            <div className="space-y-2">
              {caseData.evidence.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Badge variant="info">{ev.category}</Badge>
                    <p className="text-xs text-gray-400">
                      Uploaded: {new Date(ev.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {ev.fileUrl && (
                    <a
                      href={ev.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Witnesses List */}
        {caseData.witnesses && caseData.witnesses.length > 0 && (
          <Card title="Witnesses">
            <div className="space-y-2">
              {caseData.witnesses.map((w) => (
                <div key={w.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{w.name}</p>
                  {w.contact && <p className="text-sm text-gray-500">📞 {w.contact}</p>}
                  {w.address && <p className="text-sm text-gray-500">📍 {w.address}</p>}
                  {w.statementFileUrl && (
                    w.statementFileUrl.startsWith('http') ? (
                      <a href={w.statementFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">View Statement →</a>
                    ) : (
                      <p className="text-sm text-gray-600 mt-2 italic">"{w.statementFileUrl}"</p>
                    )
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Accused List */}
        {caseData.accused && caseData.accused.length > 0 && (
          <Card title="Accused">
            <div className="space-y-2">
              {caseData.accused.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{a.name}</p>
                    {a.address && <p className="text-sm text-gray-500">📍 {a.address}</p>}
                  </div>
                  <Badge
                    variant={
                      a.status === 'ARRESTED' ? 'danger' :
                      a.status === 'ON_BAIL' ? 'warning' : 'default'
                    }
                  >
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Document Requests for this case */}
        <Card title="Document Requests">
          {requestsLoading && <div>Loading requests...</div>}
          {!requestsLoading && caseRequests.length === 0 && <div>No document requests for this case</div>}
          <div className="space-y-2">
            {caseRequests.map((r) => (
              <div key={r.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium">{r.documentType}</div>
                  <div className="text-sm text-gray-600">{r.requestReason} — Requested by {r.requester?.name}</div>
                  {r.remarks && <div className="text-sm text-gray-500">Remarks: {r.remarks}</div>}
                </div>
                <div className="text-sm">
                  <span className="px-2 py-1 bg-gray-100 rounded">{r.status}</span>
                  {r.status === 'ISSUED' && (
                    <a href={r.issuedFileUrl || undefined} className="ml-3 text-blue-600" target="_blank" rel="noreferrer">Download</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Back Button */}
        <div className="flex gap-4">
          <Link to="/police/my-cases">
            <Button variant="secondary">← Back to My Cases</Button>
          </Link>
          <Link to="/police/dashboard">
            <Button variant="secondary">← Dashboard</Button>
          </Link>
        </div>
      </div>
    </>
  );
};
