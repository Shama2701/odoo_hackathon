import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/UI/LoadingSpinner';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Expenses from './pages/Expenses/Expenses';
import ExpenseForm from './pages/Expenses/ExpenseForm';
import ExpenseDetail from './pages/Expenses/ExpenseDetail';
import Approvals from './pages/Approvals/Approvals';
import Users from './pages/Users/Users';
import UserForm from './pages/Users/UserForm';
import ApprovalRules from './pages/ApprovalRules/ApprovalRules';
import ApprovalRuleForm from './pages/ApprovalRules/ApprovalRuleForm';
import Profile from './pages/Profile/Profile';
import CompanySettings from './pages/Company/CompanySettings';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } 
      />
      <Route 
        path="/reset-password" 
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Expense Routes */}
        <Route path="expenses" element={<Expenses />} />
        <Route path="expenses/new" element={<ExpenseForm />} />
        <Route path="expenses/:id" element={<ExpenseDetail />} />
        <Route path="expenses/:id/edit" element={<ExpenseForm />} />
        
        {/* Approval Routes */}
        <Route 
          path="approvals" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Approvals />
            </ProtectedRoute>
          } 
        />
        
        {/* User Management Routes */}
        <Route 
          path="users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="users/new" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="users/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserForm />
            </ProtectedRoute>
          } 
        />
        
        {/* Approval Rules Routes */}
        <Route 
          path="approval-rules" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ApprovalRules />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="approval-rules/new" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ApprovalRuleForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="approval-rules/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ApprovalRuleForm />
            </ProtectedRoute>
          } 
        />
        
        {/* Profile and Settings */}
        <Route path="profile" element={<Profile />} />
        <Route 
          path="company-settings" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CompanySettings />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
