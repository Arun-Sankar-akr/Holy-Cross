import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, storageKey = 'studentUser', redirectPath = '/login' }) {
    const location = useLocation();
    const storedUser = localStorage.getItem(storageKey);

    // If no user data is found, redirect to login while saving the attempted path
    if (!storedUser) {
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    // Render child component if authenticated
    return children;
}