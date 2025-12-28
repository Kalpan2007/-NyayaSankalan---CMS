import React, { useState } from 'react';
import { Search, Filter, Eye, CreditCard as Edit, UserCheck } from 'lucide-react';
import { getCases, updateCase, addAuditLog } from '../../utils/localStorage';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import StatusBadge from '../../components/UI/StatusBadge';
import { Case } from '../../types';

const Cases: React.FC = () => {
  const { user } = useAuth();
  const rolePath = user?.role ? (user.role === 'court_clerk' ? 'clerk' : user.role) : 'sho';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [allCases, setAllCases] = useState(() => getCases());
  const refreshCases = () => setAllCases(getCases());

  const handleApprove = (caseId: string) => {
    updateCase(caseId, { status: 'approved_by_sho' });
    addAuditLog({ action: 'APPROVED_BY_SHO', resource: 'CASE', resourceId: caseId, details: {} });
    toast.success('Case approved');
    refreshCases();
  };
  
  // Filter cases based on user role
  const userCases = user?.role === 'police' 
    ? allCases.filter(c => c.assignedOfficerId === user.id)
    : allCases;

  // Apply search and status filters
  const filteredCases = userCases.filter(case_ => {
    const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.firNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getUniqueStatuses = () => {
    const statuses = Array.from(new Set(userCases.map(c => c.status)));
    return statuses.sort();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActionButtons = (case_: Case) => {
    switch (user?.role) {
      case 'police':
        return (
          <div className="flex space-x-2">
            <Link 
              to={`/${rolePath}/cases/${case_.id}`}
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Link>
            {case_.status === 'preparing' && (
              <Link to={`/${rolePath}/cases/${case_.id}?edit=true`} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-600 text-gray-300 hover:bg-gray-700">
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Link>
            )}
          </div>
        );
      case 'sho':
        return (
          <div className="flex space-x-2">
            <Link 
              to={`/${rolePath}/cases/${case_.id}`}
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Eye className="h-3 w-3 mr-1" />
              Review
            </Link>
            {case_.status === 'submitted_to_sho' && (
              <button onClick={() => handleApprove(case_.id)} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700">
                Approve
              </button>
            )}
            {user?.role === 'sho' && (
              <Link 
                to={`/${rolePath}/assign/${case_.id}`}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <UserCheck className="h-3 w-3 mr-1" />
                Assign
              </Link>
            )}
          </div>
        );
      case 'court_clerk':
        return (
          <div className="flex space-x-2">
            <Link 
              to={`/${rolePath}/cases/${case_.id}`}
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Link>
            {case_.status === 'submitted_to_court' && (
              <button className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700">
                Accept
              </button>
            )}
          </div>
        );
      case 'judge':
        return (
          <Link 
            to={`/${rolePath}/cases/${case_.id}`}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Link>
        );
      default:
        return null;
    }
  };

  const getRoleTitle = () => {
    switch (user?.role) {
      case 'police': return 'My Cases';
      case 'sho': return 'Cases for Review';
      case 'court_clerk': return 'Court Cases';
      case 'judge': return 'Case Files';
      default: return 'Cases';
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-white">{getRoleTitle()}</h1>
        <p className="text-gray-400">
          {user?.role === 'police' 
            ? 'Manage your assigned cases' 
            : 'View and manage cases in the system'
          }
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by case number, FIR number, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            {getUniqueStatuses().map(status => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cases List */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Case Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Officer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {filteredCases.length > 0 ? (
                filteredCases.map((case_) => (
                  <tr key={case_.id} className="hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{case_.title}</div>
                        <div className="text-sm text-gray-400">
                          Case: {case_.caseNumber} | FIR: {case_.firNumber}
                        </div>
                        <div className="text-xs text-gray-500">{case_.station}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={case_.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {case_.assignedOfficerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(case_.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {getActionButtons(case_)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No cases found</p>
                      <p className="text-sm">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {filteredCases.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">
            Showing {filteredCases.length} of {userCases.length} cases
          </p>
        </div>
      )}
    </div>
  );
};

export default Cases;