import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import InvestorDashboard from './pages/InvestorDashboard';
import ScamRadarFeed from './pages/ScamRadarFeed';
import AdminConsole from './pages/AdminConsole';
import Login from './pages/Login';
import ShieldTrain from './pages/ShieldTrain';
import WhatsAppBotSimulator from './pages/WhatsAppBotSimulator';
import SocialExtensionMock from './pages/SocialExtensionMock';
import { useAuth } from './context/AuthContext';
import type { ReactNode } from 'react';

const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles: string[] }) => {
  const { userRole } = useAuth();
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <ProtectedRoute allowedRoles={['investor', 'admin']}>
            <InvestorDashboard />
          </ProtectedRoute>
        } />
        <Route path="radar" element={
          <ProtectedRoute allowedRoles={['investor', 'admin']}>
            <ScamRadarFeed />
          </ProtectedRoute>
        } />
        <Route path="training" element={
          <ProtectedRoute allowedRoles={['investor', 'admin']}>
            <ShieldTrain />
          </ProtectedRoute>
        } />
        <Route path="bot" element={
          <ProtectedRoute allowedRoles={['investor', 'admin']}>
            <WhatsAppBotSimulator />
          </ProtectedRoute>
        } />
        <Route path="extension" element={
          <ProtectedRoute allowedRoles={['investor', 'admin']}>
            <SocialExtensionMock />
          </ProtectedRoute>
        } />
        <Route path="login" element={<Login />} />
        <Route path="admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminConsole />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default App;
