import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isMockMode, API_BASE_URL } from '../services/apiClient';
import type { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const roleParam = searchParams.get('role') as UserRole | null;
  const redirectParam = searchParams.get('redirect');

  const initialRole: UserRole =
    roleParam && ['CITIZEN', 'AUTHORITY', 'REPAIR_TEAM'].includes(roleParam)
      ? roleParam
      : redirectParam?.includes('/team')
      ? 'REPAIR_TEAM'
      : redirectParam?.includes('/authority')
      ? 'AUTHORITY'
      : 'CITIZEN';

  const initialEmail =
    initialRole === 'AUTHORITY'
      ? 'alice@potholefix.gov.in'
      : initialRole === 'REPAIR_TEAM'
      ? 'gurpreet@pwd.punjab.gov.in'
      : 'akshit@potholefix.in';

  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('password123');
  const [rememberSession, setRememberSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleCardSelect = (role: UserRole) => {
    setSelectedRole(role);
    setPassword('password123');
    setErrorMessage(null);

    if (role === 'CITIZEN') {
      setEmail('akshit@potholefix.in');
    } else if (role === 'AUTHORITY') {
      setEmail('alice@potholefix.gov.in');
    } else if (role === 'REPAIR_TEAM') {
      setEmail('gurpreet@pwd.punjab.gov.in');
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    handleRoleCardSelect(role);
    const defaultTarget = role === 'CITIZEN' ? '/citizen/dashboard' : role === 'AUTHORITY' ? '/authority/dashboard' : '/team/dashboard';
    const target = redirectParam && (
      (role === 'REPAIR_TEAM' && redirectParam.startsWith('/team')) ||
      (role === 'AUTHORITY' && redirectParam.startsWith('/authority')) ||
      (role === 'CITIZEN' && redirectParam.startsWith('/citizen'))
    ) ? redirectParam : defaultTarget;

    if (isMockMode()) {
      switchDemoRole(role);
      navigate(target);
      return;
    }

    const emailMap: Record<UserRole, string> = {
      CITIZEN: 'akshit@potholefix.in',
      AUTHORITY: 'alice@potholefix.gov.in',
      REPAIR_TEAM: 'gurpreet@pwd.punjab.gov.in',
    };

    setIsLoading(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const user = await login(emailMap[role], undefined, 'password123');
      setFeedback(`Authenticated as ${user.name}. Redirecting...`);
      setTimeout(() => navigate(target), 300);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const authenticatedUser = await login(email, undefined, password);

      let defaultTarget = '/citizen/dashboard';
      if (authenticatedUser.role === 'AUTHORITY') {
        defaultTarget = '/authority/dashboard';
      } else if (authenticatedUser.role === 'REPAIR_TEAM') {
        defaultTarget = '/team/dashboard';
      }

      const target = redirectParam && (
        (authenticatedUser.role === 'REPAIR_TEAM' && redirectParam.startsWith('/team')) ||
        (authenticatedUser.role === 'AUTHORITY' && redirectParam.startsWith('/authority')) ||
        (authenticatedUser.role === 'CITIZEN' && redirectParam.startsWith('/citizen'))
      ) ? redirectParam : defaultTarget;

      setFeedback(`Session verified. Redirecting to ${target}...`);
      setTimeout(() => {
        navigate(target);
      }, 400);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please verify credentials or check backend availability.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-10 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-primary text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Role-Based Municipal Access Control</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface">
          Sign In to PotholeFix
        </h1>
        <p className="text-secondary text-sm">
          Select your operational role below or sign in with registered credentials.
        </p>

        {!isMockMode() && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium">
            <span className="material-symbols-outlined text-[15px]">cloud_sync</span>
            <span>Real API Mode Active: <strong>{API_BASE_URL}</strong></span>
          </div>
        )}
      </div>

      {/* 3 Distinct Role Cards (Phase 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Card 1: Citizen */}
        <div
          onClick={() => handleRoleCardSelect('CITIZEN')}
          className={`cursor-pointer rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between ${
            selectedRole === 'CITIZEN'
              ? 'bg-primary/5 border-primary shadow-md ring-2 ring-primary/20'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:shadow-xs'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xl">person</span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container text-secondary">
                Citizen
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">Citizen Reporter</h3>
              <p className="text-xs text-secondary mt-1">
                Report road craters, upload GPS coordinates, and track ticket status.
              </p>
            </div>
            <div className="pt-2 text-xs text-secondary font-mono bg-surface-container-low p-2 rounded">
              akshit@potholefix.in
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickLogin('CITIZEN');
            }}
            className="mt-4 w-full py-2 px-3 rounded-lg bg-surface-container-high hover:bg-primary hover:text-white text-on-surface font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Quick Login as Citizen</span>
            <span className="material-symbols-outlined text-sm">east</span>
          </button>
        </div>

        {/* Card 2: Municipal Authority */}
        <div
          onClick={() => handleRoleCardSelect('AUTHORITY')}
          className={`cursor-pointer rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between ${
            selectedRole === 'AUTHORITY'
              ? 'bg-primary/5 border-primary shadow-md ring-2 ring-primary/20'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:shadow-xs'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xl">account_balance</span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-fixed/40 text-primary">
                Authority
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">Municipal Authority</h3>
              <p className="text-xs text-secondary mt-1">
                Triage incoming reports, assign repair squads, and approve completed work orders.
              </p>
            </div>
            <div className="pt-2 text-xs text-secondary font-mono bg-surface-container-low p-2 rounded">
              alice@potholefix.gov.in
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickLogin('AUTHORITY');
            }}
            className="mt-4 w-full py-2 px-3 rounded-lg bg-surface-container-high hover:bg-primary hover:text-white text-on-surface font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Quick Login as Authority</span>
            <span className="material-symbols-outlined text-sm">east</span>
          </button>
        </div>

        {/* Card 3: Repair Crew */}
        <div
          onClick={() => handleRoleCardSelect('REPAIR_TEAM')}
          className={`cursor-pointer rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between ${
            selectedRole === 'REPAIR_TEAM'
              ? 'bg-primary/5 border-primary shadow-md ring-2 ring-primary/20'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:shadow-xs'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xl">construction</span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-tertiary-fixed/40 text-tertiary">
                Field Crew
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">Punjab PWD Repair Crew</h3>
              <p className="text-xs text-secondary mt-1">
                Receive site work orders, log saw-cut &amp; compaction progress, upload restored photos.
              </p>
            </div>
            <div className="pt-2 text-xs text-secondary font-mono bg-surface-container-low p-2 rounded">
              gurpreet@pwd.punjab.gov.in
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickLogin('REPAIR_TEAM');
            }}
            className="mt-4 w-full py-2 px-3 rounded-lg bg-surface-container-high hover:bg-primary hover:text-white text-on-surface font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Quick Login as Crew</span>
            <span className="material-symbols-outlined text-sm">east</span>
          </button>
        </div>
      </div>

      {/* Main Authentication Form */}
      <div className="max-w-md mx-auto bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/30 p-6">
        <h2 className="text-lg font-bold text-on-surface mb-1">
          Sign In as {selectedRole === 'CITIZEN' ? 'Citizen' : selectedRole === 'AUTHORITY' ? 'Authority' : 'Repair Crew'}
        </h2>
        <p className="text-xs text-secondary mb-4">
          Credentials pre-filled from active role card above.
        </p>

        {feedback && (
          <div className="p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{feedback}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 mb-4 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1" htmlFor="loginEmail">
              Official Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[18px]">mail</span>
              </span>
              <input
                id="loginEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-on-surface" htmlFor="loginPassword">
                Password
              </label>
              <span className="text-[11px] text-secondary">Default: password123</span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[18px]">key</span>
              </span>
              <input
                id="loginPassword"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-secondary">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
              />
              <span>Keep session active</span>
            </label>
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Register Citizen
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Verifying...' : `Sign In to ${selectedRole === 'CITIZEN' ? 'Citizen' : selectedRole === 'AUTHORITY' ? 'Authority' : 'Crew'} Workspace`}</span>
            <span className="material-symbols-outlined text-[18px]">east</span>
          </button>
        </form>

        <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-secondary">
          <span>Need email resolution proof?</span>
          <Link
            to="/resolution-preview"
            className="text-primary hover:underline font-medium flex items-center gap-1"
          >
            <span>Preview Email</span>
            <span className="material-symbols-outlined text-[14px]">east</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
