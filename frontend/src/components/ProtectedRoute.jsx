import React from 'react';
import { Navigate } from 'react-router-dom';

const AccessDenied = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-600 mb-6">
        You do not have permission to access this page. Admin privileges are required.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
      >
        Return to Home
      </a>
    </div>
  </div>
);

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If admin access is required, check user role
  if (requireAdmin) {
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return <Navigate to="/login" replace />;
    }
    
    if (!user || user.role !== 'admin') {
      // Not an admin, show access denied page
      return <AccessDenied />;
    }
  }

  return children;
};

export default ProtectedRoute;
