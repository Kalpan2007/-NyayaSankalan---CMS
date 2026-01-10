import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Loader } from '../common/Loader';
import toast from 'react-hot-toast';
import { aiEnhancedApi } from '../../api/aiEnhanced.api';

interface SectionOption {
  value: string;
  label: string;
  section: string;
  title: string;
  code: 'ipc' | 'bns';
}

interface SectionDetails {
  title?: string;
  section?: string;
  number?: string;
  description?: string;
  punishment?: string;
  bailable?: boolean;
  cognizable?: boolean;
  category?: string;
  ipc_equivalent?: string;
  keywords?: string[];
  relatedSections?: string[];
}

interface PrecedentItem {
  title?: string;
  case_name?: string;
  summary?: string;
}

interface Props {
  defaultSection?: string;
  title?: string;
}

export const SectionExplainerCard: React.FC<Props> = ({ defaultSection = '302', title = 'Section Explainer & Precedents' }) => {
  const [section, setSection] = useState(defaultSection);
  const [codeType, setCodeType] = useState<'ipc' | 'bns'>('ipc');
  const [sectionOptions, setSectionOptions] = useState<SectionOption[]>([]);
  const [details, setDetails] = useState<SectionDetails | null>(null);
  const [precedents, setPrecedents] = useState<PrecedentItem[]>([]);
  const [precedentsFetched, setPrecedentsFetched] = useState(false);
  const [detailsFetched, setDetailsFetched] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loading, setLoading] = useState<{ details: boolean; precedents: boolean }>({ details: false, precedents: false });

  // Load available sections on mount
  useEffect(() => {
    const loadSections = async () => {
      setLoadingOptions(true);
      try {
        console.log('Loading sections list...');
        const data = await aiEnhancedApi.getSectionsList('both');
        console.log('Sections data received:', data);
        
        if (data?.sections && Array.isArray(data.sections) && data.sections.length > 0) {
          setSectionOptions(data.sections);
          console.log('Loaded', data.sections.length, 'sections');
          // Find and set the default section if it exists
          const defaultOpt = data.sections.find((opt: SectionOption) => opt.value === defaultSection);
          if (defaultOpt) {
            setCodeType(defaultOpt.code);
            setSection(defaultOpt.value);
          } else {
            setSection(defaultSection);
          }
        } else {
          console.warn('No sections data received or empty array');
          // Fallback to a basic list if API fails
          const fallbackSections: SectionOption[] = [
            { value: '302', label: 'IPC 302 - Murder', section: 'IPC 302', title: 'Murder', code: 'ipc' },
            { value: '304', label: 'IPC 304 - Culpable Homicide', section: 'IPC 304', title: 'Culpable Homicide', code: 'ipc' },
            { value: '307', label: 'IPC 307 - Attempt to Murder', section: 'IPC 307', title: 'Attempt to Murder', code: 'ipc' },
            { value: '323', label: 'IPC 323 - Causing Hurt', section: 'IPC 323', title: 'Causing Hurt', code: 'ipc' },
            { value: '376', label: 'IPC 376 - Rape', section: 'IPC 376', title: 'Rape', code: 'ipc' },
            { value: '103', label: 'BNS 103 - Murder', section: 'BNS 103', title: 'Murder', code: 'bns' },
            { value: '105', label: 'BNS 105 - Culpable Homicide', section: 'BNS 105', title: 'Culpable Homicide', code: 'bns' },
          ];
          setSectionOptions(fallbackSections);
          setSection(defaultSection);
          console.log('Using fallback sections');
        }
      } catch (err) {
        console.error('Failed to load sections list:', err);
        // Fallback to basic sections on error
        const fallbackSections: SectionOption[] = [
          { value: '302', label: 'IPC 302 - Murder', section: 'IPC 302', title: 'Murder', code: 'ipc' },
          { value: '304', label: 'IPC 304 - Culpable Homicide', section: 'IPC 304', title: 'Culpable Homicide', code: 'ipc' },
          { value: '307', label: 'IPC 307 - Attempt to Murder', section: 'IPC 307', title: 'Attempt to Murder', code: 'ipc' },
          { value: '323', label: 'IPC 323 - Causing Hurt', section: 'IPC 323', title: 'Causing Hurt', code: 'ipc' },
          { value: '376', label: 'IPC 376 - Rape', section: 'IPC 376', title: 'Rape', code: 'ipc' },
          { value: '103', label: 'BNS 103 - Murder', section: 'BNS 103', title: 'Murder', code: 'bns' },
          { value: '105', label: 'BNS 105 - Culpable Homicide', section: 'BNS 105', title: 'Culpable Homicide', code: 'bns' },
        ];
        setSectionOptions(fallbackSections);
        setSection(defaultSection);
        toast.error('Failed to load sections. Using default list.');
      } finally {
        setLoadingOptions(false);
      }
    };

    loadSections();
  }, [defaultSection]);

  // Filter options by code type
  const filteredOptions = sectionOptions.filter(opt => opt.code === codeType);

  const formatFlag = (value?: boolean) => {
    if (value === undefined) return 'N/A';
    return value ? 'Yes' : 'No';
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSection(value);
    setDetails(null);
    setPrecedents([]);
    setDetailsFetched(false);
    setPrecedentsFetched(false);
  };

  const handleCodeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCodeType = e.target.value as 'ipc' | 'bns';
    setCodeType(newCodeType);
    // Reset section to first available in new code type
    const firstOfNewType = sectionOptions.find(opt => opt.code === newCodeType);
    if (firstOfNewType) {
      setSection(firstOfNewType.value);
    }
    setDetails(null);
    setPrecedents([]);
    setDetailsFetched(false);
    setPrecedentsFetched(false);
  };

  const ensureSection = () => {
    if (!section.trim()) {
      toast.error('Select a section');
      return false;
    }
    return true;
  };

  const handleDetails = async () => {
    if (!ensureSection()) return;
    setLoading((s) => ({ ...s, details: true }));
    try {
      const res = await aiEnhancedApi.sectionDetails(section.trim(), codeType);
      setDetails((res || null) as SectionDetails | null);
      setDetailsFetched(true);
      if (!res || (typeof res === 'object' && Object.keys(res).length === 0)) {
        toast.success('No details found for this section in database');
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch section details';
      toast.error(message);
      setDetailsFetched(true);
    } finally {
      setLoading((s) => ({ ...s, details: false }));
    }
  };

  const handlePrecedents = async () => {
    if (!ensureSection()) return;
    setLoading((s) => ({ ...s, precedents: true }));
    try {
      const res = await aiEnhancedApi.precedentsBySection(section.trim(), 8);
      const list = res?.precedents || res?.data || res || [];
      setPrecedents(Array.isArray(list) ? (list as PrecedentItem[]) : []);
      setPrecedentsFetched(true);
      if (!Array.isArray(list) || list.length === 0) {
        toast.success('No precedents found for this section');
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch precedents';
      toast.error(message);
    } finally {
      setLoading((s) => ({ ...s, precedents: false }));
    }
  };

  return (
    <Card title={title}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Code Type"
            value={codeType}
            onChange={handleCodeTypeChange}
            options={[
              { value: 'ipc', label: 'IPC' },
              { value: 'bns', label: 'BNS' },
            ]}
          />
          <Select
            label="Section"
            value={section}
            onChange={handleSectionChange}
            options={filteredOptions.map(opt => ({
              value: opt.value,
              label: opt.label
            }))}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={handleDetails} isLoading={loading.details}>
            Explain Section
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrecedents} isLoading={loading.precedents}>
            Show Precedents
          </Button>
        </div>

        {loadingOptions && (
          <div className="flex items-center justify-center py-8">
            <Loader />
          </div>
        )}

        {!loadingOptions && details && (
          <div className="border rounded p-3 bg-gray-50 space-y-1">
            <p className="text-sm font-semibold">{details.title || details.section || section}</p>
            {details.description && (
              <p className="text-sm text-gray-700 whitespace-pre-line">{details.description}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 pt-2">
              <div><span className="font-semibold">Section:</span> {details.section || `${codeType.toUpperCase()} ${section}`}</div>
              <div><span className="font-semibold">Category:</span> {details.category || '—'}</div>
              <div><span className="font-semibold">Bailable:</span> {formatFlag(details.bailable)}</div>
              <div><span className="font-semibold">Cognizable:</span> {formatFlag(details.cognizable)}</div>
              <div className="md:col-span-2"><span className="font-semibold">Punishment:</span> {details.punishment || 'Not specified'}</div>
            </div>
            {details.relatedSections && Array.isArray(details.relatedSections) && details.relatedSections.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {details.relatedSections.map((rs: string) => (
                  <Badge key={rs} variant="info">{rs}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {precedents.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Precedents</p>
            <div className="space-y-2">
              {precedents.map((p, idx) => (
                <div key={idx} className="border rounded p-2 bg-gray-50">
                  <p className="font-medium text-sm">{p?.title || p?.case_name || 'Precedent'}</p>
                  {p?.summary && <p className="text-xs text-gray-600 mt-1 line-clamp-3">{p.summary}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {precedentsFetched && precedents.length === 0 && !loading.precedents && (
          <p className="text-sm text-gray-600">No precedents found yet. Try another section or code.</p>
        )}

        {detailsFetched && !details && !loading.details && (
          <p className="text-sm text-gray-600">No section details found. This section may not be in the database yet.</p>
        )}
      </div>
    </Card>
  );
};
