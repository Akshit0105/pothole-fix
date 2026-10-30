import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { isMockMode, API_BASE_URL } from '../services/apiClient';
import { REPAIR_CREWS, type RepairCrewOption } from '../services/authService';
import type { UserRole } from '../types';

interface RoleOption {
  role: UserRole;
  title: string;
  badge: string;
  badgeColor: string;
  icon: string;
  description: string;
  demoEmail: string;
  demoName: string;
  targetDashboard: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'CITIZEN',
    title: 'Citizen Reporter',
    badge: 'Civic Reporter',
    badgeColor: 'bg-secondary-container text-on-secondary-container',
    icon: 'person',
    description: 'Report asphalt craters, upload GPS coordinates, and track ticket resolution lifecycle.',
    demoEmail: 'akshit@potholefix.in',
    demoName: 'Akshit Sharma',
    targetDashboard: '/citizen/dashboard',
  },
  {
    role: 'AUTHORITY',
    title: 'Municipal Authority',
    badge: 'Public Works Dept',
    badgeColor: 'bg-primary-fixed text-on-primary-fixed',
    icon: 'account_balance',
    description: 'Triage incoming road defects, verify severity, dispatch repair squads, and approve work orders.',
    demoEmail: 'alice@potholefix.gov.in',
    demoName: 'Commissioner Alice Sharma',
    targetDashboard: '/authority/dashboard',
  },
  {
    role: 'REPAIR_TEAM',
    title: 'Field Repair Crew',
    badge: '3 Registered Units',
    badgeColor: 'bg-tertiary-fixed text-on-tertiary-fixed',
    icon: 'engineering',
    description: 'Field workspace for municipal repair squads to navigate site coordinates, log compaction, and upload evidence.',
    demoEmail: 'gurpreet@pwd.punjab.gov.in',
    demoName: 'Gurpreet Singh (Lead)',
    targetDashboard: '/team/dashboard',
  },
];

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const roleParam = searchParams.get('role') as UserRole | null;
  const crewParam = searchParams.get('crew');
  const redirectParam = searchParams.get('redirect');

  const initialRole: UserRole =
    roleParam && ['CITIZEN', 'AUTHORITY', 'REPAIR_TEAM'].includes(roleParam)
      ? roleParam
      : redirectParam?.includes('/team')
      ? 'REPAIR_TEAM'
      : redirectParam?.includes('/authority')
      ? 'AUTHORITY'
      : 'CITIZEN';

  const initialCrew =
    (crewParam && REPAIR_CREWS.find((c) => c.teamId === crewParam || c.id === crewParam)) ||
    REPAIR_CREWS[0];

  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [selectedCrew, setSelectedCrew] = useState<RepairCrewOption>(initialCrew);
  const activeRoleOption = ROLE_OPTIONS.find((r) => r.role === selectedRole) || ROLE_OPTIONS[0];

  const initialEmail =
    initialRole === 'REPAIR_TEAM' ? initialCrew.email : activeRoleOption.demoEmail;

  const [email, setEmail] = useState<string>(initialEmail);
  const [password, setPassword] = useState<string>('password123');
  const [rememberSession, setRememberSession] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync selected role if URL query param changes via navigation
  const prevRoleParamRef = useRef(roleParam);
  useEffect(() => {
    if (roleParam && roleParam !== prevRoleParamRef.current) {
      prevRoleParamRef.current = roleParam;
      if (['CITIZEN', 'AUTHORITY', 'REPAIR_TEAM'].includes(roleParam)) {
        setSelectedRole(roleParam);
        if (roleParam === 'REPAIR_TEAM') {
          const matchedCrew =
            (crewParam && REPAIR_CREWS.find((c) => c.teamId === crewParam)) || selectedCrew;
          setEmail(matchedCrew.email);
        } else {
          const opt = ROLE_OPTIONS.find((r) => r.role === roleParam);
          if (opt) setEmail(opt.demoEmail);
        }
        setPassword('password123');
      }
    }
  }, [roleParam, crewParam, selectedCrew]);

  const handleRoleCardSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'REPAIR_TEAM') {
      setEmail(selectedCrew.email);
    } else {
      const option = ROLE_OPTIONS.find((r) => r.role === role);
      if (option) {
        setEmail(option.demoEmail);
      }
    }
    setPassword('password123');
    setErrorMessage(null);
    setFeedback(null);
  };

  const handleCrewSelect = (crew: RepairCrewOption) => {
    setSelectedCrew(crew);
    setEmail(crew.email);
    setPassword('password123');
    setErrorMessage(null);
    setFeedback(null);
  };

  const getTargetRoute = (userRole: UserRole): string => {
    const defaultRoute =
      userRole === 'AUTHORITY'
        ? '/authority/dashboard'
        : userRole === 'REPAIR_TEAM'
        ? '/team/dashboard'
        : '/citizen/dashboard';

    if (
      redirectParam &&
      ((userRole === 'REPAIR_TEAM' && redirectParam.startsWith('/team')) ||
        (userRole === 'AUTHORITY' && redirectParam.startsWith('/authority')) ||
        (userRole === 'CITIZEN' && redirectParam.startsWith('/citizen')))
    ) {
      return redirectParam;
    }
    return defaultRoute;
  };

  const handleQuickDemoLogin = async () => {
    setIsLoading(true);
    setFeedback(null);
    setErrorMessage(null);

    const target = getTargetRoute(selectedRole);

    if (isMockMode()) {
      switchDemoRole(selectedRole);
      setFeedback(`Switching to demo ${activeRoleOption.title}...`);
      setTimeout(() => navigate(target), 250);
      setIsLoading(false);
      return;
    }

    try {
      const targetEmail = selectedRole === 'REPAIR_TEAM' ? selectedCrew.email : activeRoleOption.demoEmail;
      const user = await login(targetEmail, undefined, 'password123');
      setFeedback(`Authenticated as ${user.name} (${user.unit || user.role}). Redirecting to ${target}...`);
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
      const target = getTargetRoute(authenticatedUser.role);
      setFeedback(`Session verified for ${authenticatedUser.name}. Redirecting to ${target}...`);
      setTimeout(() => {
        navigate(target);
      }, 350);
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
    <div className="min-h-[calc(100vh-4rem)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-center">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-outline-variant/30">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors group"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2">
          {!isMockMode() ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full text-[11px] text-primary font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real API Mode Active: <strong>{API_BASE_URL}</strong></span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] text-amber-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Mock Storage Mode</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Role Selection Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant/40 text-primary text-xs font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Step 1: Select Operational Role</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
              Sign In to PotholeFix
            </h1>
            <p className="text-secondary text-xs sm:text-sm mt-1">
              Select your municipal division below. The authentication form on the right will adapt automatically.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {ROLE_OPTIONS.map((option) => {
              const isSelected = selectedRole === option.role;
              return (
                <motion.div
                  key={option.role}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  onClick={() => handleRoleCardSelect(option.role)}
                  className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden ${
                    isSelected
                      ? 'bg-surface-container-lowest border-primary shadow-lg ring-2 ring-primary/20'
                      : 'bg-surface-container-lowest/80 border-outline-variant/40 hover:border-outline-variant hover:bg-surface-container-lowest hover:shadow-sm'
                  }`}
                >
                  {/* Selected Indicator Pill */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
                      <div className="bg-primary text-white text-[9px] font-bold py-0.5 w-24 text-center transform rotate-45 translate-x-6 translate-y-3 shadow-xs">
                        ACTIVE
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-xs ${
                        isSelected
                          ? 'bg-primary text-white shadow-primary/20'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl">{option.icon}</span>
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-on-surface">
                          {option.title}
                        </h3>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${option.badgeColor}`}>
                          {option.badge}
                        </span>
                      </div>

                      <p className="text-xs text-secondary leading-relaxed line-clamp-2">
                        {option.description}
                      </p>

                      <div className="pt-1.5 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-secondary truncate">
                          {option.role === 'REPAIR_TEAM'
                            ? `${selectedCrew.unit} (${selectedCrew.name})`
                            : option.demoEmail}
                        </span>
                        <span className={`font-semibold shrink-0 ml-2 ${isSelected ? 'text-primary' : 'text-secondary'}`}>
                          {isSelected ? 'Ready →' : 'Select'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
            <span>
              All demo accounts use password: <code className="font-mono font-bold text-on-surface">password123</code>
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Dynamic Role Sign-In Form */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRole}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 p-6 sm:p-8"
            >
              {/* Form Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-outline-variant/20 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider mb-1.5">
                    <span className="material-symbols-outlined text-[14px]">{activeRoleOption.icon}</span>
                    <span>{activeRoleOption.title} Portal</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                    {selectedRole === 'REPAIR_TEAM'
                      ? `Sign In as ${selectedCrew.name}`
                      : `Sign In as ${activeRoleOption.demoName}`}
                  </h2>
                  <p className="text-xs text-secondary mt-1">
                    {selectedRole === 'REPAIR_TEAM'
                      ? `${selectedCrew.unit} · ${selectedCrew.department}`
                      : 'Enter official credentials below or verify using the one-click demo pass.'}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">{activeRoleOption.icon}</span>
                </div>
              </div>

              {/* Feedback and Alerts */}
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 mb-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">check_circle</span>
                  <span className="font-medium">{feedback}</span>
                </motion.div>
              )}

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 mb-5 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
                  <span className="font-medium">{errorMessage}</span>
                </motion.div>
              )}

              {/* Repair Crew Specific: 3 Selectable Crew Cards */}
              {selectedRole === 'REPAIR_TEAM' && (
                <div className="mb-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                      Select Field Repair Squad ({REPAIR_CREWS.length} Units Available)
                    </label>
                    <span className="text-[11px] text-primary font-semibold">
                      Independent Crew RBAC
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {REPAIR_CREWS.map((crew) => {
                      const isCrewActive = selectedCrew.teamId === crew.teamId;
                      return (
                        <button
                          key={crew.teamId}
                          type="button"
                          onClick={() => handleCrewSelect(crew)}
                          className={`p-3 rounded-xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                            isCrewActive
                              ? 'bg-primary/10 border-primary shadow-xs ring-2 ring-primary/20'
                              : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/30 hover:border-outline-variant'
                          }`}
                        >
                          {isCrewActive && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                          )}
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isCrewActive ? 'text-primary' : 'text-secondary'}`}>
                              {crew.teamId.toUpperCase()}
                            </span>
                            <h4 className="font-bold text-xs text-on-surface mt-0.5 line-clamp-1">
                              {crew.unit}
                            </h4>
                            <p className="text-[11px] text-secondary mt-0.5 line-clamp-1">
                              Lead: {crew.name}
                            </p>
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-outline-variant/20 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-secondary truncate max-w-[110px]">
                              {crew.email}
                            </span>
                            <span className={`font-semibold shrink-0 ml-1 ${isCrewActive ? 'text-primary' : 'text-secondary'}`}>
                              {isCrewActive ? 'Active' : 'Select'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5" htmlFor="loginEmail">
                    {selectedRole === 'REPAIR_TEAM'
                      ? `Official Crew Email (${selectedCrew.unit})`
                      : 'Official Email'}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                    </span>
                    <input
                      id="loginEmail"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="name@domain.gov.in"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-on-surface" htmlFor="loginPassword">
                      Account Password
                    </label>
                    <span className="text-[11px] text-secondary">Default Demo: password123</span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                      <span className="material-symbols-outlined text-[18px]">key</span>
                    </span>
                    <input
                      id="loginPassword"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-secondary pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberSession}
                      onChange={(e) => setRememberSession(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
                    />
                    <span>Keep session active</span>
                  </label>

                  {selectedRole === 'CITIZEN' ? (
                    <Link to="/signup" className="text-primary hover:underline font-semibold">
                      Register Citizen Account →
                    </Link>
                  ) : (
                    <span className="text-[11px] text-secondary">
                      Municipal RBAC Enforced
                    </span>
                  )}
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>
                    {isLoading
                      ? 'Authenticating...'
                      : selectedRole === 'REPAIR_TEAM'
                      ? `Sign In as ${selectedCrew.name} (${selectedCrew.unit})`
                      : `Sign In to ${activeRoleOption.title} Workspace`}
                  </span>
                </button>

                {/* Quick One-Click Demo Fast-Login */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleQuickDemoLogin}
                    className="w-full py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-outline-variant/30"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
                    <span>
                      {selectedRole === 'REPAIR_TEAM'
                        ? `1-Click Evaluation Sign In as ${selectedCrew.name} (${selectedCrew.unit})`
                        : `1-Click Evaluation Sign In as ${activeRoleOption.demoName}`}
                    </span>
                  </button>
                </div>
              </form>

              {/* Footer Links */}
              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 text-xs text-secondary">
                <Link
                  to="/"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">home</span>
                  <span>Return to Home</span>
                </Link>

                <Link
                  to="/resolution-preview"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Citizen Resolution Email Preview</span>
                  <span className="material-symbols-outlined text-[14px]">east</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
