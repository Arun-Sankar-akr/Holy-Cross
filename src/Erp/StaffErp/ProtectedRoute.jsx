import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check if staff user data exists in localStorage
  const staffUser = localStorage.getItem('staffUser');

  if (!staffUser) {
    // Redirect to the staff ERP login page if unauthenticated
    return <Navigate to="/erp/staff" replace />;
  }

  return children;
};

export default ProtectedRoute;