import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companyService } from '../services/companyService';

export const CompanyLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const companyProfile = companyService.getCompanyProfile(user?.email);

  const handleLogout = () => {
    logout();
    navigate('/company/login', { replace: true });
  };

  const navItems = [
    { label: 'Dashboard Overview', path: '/company', icon: 'dashboard' },
    { label: 'Available Potholes', path: '/company/potholes', icon: 'travel_explore' },
    { label: 'Sponsorship Tracking', path: '/company/sponsorships', icon: 'track_changes' },
  ];

  const isCurrent = (path: string) => {
    if (path === '/company') {
      return location.pathname === '/company' || location.pathname === '/company/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface flex flex-col selection:bg-teal-500/20 selection:text-teal-700">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 shadow-xs shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left Brand & Portal Identification */}
          <div className="flex items-center gap-6">
            <Link to="/company" className="flex items-center gap-3 group">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-teal-600 text-white shadow-sm group-hover:bg-teal-700 transition-colors">
                <span className="material-symbols-outlined text-[20px]">domain</span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display-hero text-headline-sm font-bold text-on-surface tracking-tight block leading-tight">
                    PotholeFix
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-400 text-[10px] font-bold uppercase tracking-wider">
                    Company / CSR Portal
                  </span>
                </div>
                <span className="font-body-sm text-[11px] text-secondary block leading-none">
                  Municipal Road Repair Sponsorship Desk
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
              {navItems.map((item) => {
                const active = isCurrent(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3.5 py-1.5 rounded-lg font-title-md text-xs sm:text-label-md flex items-center gap-1.5 transition-all ${
                      active
                        ? 'bg-surface-container-lowest text-teal-700 dark:text-teal-400 font-bold shadow-xs'
                        : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Return to Main Website CTA */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-low text-secondary hover:text-on-surface text-xs font-semibold transition-colors"
              title="Return to Public Homepage"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              <span className="hidden sm:inline">Main Website</span>
            </Link>

            {/* Corporate Profile Chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="text-left leading-tight">
                <span className="font-bold text-on-surface block max-w-[150px] truncate text-[11px]">
                  {companyProfile.companyName}
                </span>
                <span className="text-[10px] text-secondary block truncate max-w-[150px]">
                  {user?.email || companyProfile.email}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              title="Sign Out of Company Workspace"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="hidden md:inline">Sign Out</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-secondary hover:text-on-surface hover:bg-surface-variant transition-colors"
              aria-label="Toggle navigation"
            >
              <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden p-4 bg-surface-container-lowest border-t border-outline-variant/30 space-y-2 animate-fadeIn">
            <div className="pb-2 border-b border-outline-variant/20 mb-2">
              <span className="text-[11px] text-secondary font-bold uppercase tracking-wider block">
                Active Sponsor
              </span>
              <span className="text-xs font-bold text-on-surface block">
                {companyProfile.companyName}
              </span>
            </div>

            {navItems.map((item) => {
              const active = isCurrent(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                    active
                      ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300'
                      : 'text-secondary hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-outline-variant/20 space-y-2">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-on-surface flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[17px]">arrow_back</span>
                <span>Return to Main Website</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer text-left"
              >
                <span className="material-symbols-outlined text-[17px]">logout</span>
                <span>Sign Out ({user?.email || companyProfile.email})</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <Outlet />
      </main>

      {/* Corporate Civic Footer */}
      <footer className="border-t border-outline-variant/30 bg-surface-container-lowest/80 text-secondary text-xs mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="font-semibold text-on-surface">PotholeFix Corporate &amp; CSR Infrastructure Network</span>
            <span>·</span>
            <span>In Partnership with Urban Local Bodies &amp; Public Works Departments</span>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/company/potholes" className="hover:text-teal-600 transition-colors">
              Eligible Corridors
            </Link>
            <Link to="/company/sponsorships" className="hover:text-teal-600 transition-colors">
              Pledge Tracking
            </Link>
            <Link to="/" className="hover:text-teal-600 transition-colors">
              Main Website
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
