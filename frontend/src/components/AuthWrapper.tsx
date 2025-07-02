// components/AuthWrapper.tsx
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialize = useAuthStore((s) => s.initializeFromSession);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    initialize();
    setHydrated(true); // Mark hydration complete
  }, []);

  if (!hydrated) {
    return <div>Loading...</div>; // or a splash screen
  }

  return <>{children}</>;
};

export default AuthWrapper;
