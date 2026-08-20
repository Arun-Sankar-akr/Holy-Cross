import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ 
    children, 
    storageKey = 'studentUser', 
    redirectPath = '/erp/student' 
}) {
    const location = useLocation();
    const storedUser = localStorage.getItem(storageKey);

    // If no session exists, redirect back to the correct portal login
    if (!storedUser) {
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    return children;
}