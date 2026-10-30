import React, { useState } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './common/LoadingState';
import { Button } from './common/Button';
import { isMockMode } from '../services/apiClient';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ROLE_META: Record<UserRole, {
  name: string;
  email: string;
  portalName: string;
  roleLabel: string;
  dashboardRoute: string;
  icon: string;
}> = {
  CITIZEN: {
    name: 'Akshit Sharma',
    email: 'akshit@potholefix.in',
    portalName: 'Citizen Reporter Portal',
    roleLabel: 'Citizen Reporter',
    dashboardRoute: '/citizen/dashboard',
    icon: 'person',
  },
  AUTHORITY: {
    name: 'Commissioner Alice Sharma',
    email: 'alice@potholefix.gov.in',
    portalName: 'Municipal Authority Triage Hub',
    roleLabel: 'Municipal Authority',
    dashboardRoute: '/authority/dashboard',
    icon: 'account_balance',
  },
  REPAIR_TEAM: {
    name: 'Gurpreet Singh',
    email: 'gurpreet@pwd.punjab.gov.in',
    portalName: 'Field Repair Crew Workspace',
    roleLabel: 'Field Repair Crew Lead',
    dashboardRoute: '/team/dashboard',
    icon: 'engineering',
  },
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading, login, switchDemoRole } = useAuth();
  const location = useLocation();
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingState message="Verifying municipal credentials and session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const targetRole = allowedRoles[0] || 'CITIZEN';
    const targetMeta = ROLE_META[targetRole];
    const currentMeta = ROLE_META[user.role];

    const handleQuickSwitch = async () => {
      setIsSwitching(true);
      setSwitchError(null);
      try {
        if (isMockMode()) {
          switchDemoRole(targetRole);
        } else {
          await login(targetMeta.email, undefined, 'password123');
        }
      } catch (err) {
        console.error('Account switch failed:', err);
        setSwitchError(err instanceof Error ? err.message : 'Authentication switch failed.');
      } finally {
        setIsSwitching(false);
      }
    };

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-background">
        <div className="max-w-lg w-full bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">swap_horiz</span>
            </div>
            <h2 className="text-2xl font-display-hero font-bold text-on-surface">
              Role Authorization Required
            </h2>
            <p className="text-sm text-secondary">
              The <strong className="text-on-surface">{targetMeta.portalName}</strong> is restricted to{' '}
              <strong className="text-primary">{targetMeta.roleLabel}</strong> accounts.
            </p>
          </div>

          {/* Current vs Target Session Cards */}
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-lg">{currentMeta?.icon || 'person'}</span>
                </div>
                <div>
                  <div className="text-xs text-secondary font-medium">Currently Signed In</div>
                  <div className="text-sm font-semibold text-on-surface">{user.name}</div>
                  <div className="text-xs text-secondary font-mono">{user.email}</div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-container-high text-secondary">
                {currentMeta?.roleLabel || user.role}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">{targetMeta.icon}</span>
                </div>
                <div>
                  <div className="text-xs text-primary font-medium">Required Authorization</div>
                  <div className="text-sm font-semibold text-on-surface">{targetMeta.name}</div>
                  <div className="text-xs text-secondary font-mono">{targetMeta.email}</div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">
                Required
              </span>
            </div>
          </div>

          {switchError && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{switchError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full shadow-md"
              isLoading={isSwitching}
              onClick={handleQuickSwitch}
              icon={<span className="material-symbols-outlined text-lg">sync_alt</span>}
            >
              Switch to {targetMeta.roleLabel} ({targetMeta.name.split(' ')[0]})
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                to={`/login?role=${targetRole}&redirect=${encodeURIComponent(location.pathname)}`}
                className="w-full"
              >
                <Button variant="secondary" size="md" className="w-full">
                  Sign in with Credentials
                </Button>
              </Link>
              <Link to={currentMeta?.dashboardRoute || '/'} className="w-full">
                <Button variant="ghost" size="md" className="w-full">
                  Return to My Workspace
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-outline-variant/20">
            <span className="text-[11px] text-secondary">
              PotholeFix Role-Based Municipal Access Control · Real JWT Token Authentication
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
