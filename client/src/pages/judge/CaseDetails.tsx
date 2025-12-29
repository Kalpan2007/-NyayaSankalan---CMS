import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { CaseTimeline } from '../../components/case/CaseTimeline';
import { ClosureReportButton } from '../../components/case/ClosureReportButton';
import { caseApi, courtApi } from '../../api';
import type { Case, CourtAction } from '../../types/api.types';
import { CaseState, CourtActionType } from '../../types/api.types';
import { getCaseStateBadgeVariant, getCaseStateLabel, isInCourt } from '../../utils/caseState';

export const JudgeCaseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [courtActions, setCourtActions] = useState<CourtAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Court action form state
  const [actionType, setActionType] = useState<CourtActionType>(CourtActionType.HEARING);
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [caseDetails, actions] = await Promise.all([
        caseApi.getCaseById(id!),
        courtApi.getCourtActions(id!).catch(() => []),
      ]);
      setCaseData(caseDetails);
      setCourtActions(actions);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordAction = async () => {
    try {
      setIsSubmitting(true);
      await courtApi.createCourtAction(id!, {
        actionType,
        actionDate: new Date(actionDate).toISOString(),
      });
      toast.success('Court action recorded successfully');
      fetchData(); // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record court action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCase = async () => {
    if (!confirm('Are you sure you want to close this case? This action will:\n\n• Archive the case permanently\n• Generate the official closure report\n• Make the case read-only\n\nThis action cannot be undone.')) {
      return;
    }

    try {
      setIsClosing(true);
      const result = await caseApi.judicialCloseCase(id!);
      toast.success('Case closed successfully. Closure report generated.');
      if (result.closureReportUrl) {
        // Open the report in a new tab
        window.open(result.closureReportUrl, '_blank');
      }
      fetchData(); // Refresh data to show archived state
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to close case');
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error} retry={fetchData} />;
  if (!caseData) return <ErrorMessage message="Case not found" />;

  const fir = caseData.fir;
  const currentState = caseData.state?.currentState || 'UNKNOWN';

  // Judge can record actions on court-accepted or trial-ongoing cases
  const canRecordAction = isInCourt(currentState);

  // Judge can close cases that are in closable states (not already archived)
  const closableStates = [
    CaseState.DISPOSED,
    CaseState.JUDGMENT_RESERVED,
    CaseState.TRIAL_ONGOING,
    CaseState.COURT_ACCEPTED,
  ];
  const canCloseCase = closableStates.includes(currentState as CaseState);

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case CourtActionType.COGNIZANCE:
        return 'info';
      case CourtActionType.HEARING:
        return 'warning';
      case CourtActionType.JUDGMENT:
      case CourtActionType.CONVICTION:
      case CourtActionType.ACQUITTAL:
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Header
        title={`Case: ${fir?.firNumber || caseData.id.slice(0, 8)}`}
        subtitle={`Status: ${getCaseStateLabel(currentState)}`}
      />

      <div className="space-y-6">
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
              <p className="text-sm text-gray-500">Received On</p>
              <p className="font-semibold">
                {new Date(caseData.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </Card>

        {/* Closure Report - Only for ARCHIVED cases */}
        {currentState === CaseState.ARCHIVED && (
          <ClosureReportButton caseId={id!} isArchived={true} />
        )}

        {/* FIR Details */}
        {fir && (
          <Card title="FIR Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Sections Applied</p>
                <p className="font-semibold">{fir.sectionsApplied}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Incident Date</p>
                <p className="font-semibold">
                  {new Date(fir.incidentDate).toLocaleString('en-IN')}
                </p>
              </div>
              {fir.policeStation && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">From Police Station</p>
                  <p className="font-semibold">
                    {fir.policeStation.name}, {fir.policeStation.district}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Case Summary */}
        <Card title="Case Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {caseData.evidence?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Evidence Items</p>
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
                {courtActions.length}
              </p>
              <p className="text-sm text-gray-600">Court Actions</p>
            </div>
          </div>
        </Card>

        {/* Record Court Action */}
        {canRecordAction && (
          <Card title="Record Court Action">
            <div className="space-y-4">
              <p className="text-gray-600">
                Record a court action for this case (hearing, judgment, etc.)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Action Type"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as CourtActionType)}
                  options={[
                    { value: CourtActionType.COGNIZANCE, label: 'Cognizance Taken' },
                    { value: CourtActionType.CHARGES_FRAMED, label: 'Charges Framed' },
                    { value: CourtActionType.HEARING, label: 'Hearing' },
                    { value: CourtActionType.JUDGMENT, label: 'Judgment' },
                    { value: CourtActionType.SENTENCE, label: 'Sentence' },
                    { value: CourtActionType.ACQUITTAL, label: 'Acquittal' },
                    { value: CourtActionType.CONVICTION, label: 'Conviction' },
                  ]}
                />
                <Input
                  label="Action Date"
                  type="date"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleRecordAction}
                isLoading={isSubmitting}
              >
                Record Action
              </Button>
            </div>
          </Card>
        )}

        {/* Judicial Case Closure - Only for Judge, only for closable cases */}
        {canCloseCase && (
          <Card title="Judicial Case Closure">
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-amber-800 font-medium">Close Case Permanently</p>
                    <p className="text-amber-700 text-sm mt-1">
                      Closing this case will:
                    </p>
                    <ul className="text-amber-700 text-sm mt-2 list-disc list-inside space-y-1">
                      <li>Archive the case permanently</li>
                      <li>Generate the official Case Closure Report (PDF)</li>
                      <li>Make the case read-only for all users</li>
                    </ul>
                    <p className="text-amber-700 text-sm mt-2 font-medium">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  onClick={handleCloseCase}
                  isLoading={isClosing}
                  className="flex items-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Close Case & Generate Report
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Case Disposed */}
        {currentState === CaseState.DISPOSED && (
          <Card>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium text-lg">
                ✓ Case Disposed
              </p>
              <p className="text-green-600 mt-1">
                This case has been concluded
              </p>
            </div>
          </Card>
        )}

        {/* Court Actions History */}
        <Card title="Court Actions History">
          {courtActions.length === 0 ? (
            <EmptyState
              title="No Court Actions Yet"
              message="Court actions will appear here when recorded"
            />
          ) : (
            <div className="space-y-3">
              {courtActions.map((action) => (
                <div
                  key={action.id}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {action.actionType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Date: {new Date(action.actionDate).toLocaleDateString('en-IN')}
                      </p>
                      {action.orderFileUrl && (
                        <a
                          href={action.orderFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-1 block"
                        >
                          View Order Document →
                        </a>
                      )}
                    </div>
                    <Badge variant={getActionBadgeVariant(action.actionType)}>
                      {action.actionType.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Case Timeline */}
        <Card title="Case Timeline">
          <CaseTimeline caseId={id!} />
        </Card>

        {/* Back Button */}
        <div className="flex gap-4">
          <Link to="/judge/cases">
            <Button variant="secondary">← Back to All Cases</Button>
          </Link>
          <Link to="/judge/dashboard">
            <Button variant="secondary">← Dashboard</Button>
          </Link>
        </div>
      </div>
    </>
  );
};
