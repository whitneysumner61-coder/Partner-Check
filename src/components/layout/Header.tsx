import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import toast from 'react-hot-toast';

export const Header: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { tier } = useSubscription();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    window.location.href = '/';
  };

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <a 
          href="/app"
          className="text-2xl font-black tracking-tighter cursor-pointer flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white text-lg">P</div>
          <span>PartnerCheck</span>
        </a>
        <div className="flex items-center gap-4">
          {profile && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">{profile.full_name || profile.email}</span>
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase">
                {tier}
              </span>
            </div>
          )}
          <a 
            href="/dashboard"
            className="text-slate-500 hover:text-primary text-sm font-semibold"
          >
            Dashboard
          </a>
          <a 
            href="/app"
            className="text-slate-500 hover:text-primary text-sm font-semibold"
          >
            App
          </a>
          <button 
            onClick={handleSignOut}
            className="text-slate-500 hover:text-primary text-sm font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};
