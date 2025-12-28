import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/Layout/AppLayout';

// Pages
import Login from './pages/Login';

// Police pages
import PoliceDashboard from './pages/police/Dashboard';
import PoliceFIRIntake from './pages/police/FIRIntake';
import PoliceCases from './pages/police/Cases';
import PoliceCaseDetail from './pages/police/CaseDetail';
import PoliceFIRDetail from './pages/police/FIRDetail';
import PoliceDocuments from './pages/police/Documents';
import PoliceDocumentDetail from './pages/police/DocumentDetail';
import PoliceEvidenceList from './pages/police/EvidenceList';
import PoliceEvidenceListTemplate from './pages/police/EvidenceListTemplate';
import PoliceChargeSheet from './pages/police/ChargeSheet';
import PoliceWitnessList from './pages/police/WitnessList';
import PoliceGenericPage from './pages/police/GenericPage';

// SHO pages
import SHODashboard from './pages/sho/Dashboard';
import SHOAssignCase from './pages/sho/AssignCase';
import SHOCases from './pages/sho/Cases';
import SHODocuments from './pages/sho/Documents';
import SHORemandApplication from './pages/sho/RemandApplication';
import SHOAnalytics from './pages/sho/Analytics';
import SHOGenericPage from './pages/sho/GenericPage';

// Judge pages
import JudgeDashboard from './pages/judge/Dashboard';
import JudgeCases from './pages/judge/Cases';
import JudgeDocuments from './pages/judge/Documents';
import JudgeAuditTrail from './pages/judge/AuditTrail';
import JudgeNotifications from './pages/judge/Notifications';
import JudgeGenericPage from './pages/judge/GenericPage';

// Clerk pages
import ClerkDashboard from './pages/clerk/Dashboard';
import ClerkCases from './pages/clerk/Cases';
import ClerkDocuments from './pages/clerk/Documents';
import ClerkAnalytics from './pages/clerk/Analytics';
import ClerkGenericPage from './pages/clerk/GenericPage';

const RoleRedirect: React.FC = () => {
  const { user } = useAuth();
  const rolePath = user?.role ? (user.role === 'court_clerk' ? 'clerk' : user.role) : 'police';
  return <Navigate to={`/${rolePath}/dashboard`} replace />;
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    // Let the protected root redirect to the appropriate role dashboard
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1F2937',
                color: '#F9FAFB',
                border: '1px solid #374151',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#F9FAFB',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#F9FAFB',
                },
              },
            }}
          />
          
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />

            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<RoleRedirect />} />

              {/* Police routes */}
              <Route path="police">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<PoliceDashboard />} />
                <Route path="fir-intake" element={<PoliceFIRIntake />} />
                <Route path="cases" element={<PoliceCases />} />
                <Route path="cases/:caseId" element={<PoliceCaseDetail />} />
                <Route path="fir/:firId" element={<PoliceFIRDetail />} />
                <Route path="documents" element={<PoliceDocuments />} />
                <Route path="documents/:docId" element={<PoliceDocumentDetail />} />
                <Route path="evidence/:caseId" element={<PoliceEvidenceList />} />
                <Route path="charge-sheet/:caseId" element={<PoliceChargeSheet />} />
                <Route path="evidence-list/:caseId" element={<PoliceEvidenceListTemplate />} />
                <Route path="witness-list/:caseId" element={<PoliceWitnessList />} />
                <Route path="*" element={<PoliceGenericPage title="Police" description="Police pages" />} />
              </Route>

              {/* SHO routes */}
              <Route path="sho">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<SHODashboard />} />
                <Route path="assign/:caseId?" element={<SHOAssignCase />} />
                <Route path="cases" element={<SHOCases />} />
                <Route path="documents" element={<SHODocuments />} />
                <Route path="remand/:caseId" element={<SHORemandApplication />} />
                <Route path="analytics" element={<SHOAnalytics />} />
                <Route path="*" element={<SHOGenericPage title="SHO" description="SHO pages" />} />
              </Route>

              {/* Judge routes */}
              <Route path="judge">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<JudgeDashboard />} />
                <Route path="cases" element={<JudgeCases />} />
                <Route path="documents" element={<JudgeDocuments />} />
                <Route path="audit" element={<JudgeAuditTrail />} />
                <Route path="notifications" element={<JudgeNotifications />} />
                <Route path="judgments" element={<JudgeGenericPage title="Judgments" description="View case judgments" />} />
                <Route path="*" element={<JudgeGenericPage title="Judge" description="Judge pages" />} />
              </Route>

              {/* Clerk routes */}
              <Route path="clerk">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ClerkDashboard />} />
                <Route path="cases" element={<ClerkCases />} />
                <Route path="documents" element={<ClerkDocuments />} />
                <Route path="analytics" element={<ClerkAnalytics />} />
                <Route path="*" element={<ClerkGenericPage title="Clerk" description="Clerk pages" />} />
              </Route>

            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;