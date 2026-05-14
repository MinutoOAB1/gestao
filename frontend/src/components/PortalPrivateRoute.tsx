import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePortalAuth } from '../context/PortalAuthContext';

export const PortalPrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = usePortalAuth();

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#F5F7FA] z-50">
        <div className="w-10 h-10 border-4 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }

  return <>{children}</>;
};
