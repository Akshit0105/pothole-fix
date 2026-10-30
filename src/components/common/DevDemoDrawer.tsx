import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isMockMode } from '../../services/apiClient';
import { reportsService } from '../../services/reportsService';
import type { UserRole } from '../../types';

export const DevDemoDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const { user, switchDemoRole, login } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = async (role: UserRole, targetRoute: string) => {
    if (isMockMode()) {
      switchDemoRole(role);
      navigate(targetRoute);
      setIsOpen(false);
    } else {
      setIsSwitching(true);
      const emailMap: Record<UserRole, string> = {
        CITIZEN: 'akshit@potholefix.in',
        AUTHORITY: 'alice@potholefix.gov.in',
        REPAIR_TEAM: 'gurpreet@pwd.punjab.gov.in',
      };
      try {
        await login(emailMap[role], undefined, 'password123');
        navigate(targetRoute);
        setIsOpen(false);
      } catch (err) {
        console.error('Fast-Switch login failed:', err);
      } finally {
        setIsSwitching(false);
      }
    }
  };

  const handleResetData = async () => {
    await reportsService.resetDemoReports();
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-highest/90 hover:bg-surface-container-highest text-secondary hover:text-on-surface text-xs font-medium shadow-md border border-outline-variant/40 backdrop-blur-sm transition-all hover:scale-105"
          title="Open Hackathon Demo Switcher"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">tune</span>
          <span className="hidden sm:inline">Judge Demo Switcher</span>
        </button>
      ) : (
        <div className="w-80 bg-surface rounded-xl shadow-2xl border border-outline-variant p-4 backdrop-blur-md animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">tune</span>
              <span className="font-semibold text-sm text-on-surface">Judge Demo Switcher</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <p className="text-xs text-secondary mb-3">
            Active Mode: <strong className="text-on-surface">{isMockMode() ? 'Local Mock Data' : 'FastAPI + SQLite'}</strong>
            <br />
            Current Role: <span className="font-semibold text-primary">{user?.role || 'Guest (Public)'}</span>
          </p>

          <div className="space-y-2 mb-4">
            <button
              type="button"
              disabled={isSwitching}
              onClick={() => handleRoleChange('CITIZEN', '/citizen/dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                user?.role === 'CITIZEN'
                  ? 'bg-primary/10 text-primary border border-primary/30 font-semibold'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">person</span>
                <span>Citizen (Akshit Sharma)</span>
              </div>
              <span className="text-[10px] text-secondary">/citizen</span>
            </button>

            <button
              type="button"
              disabled={isSwitching}
              onClick={() => handleRoleChange('AUTHORITY', '/authority/dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                user?.role === 'AUTHORITY'
                  ? 'bg-primary/10 text-primary border border-primary/30 font-semibold'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">account_balance</span>
                <span>Municipal Authority (Alice Sharma)</span>
              </div>
              <span className="text-[10px] text-secondary">/authority</span>
            </button>

            <button
              type="button"
              disabled={isSwitching}
              onClick={() => handleRoleChange('REPAIR_TEAM', '/team/dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                user?.role === 'REPAIR_TEAM'
                  ? 'bg-primary/10 text-primary border border-primary/30 font-semibold'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">construction</span>
                <span>Repair Crew (Punjab PWD Unit 04 · Gurpreet Singh)</span>
              </div>
              <span className="text-[10px] text-secondary">/team</span>
            </button>
          </div>

          <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetData}
              className="text-[11px] text-secondary hover:text-error flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[13px]">refresh</span>
              <span>Reset Indian Seed Data</span>
            </button>
            <span className="text-[10px] text-secondary">Ctrl+Shift+D</span>
          </div>
        </div>
      )}
    </div>
  );
};
