import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isMockMode } from '../../services/apiClient';
import type { UserRole } from '../../types';

export const DemoRoleBanner: React.FC = () => {
  const { user, switchDemoRole, login } = useAuth();
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleRoleChange = async (role: UserRole, targetRoute: string) => {
    if (isMockMode()) {
      switchDemoRole(role);
      navigate(targetRoute);
    } else {
      setIsSwitching(true);
      const emailMap: Record<UserRole, string> = {
        CITIZEN: 'akshit@potholefix.in',
        AUTHORITY: 'alice@potholefix.gov.in',
        REPAIR_TEAM: 'gurpreet@pwd.punjab.gov.in',
        COMPANY: 'csr.roads@tatamotors.com',
      };
      try {
        await login(emailMap[role], undefined, 'password123');
        navigate(targetRoute);
      } catch (err) {
        console.error('Fast-Switch login failed:', err);
      } finally {
        setIsSwitching(false);
      }
    }
  };

  return (
    <div className="bg-surface-container-low border-b border-outline-variant/30 px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-body-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary-container">hub</span>
          <span className="font-display-hero text-label-sm uppercase tracking-wider font-semibold text-on-surface">
            Judge Fast-Switch
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-primary-fixed text-on-primary-fixed">
            {isMockMode() ? 'Hackathon Bypass' : 'Real RBAC Switch'}
          </span>
          <span className="hidden md:inline text-secondary text-[11px]">
            {isMockMode()
              ? 'Switch roles instantly for evaluation. Authentication remains separated.'
              : 'Authenticates real JWT Bearer token with backend for each municipal role.'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Citizen Switch */}
          <button
            type="button"
            disabled={isSwitching}
            onClick={() => handleRoleChange('CITIZEN', '/citizen/dashboard')}
            className={`px-2.5 py-1 rounded-md text-label-sm font-semibold transition-all flex items-center gap-1.5 ${
              user?.role === 'CITIZEN'
                ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/40'
                : 'text-secondary hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span>Citizen (Akshit Sharma)</span>
          </button>

          {/* Authority Switch */}
          <button
            type="button"
            disabled={isSwitching}
            onClick={() => handleRoleChange('AUTHORITY', '/authority/dashboard')}
            className={`px-2.5 py-1 rounded-md text-label-sm font-semibold transition-all flex items-center gap-1.5 ${
              user?.role === 'AUTHORITY'
                ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/40'
                : 'text-secondary hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Authority (Alice Sharma)</span>
          </button>

          {/* Repair Crew Switch */}
          <button
            type="button"
            disabled={isSwitching}
            onClick={() => handleRoleChange('REPAIR_TEAM', '/team/dashboard')}
            className={`px-2.5 py-1 rounded-md text-label-sm font-semibold transition-all flex items-center gap-1.5 ${
              user?.role === 'REPAIR_TEAM'
                ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/40'
                : 'text-secondary hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            <span>Crew Lead (Gurpreet Singh)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
