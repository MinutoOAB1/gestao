import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface PortalUser {
  id: string;
  name: string;
  email: string;
  tenantId: string;
}

interface PortalAuthContextType {
  user: PortalUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: PortalUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

export const PortalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('@Advus:portalToken');
    const storedUser = localStorage.getItem('@Advus:portalUser');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: PortalUser) => {
    localStorage.setItem('@Advus:portalToken', newToken);
    localStorage.setItem('@Advus:portalUser', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    localStorage.removeItem('@Advus:portalToken');
    localStorage.removeItem('@Advus:portalUser');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <PortalAuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, isLoading }}>
      {children}
    </PortalAuthContext.Provider>
  );
};

export const usePortalAuth = () => {
  const context = useContext(PortalAuthContext);
  if (context === undefined) {
    throw new Error('usePortalAuth must be used within a PortalAuthProvider');
  }
  return context;
};
