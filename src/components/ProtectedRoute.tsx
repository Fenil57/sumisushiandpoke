import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, isAdmin } from '../services/authService';
import type { User } from 'firebase/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const adminCheck = await isAdmin(firebaseUser.uid);
        setAuthorized(adminCheck);
      } else {
        setAuthorized(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-sumi)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--color-shu)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-washi)]/50 text-xs tracking-[0.2em] uppercase">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !authorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
