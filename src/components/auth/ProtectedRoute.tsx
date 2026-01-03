import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Login } from './Login';
import { Signup } from './Signup';

interface Props {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          {showSignup ? (
            <Signup onToggleLogin={() => setShowSignup(false)} />
          ) : (
            <Login onToggleSignup={() => setShowSignup(true)} />
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
