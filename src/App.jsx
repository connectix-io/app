import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DirectionProvider } from './context/DirectionContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SipPhoneProvider } from './context/SipPhoneContext';
import { useACL } from './hooks/useACL';
import { ROUTE_PERMISSIONS } from './config/permissions';
import Layout from './components/Layout/Layout.jsx';

import Login from './components/Login/Login.jsx';
import Conversations from './components/Conversations/Conversations.jsx';

function getPermissionForPath(pathname) {
  if (ROUTE_PERMISSIONS[pathname]) return ROUTE_PERMISSIONS[pathname];
  for (const [pattern, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    const regex = new RegExp('^' + pattern.replace(/:[\w]+/g, '[^/]+') + '$');
    if (regex.test(pathname)) return permission;
  }
  return null;
}

const ProtectedRoute = ({ children, permission }) => {
  const { isAuthenticated } = useAuth();
  const { can } = useACL();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const requiredPermission = permission || getPermissionForPath(location.pathname);
  // Signed in without the permission: back to sign-in (never to a guarded page: that loops).
  if (requiredPermission && !can(requiredPermission)) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/conversations" replace />;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute><Layout><Login /></Layout></PublicRoute>} />
        <Route path="/conversations" element={<ProtectedRoute><Layout><Conversations /></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <DirectionProvider>
      <AuthProvider>
        <SipPhoneProvider>
            <AppContent />
        </SipPhoneProvider>
      </AuthProvider>
    </DirectionProvider>
  );
}

export default App;
