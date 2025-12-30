import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { caseApi } from '../../api';
import type { Case } from '../../types/api.types';
import { CaseState } from '../../types/api.types';
import { getCaseStateBadgeVariant, getCaseStateLabel } from '../../utils/caseState';
import { AISearchWidget } from '../../components/ai/AISearchWidget';

export const SHODashboard: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await caseApi.getAllCases();
      setCases(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error} retry={fetchCases} />;

  // Calculate stats
  const totalCases = cases.length;
  
  // Unassigned cases - FIR_REGISTERED with no active assignment
  const unassignedCases = cases.filter(c => {
    const state = c.state?.currentState;
    const hasActiveAssignment = c.assignments?.some(a => !a.unassignedAt);
    return state === CaseState.FIR_REGISTERED && !hasActiveAssignment;
  });
  
  // Cases ready for court submission
  const pendingReview = cases.filter(
    c => c.state?.currentState === CaseState.INVESTIGATION_COMPLETED ||
         c.state?.currentState === CaseState.CHARGE_SHEET_PREPARED
  ).length;
  
  const submittedToCourt = cases.filter(
    c => c.state?.currentState === CaseState.SUBMITTED_TO_COURT ||
         c.state?.currentState === CaseState.COURT_ACCEPTED
  ).length;

  // Cases needing action = unassigned + ready for court
  const casesNeedingAction = cases.filter(
    c => c.state?.currentState === CaseState.INVESTIGATION_COMPLETED ||
         c.state?.currentState === CaseState.CHARGE_SHEET_PREPARED
  );

  return (
    <>
      <Header
        title="SHO Dashboard"
        subtitle="Station House Officer - Case Management"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600">{totalCases}</p>
            <p className="text-gray-600 mt-2">Total Cases</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-4xl font-bold text-red-600">{unassignedCases.length}</p>
            <p className="text-gray-600 mt-2">Unassigned</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-4xl font-bold text-orange-600">{pendingReview}</p>
            <p className="text-gray-600 mt-2">Ready for Court</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">{submittedToCourt}</p>
            <p className="text-gray-600 mt-2">Submitted to Court</p>
          </div>
        </Card>
      </div>

      {/* Unassigned Cases - Priority 1 */}
      {unassignedCases.length > 0 && (
        <Card title="🔴 Unassigned Cases (Requires Officer Assignment)" className="mb-6">
          <div className="space-y-3">
            {unassignedCases.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/sho/cases/${c.id}`}
                className="block p-4 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{c.fir?.firNumber || c.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">{c.fir?.sectionsApplied}</p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <Badge variant="danger">UNASSIGNED</Badge>
                </div>
              </Link>
            ))}
            {unassignedCases.length > 5 && (
              <p className="text-center text-gray-500 text-sm">
                +{unassignedCases.length - 5} more unassigned cases
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Cases Needing Action */}
      {casesNeedingAction.length > 0 && (
        <Card title="⚠️ Cases Needing Action">
          <div className="space-y-3">
            {casesNeedingAction.slice(0, 5).map((c) => {
              const state = c.state?.currentState || 'UNKNOWN';
              return (
                <Link
                  key={c.id}
                  to={`/sho/cases/${c.id}`}
                  className="block p-4 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{c.fir?.firNumber || c.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">{c.fir?.sectionsApplied}</p>
                    </div>
                    <Badge variant="warning">{state.replace(/_/g, ' ')}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent Cases */}
      <Card title="Recent Cases" className="mt-6">
        {cases.length === 0 ? (
          <EmptyState message="No cases in station yet" />
        ) : (
          <div className="space-y-3">
            {cases.slice(0, 5).map((c) => {
              const state = c.state?.currentState || 'UNKNOWN';
              return (
                <Link
                  key={c.id}
                  to={`/sho/cases/${c.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{c.fir?.firNumber}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={getCaseStateBadgeVariant(state)}>
                      {getCaseStateLabel(state)}
                    </Badge>
                  </div>
                </Link>
              );
            })}
            <Link to="/sho/all-cases" className="block text-center text-blue-600 hover:underline py-2">
              View All Cases →
            </Link>
          </div>
        )}
      </Card>

      <div className="mt-6">
        <AISearchWidget />
      </div>
    </>
  );
};
