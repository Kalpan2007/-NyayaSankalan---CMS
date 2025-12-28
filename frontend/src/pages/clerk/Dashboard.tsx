import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, FolderOpen, Clock, CheckCircle, AlertTriangle, BarChart3, Upload, Users, Shield, Bell } from 'lucide-react';
import { getCases, getFIRs, getNotifications } from '../../utils/localStorage';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/UI/StatusBadge';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const rolePath = user?.role === 'court_clerk' ? 'clerk' : user?.role || 'clerk';
  const cases = getCases();
  const firs = getFIRs();
  const notifications = getNotifications().filter(n => n.userId === user?.id || !n.userId);

  const getDashboardData = () => {
    switch (user?.role) {
      case 'police':
        return {
          title: 'Police Officer Dashboard',
          stats: [
            { label: 'Active FIRs', value: firs.filter(f => f.officerId === user?.id).length, icon: FileText, color: 'blue' },
            { label: 'My Active Cases', value: cases.filter(c => c.assignedOfficerId === user?.id).length, icon: FolderOpen, color: 'green' },
            { label: 'Cases in Preparation', value: cases.filter(c => c.assignedOfficerId === user?.id && c.status === 'preparing').length, icon: Clock, color: 'yellow' },
            { label: 'Submitted to SHO', value: cases.filter(c => c.assignedOfficerId === user?.id && c.status === 'submitted_to_sho').length, icon: CheckCircle, color: 'purple' },
          ],
          quickActions: [
            { label: 'Create FIR', icon: FileText, to: `/${rolePath}/fir-intake`, color: 'bg-blue-600' },
            { label: 'View My Cases', icon: FolderOpen, to: `/${rolePath}/cases`, color: 'bg-green-600' },
            { label: 'Upload Evidence', icon: Upload, to: `/${rolePath}/documents`, color: 'bg-yellow-600' },
            { label: 'Generate Documents', icon: FileText, to: `/${rolePath}/documents`, color: 'bg-purple-600' },
          ]
        };
      case 'sho':
        return {
          title: 'Senior Officer Dashboard',
          stats: [
            { label: 'Pending Reviews', value: cases.filter(c => c.status === 'submitted_to_sho').length, icon: Clock, color: 'yellow' },
            { label: 'Approved Cases', value: cases.filter(c => c.status === 'approved_by_sho').length, icon: CheckCircle, color: 'green' },
            { label: 'Total Cases', value: cases.length, icon: FolderOpen, color: 'blue' },
            { label: 'Urgent Reviews', value: cases.filter(c => c.status === 'submitted_to_sho' && new Date().getTime() - new Date(c.createdAt).getTime() > 24 * 60 * 60 * 1000).length, icon: AlertTriangle, color: 'red' },
          ],
          quickActions: [
            { label: 'Review Cases', icon: FolderOpen, to: '/cases', color: 'bg-blue-600' },
            { label: 'Assign Cases', icon: Users, to: '/assign', color: 'bg-green-600' },
            { label: 'Analytics', icon: BarChart3, to: '/analytics', color: 'bg-purple-600' },
            { label: 'Audit Trail', icon: Shield, to: '/audit', color: 'bg-gray-600' },
          ]
        };
      case 'court_clerk':
        return {
          title: 'Court Clerk Dashboard',
          stats: [
            { label: 'New Submissions', value: cases.filter(c => c.status === 'submitted_to_court').length, icon: FileText, color: 'blue' },
            { label: 'Under Review', value: cases.filter(c => c.status === 'under_review').length, icon: Clock, color: 'yellow' },
            { label: 'Accepted Cases', value: cases.filter(c => c.status === 'accepted').length, icon: CheckCircle, color: 'green' },
            { label: 'Receipts Generated', value: cases.filter(c => c.status === 'court_acknowledged').length, icon: BarChart3, color: 'purple' },
          ],
          quickActions: [
            { label: 'Review Cases', icon: FolderOpen, to: `/${rolePath}/cases`, color: 'bg-blue-600' },
            { label: 'Generate Receipt', icon: FileText, to: `/${rolePath}/generate`, color: 'bg-green-600' },
            { label: 'Case Timeline', icon: Clock, to: `/${rolePath}/timeline`, color: 'bg-yellow-600' },
            { label: 'Notifications', icon: Bell, to: `/${rolePath}/notifications`, color: 'bg-purple-600' },
          ]
        };
      case 'judge':
        return {
          title: 'Judge Dashboard',
          stats: [
            { label: 'Total Cases', value: cases.length, icon: FolderOpen, color: 'blue' },
            { label: 'Active Cases', value: cases.filter(c => ['under_review', 'accepted'].includes(c.status)).length, icon: Clock, color: 'green' },
            { label: 'Documents', value: cases.reduce((acc, c) => acc + c.documents.length, 0), icon: FileText, color: 'yellow' },
            { label: 'Recent Activity', value: cases.filter(c => new Date().getTime() - new Date(c.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000).length, icon: BarChart3, color: 'purple' },
          ],
          quickActions: [
            { label: 'View Cases', icon: FolderOpen, to: '/cases', color: 'bg-blue-600' },
            { label: 'Documents', icon: FileText, to: '/documents', color: 'bg-green-600' },
            { label: 'Case Timeline', icon: Clock, to: '/timeline', color: 'bg-yellow-600' },
            { label: 'Judgments', icon: FileText, to: '/judgments', color: 'bg-purple-600' },
          ]
        };
      default:
        return { title: 'Dashboard', stats: [], quickActions: [] };
    }
  };

  const { title, stats, quickActions } = getDashboardData();

  const getStatColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-600';
      case 'green': return 'bg-green-600';
      case 'yellow': return 'bg-yellow-600';
      case 'purple': return 'bg-purple-600';
      case 'red': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const recentCases = cases
    .filter(c => user?.role === 'police' ? c.assignedOfficerId === user?.id : true)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <span className="ml-3 inline-block px-2 py-1 bg-gray-800 text-xs rounded uppercase">
            {user?.role ? (user.role === 'court_clerk' ? 'Clerk' : user.role?.toUpperCase()) : ''}
          </span>
        </div>
        <p className="text-gray-400">Welcome back, {user?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${getStatColor(stat.color)}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link 
              key={index}
              to={action.to}
              className={`${action.color} rounded-lg p-4 text-white text-center hover:opacity-90 transition-opacity`}
            >
              <action.icon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">{action.label}</p>
            </Link>
          ))} 
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Recent Cases</h3>
          <div className="space-y-3">
            {recentCases.length > 0 ? (
              recentCases.map((case_) => (
                <div key={case_.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">{case_.title}</h4>
                    <p className="text-xs text-gray-400">{case_.caseNumber}</p>
                  </div>
                  <StatusBadge status={case_.status} />
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No recent cases</p>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Recent Notifications</h3>
          <div className="space-y-3">
            {notifications.slice(0, 5).length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="p-3 bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                  <p className="text-xs text-gray-400">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No recent notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;