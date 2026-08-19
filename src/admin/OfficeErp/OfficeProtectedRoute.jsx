import React from 'react';
import { Navigate } from 'react-router-dom';

const OfficeProtectedRoute = ({ children }) => {
    const officeUser = localStorage.getItem('officeUser');

    if (!officeUser) {
        return <Navigate to="/erp/office/login" replace />;
    }

    return children;
};

export default OfficeProtectedRoute;