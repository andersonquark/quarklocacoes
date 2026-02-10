import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import NewOrder from './pages/NewOrder';
import Orders from './pages/Orders';
import Clients from './pages/Clients';
import Finance from './pages/Finance';
import ClientPortal from './pages/ClientPortal';
import Settings from './pages/Settings';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
             {user?.role === 'ADMIN' ? <Dashboard /> : <ClientPortal />}
          </Layout>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/inventory" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Layout><Inventory /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/new-order" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Layout><NewOrder /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/orders" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Layout><Orders /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/clients" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Layout><Clients /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/finance" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Layout><Finance /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Layout><Settings /></Layout>
        </ProtectedRoute>
      } />

      {/* Client Routes */}
      <Route path="/my-orders" element={
        <ProtectedRoute allowedRoles={['CLIENT']}>
          <Layout><ClientPortal /></Layout>
        </ProtectedRoute>
      } />

       <Route path="/contracts" element={
        <ProtectedRoute allowedRoles={['CLIENT']}>
          <Layout><ClientPortal /></Layout>
        </ProtectedRoute>
      } />

    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <StoreProvider>
        <Router>
          <AppRoutes />
        </Router>
      </StoreProvider>
    </AuthProvider>
  );
};

export default App;