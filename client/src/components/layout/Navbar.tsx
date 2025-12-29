import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/api.types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case UserRole.POLICE:
        return '/police/dashboard';
      case UserRole.SHO:
        return '/sho/dashboard';
      case UserRole.COURT_CLERK:
        return '/court/dashboard';
      case UserRole.JUDGE:
        return '/judge/dashboard';
      default:
        return '/';
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={getDashboardLink()} className="flex items-center">
              <span className="text-xl font-bold text-blue-600">NyayaSankalan</span>
              <span className="ml-2 text-sm text-gray-600">
                Police-Court Case Management
              </span>
            </Link>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-gray-500">{user.role.replace('_', ' ')}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="btn btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Role-based navigation */}
      {user && (
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 h-12 items-center">
              {user.role === UserRole.POLICE && (
                <>
                  <Link to="/police/dashboard" className="text-sm text-gray-700 hover:text-blue-600">
                    Dashboard
                  </Link>
                  <Link to="/police/create-fir" className="text-sm text-gray-700 hover:text-blue-600">
                    Create FIR
                  </Link>
                  <Link to="/police/my-cases" className="text-sm text-gray-700 hover:text-blue-600">
                    My Cases
                  </Link>
                  <Link to="/police/request-documents" className="text-sm text-gray-700 hover:text-blue-600">
                    Request Documents
                  </Link>
                </>
              )}

              {user.role === UserRole.SHO && (
                <>
                  <Link to="/sho/dashboard" className="text-sm text-gray-700 hover:text-blue-600">
                    Dashboard
                  </Link>
                  <Link to="/sho/all-cases" className="text-sm text-gray-700 hover:text-blue-600">
                    All Cases
                  </Link>
                  <Link to="/sho/document-requests" className="text-sm text-gray-700 hover:text-blue-600">
                    Document Requests
                  </Link>
                </>
              )}

              {user.role === UserRole.COURT_CLERK && (
                <>
                  <Link to="/court/dashboard" className="text-sm text-gray-700 hover:text-blue-600">
                    Dashboard
                  </Link>
                  <Link to="/court/incoming-cases" className="text-sm text-gray-700 hover:text-blue-600">
                    Incoming Cases
                  </Link>
                  <Link to="/court/document-requests" className="text-sm text-gray-700 hover:text-blue-600">
                    Document Requests
                  </Link>
                </>
              )}

              {user.role === UserRole.JUDGE && (
                <>
                  <Link to="/judge/dashboard" className="text-sm text-gray-700 hover:text-blue-600">
                    Dashboard
                  </Link>
                  <Link to="/judge/cases" className="text-sm text-gray-700 hover:text-blue-600">
                    Cases
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
