import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const CompanyLoginPage: React.FC = () => {
  const { login, signup, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/company';

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [companyName, setCompanyName] = useState('Tata Motors Limited');
  const [email, setEmail] = useState('csr.roads@tatamotors.com');
  const [password, setPassword] = useState('password123');
  const [representativeName, setRepresentativeName] = useState('Vikramaditya Sengupta');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated as COMPANY, immediately navigate to company dashboard
  React.useEffect(() => {
    if (isAuthenticated && user?.role === 'COMPANY') {
      navigate(redirectParam, { replace: true });
    }
  }, [isAuthenticated, user, navigate, redirectParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'SIGNUP') {
        await signup(companyName, email, password);
        // Then login to ensure company role is attached
        await login(email, 'COMPANY', password);
      } else {
        await login(email, 'COMPANY', password);
      }
      navigate(redirectParam, { replace: true });
    } catch (err: any) {
      console.error('Company auth failure:', err);
      const detail = err.response?.data?.detail || err.message || 'Authentication failed. Please verify credentials.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSelect = (demoEmail: string, demoCompany: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setCompanyName(demoCompany);
  };

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-teal-500/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-4">
          <span className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md group-hover:bg-teal-700 transition-colors">
            <span className="material-symbols-outlined text-[24px]">domain</span>
          </span>
          <span className="font-display-hero text-2xl font-bold tracking-tight text-on-surface">
            PotholeFix
          </span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
          <span>Corporate CSR Portal</span>
        </div>

        <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">
          {mode === 'LOGIN' ? 'Sign In to Company Workspace' : 'Register Corporate CSR Partner'}
        </h2>
        <p className="mt-1 text-xs text-secondary max-w-sm mx-auto">
          {mode === 'LOGIN'
            ? 'Access your corporate sponsorship dashboard, track road defect pledges, and review field compaction audits.'
            : 'Register your organization to sponsor verified road repairs under Municipal Corporation CSR frameworks.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-surface rounded-3xl border border-outline-variant/40 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs font-bold hover:opacity-75 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'SIGNUP' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Company / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Tata Motors Limited"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    CSR Representative Name
                  </label>
                  <input
                    type="text"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    placeholder="e.g. Vikramaditya Sengupta"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Company CSR Official Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. csr.roads@tatamotors.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-on-surface">
                  Password *
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-teal-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Authenticating Company Identity...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                  <span>{mode === 'LOGIN' ? 'Sign In to CSR Workspace' : 'Complete Registration'}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Evaluation Fast-Fill Buttons */}
          <div className="pt-2 border-t border-outline-variant/20 space-y-2">
            <span className="text-[10px] uppercase font-bold text-secondary block text-center">
              Evaluation Fast-Select Verified Corporate Partners
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoSelect('csr.roads@tatamotors.com', 'Tata Motors Limited')}
                className="p-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container-low text-left text-xs transition-colors cursor-pointer"
              >
                <span className="font-bold text-on-surface block truncate">Tata Motors CSR</span>
                <span className="text-[10px] text-secondary font-mono block truncate">csr.roads@tatamotors.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoSelect('meera.csr@infosys.org', 'Infosys Foundation')}
                className="p-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container-low text-left text-xs transition-colors cursor-pointer"
              >
                <span className="font-bold text-on-surface block truncate">Infosys Foundation</span>
                <span className="text-[10px] text-secondary font-mono block truncate">meera.csr@infosys.org</span>
              </button>
            </div>
          </div>

          {/* Toggle Login / Registration Mode */}
          <div className="text-center pt-2">
            {mode === 'LOGIN' ? (
              <p className="text-xs text-secondary">
                Don't have a registered CSR account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('SIGNUP')}
                  className="text-teal-600 font-bold hover:underline cursor-pointer"
                >
                  Register Partner
                </button>
              </p>
            ) : (
              <p className="text-xs text-secondary">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('LOGIN')}
                  className="text-teal-600 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

          {/* Footer Back Links */}
          <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs text-secondary">
            <Link to="/" className="hover:text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">home</span>
              <span>Home</span>
            </Link>
            <Link to="/login" className="hover:text-primary flex items-center gap-1">
              <span>Citizen / Authority Login</span>
              <span className="material-symbols-outlined text-[14px]">east</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CompanyLoginPage;
