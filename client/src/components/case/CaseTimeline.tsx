import React, { useEffect, useState } from 'react';
import { timelineApi } from '../../api/timeline.api';
import type { TimelineEvent } from '../../types/api.types';

interface Props {
  caseId: string;
}

const eventColor = (type: string) => {
  switch (type) {
    case 'COURT_ACTION': return 'bg-purple-600';
    case 'STATE_CHANGE': return 'bg-blue-500';
    case 'INVESTIGATION_EVENT': return 'bg-green-600';
    case 'DOCUMENT': return 'bg-gray-600';
    case 'COURT_SUBMISSION': return 'bg-indigo-600';
    case 'FIR_REGISTERED': return 'bg-green-700';
    case 'BAIL': return 'bg-amber-600';
    default: return 'bg-gray-400';
  }
};

export const CaseTimeline: React.FC<Props> = ({ caseId }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await timelineApi.getCaseTimeline(caseId);
        setEvents(res);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load timeline');
      } finally { setLoading(false); }
    };
    load();
  }, [caseId]);

  if (loading) return <div className="p-4 text-sm text-gray-600">Loading timeline...</div>;
  
  if (error) return (
    <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
      {error}
    </div>
  );

  if (events.length === 0) return (
    <div className="p-4 text-sm text-gray-500 text-center">
      No timeline events recorded yet.
    </div>
  );

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Case Timeline</h3>
      <div className="relative pl-8">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
        {events.map((e, idx) => (
          <div key={`${e.type}-${idx}`} className="mb-6 relative">
            <div className={`absolute -left-4 w-8 h-8 rounded-full flex items-center justify-center text-white ${eventColor(e.type)}`}>
              {/* simple icon: first letter */}
              <span className="text-sm font-semibold">{e.type.charAt(0)}</span>
            </div>
            <div className="ml-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm">{e.title}</div>
                  {e.description && <div className="text-sm text-gray-600 mt-1">{e.description}</div>}
                </div>
                <div className="text-xs text-gray-400">{new Date(e.timestamp).toLocaleString()}</div>
              </div>
              {e.actor && <div className="text-xs text-gray-500 mt-1">By: {e.actor}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
