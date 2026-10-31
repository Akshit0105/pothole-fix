import React from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './common/LoadingState';
import { Button } from './common/Button';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ROLE_META: Record<UserRole, {
  portalName: string;
  roleLabel: string;
  dashboardRoute: string;
  icon: string;
  description: string;
}> = {
  CITIZEN: {
    portalName: 'Citizen Reporter Portal',
    roleLabel: 'Citizen Reporter',
    dashboardRoute: '/citizen/dashboard',
    icon: 'person',
    description: 'Submit road hazard reports, upload geotagged photos, and monitor repairs.',
  },
  AUTHORITY: {
    portalName: 'Municipal Authority Triage Hub',
    roleLabel: 'Municipal Authority',
    dashboardRoute: '/authority/dashboard',
    icon: 'account_balance',
    description: 'Triage incoming defects, verify severity, dispatch squads, and approve work.',
  },
  REPAIR_TEAM: {
    portalName: 'Field Repair Crew Workspace',
    roleLabel: 'Field Repair Squad',
    dashboardRoute: '/team/dashboard',
    icon: 'engineering',
    description: 'Mobile workspace to view assigned tasks, log repair progress, and upload compaction photos.',
  },
  COMPANY: {
    portalName: 'Corporate & CSR Sponsorship Portal',
    roleLabel: 'Corporate CSR Partner',
    dashboardRoute: '/company',
    icon: 'domain',
    description: 'Sponsor verified road defect restorations, customize funding, and track municipal field compaction audits.',
  },
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingState message="Verifying municipal credentials and session..." />;
  }

  // 1. Unauthenticated -> Redirect to sign-in with preselected role and preserved redirect
  if (!isAuthenticated || !user) {
    const targetRole = allowedRoles?.[0] || 'CITIZEN';
    const loginTarget = targetRole === 'COMPANY'
      ? `/company/login?redirect=${encodeURIComponent(location.pathname)}`
      : `/login?role=${targetRole}&redirect=${encodeURIComponent(location.pathname)}`;
    return (
      <Navigate
        to={loginTarget}
        replace
      />
    );
  }

  // 2. Authenticated with another role -> Clear role switching without unauthorized bypass
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const targetRole = allowedRoles[0] || 'CITIZEN';
    const targetMeta = ROLE_META[targetRole];
    const currentMeta = ROLE_META[user.role];

    const handleSwitchRole = () => {
      // Clear current session so previous credentials/permissions are not retained
      logout();
      navigate(`/login?role=${targetRole}&redirect=${encodeURIComponent(location.pathname)}`);
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
            {/* Currently Logged In */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-xl">{currentMeta?.icon || 'person'}</span>
                </div>
                <div>
                  <div className="text-[11px] text-secondary font-medium">Currently Signed In</div>
                  <div className="text-sm font-semibold text-on-surface">{user.name}</div>
                  <div className="text-xs text-secondary font-mono">{user.email}</div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-container-high text-secondary">
                {currentMeta?.roleLabel || user.role}
              </span>
            </div>

            {/* Required Role */}
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-xl">{targetMeta.icon}</span>
                </div>
                <div>
                  <div className="text-[11px] text-primary font-bold">Required Authorization</div>
                  <div className="text-sm font-semibold text-on-surface">{targetMeta.roleLabel}</div>
                  <div className="text-xs text-secondary">{targetMeta.description}</div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">
                Required
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full shadow-md justify-center"
              onClick={handleSwitchRole}
              icon={<span className="material-symbols-outlined text-lg">login</span>}
            >
              Sign In as {targetMeta.roleLabel}
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link to={currentMeta?.dashboardRoute || '/'} className="w-full">
                <Button variant="secondary" size="md" className="w-full justify-center">
                  My Current Workspace
                </Button>
              </Link>
              <Link to="/" className="w-full">
                <Button variant="ghost" size="md" className="w-full justify-center">
                  Return to Home
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
