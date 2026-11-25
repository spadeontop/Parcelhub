import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { StaffUser } from '../types';
import { staffApi } from '../services/staffApi';
import { staffStorage } from '../services/staffStorage';
import { setUnauthorizedHandler } from '../services/apiClient';
import { staffQueryClient } from '../query/queryClient';

interface StaffAuthContextType {
  staffUser: StaffUser | null;
  isAuthenticated: boolean;
  isInitialLoading: boolean;
  sessionExpiredMessage: string | null;
  clearSessionExpiredMessage: () => void;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

function buildStaffUser(username: string, token: string): StaffUser {
  return {
    id: 'STF-001',
    name: 'Jane Smith',
    username,
    email: username,
    role: 'STAFF',
    hubName: "LILY'S CATERING HUB",
    token,
  };
}

export const StaffAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  const clearSessionExpiredMessage = useCallback(() => {
    setSessionExpiredMessage(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setStaffUser(null);
      staffQueryClient.clear();
      setSessionExpiredMessage('Session expired. Please sign in again.');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [token, email] = await Promise.all([
          staffStorage.getAuthToken(),
          staffStorage.getStaffEmail(),
        ]);
        if (token && email && isMounted) {
          setStaffUser(buildStaffUser(email, token));
        }
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const res = await staffApi.login(usernameOrEmail, password);
    const normalizedUsername = usernameOrEmail.trim().includes('@')
      ? usernameOrEmail.trim().split('@')[0].toLowerCase()
      : usernameOrEmail.trim().toLowerCase();
    setSessionExpiredMessage(null);
    setStaffUser(buildStaffUser(normalizedUsername, res.authToken));
  }, []);

  const logout = useCallback(async () => {
    await staffApi.clearStoredSession();
    staffQueryClient.clear();
    setSessionExpiredMessage(null);
    setStaffUser(null);
  }, []);

  return (
    <StaffAuthContext.Provider
      value={{
        staffUser,
        isAuthenticated: !!staffUser,
        isInitialLoading,
        sessionExpiredMessage,
        clearSessionExpiredMessage,
        login,
        logout,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
};

export function useStaffAuth(): StaffAuthContextType {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
}
