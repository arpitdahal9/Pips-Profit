import React, { createContext, useContext, useMemo, useState } from 'react';
import AuthModal from '../components/AuthModal';

type AuthModalContextValue = {
  openAuthModal: () => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      openAuthModal: () => setIsOpen(true),
      closeAuthModal: () => setIsOpen(false)
    }),
    []
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return context;
};
