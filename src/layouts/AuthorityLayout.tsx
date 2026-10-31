import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { UserProfileMenu } from '../components/common/UserProfileMenu';
import { companyService } from '../services/companyService';

export const AuthorityLayout: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(() => companyService.getPendingRequestsCount());

  useEffect(() => {
    // Keep count reactive across storage events
    const updateCount = () => setPendingCount(companyService.getPendingRequestsCount());
    window.addEventListener('storage', updateCount);
    const interval = setInterval(updateCount, 2000);
    return () => {
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { label: 'Triage Overview', path: '/authority/dashboard', icon: 'dashboard' },
    { label: 'Incoming Reports', path: '/authority/reports', icon: 'flag' },
    { label: 'Active Work Orders', path: '/authority/tasks', icon: 'assignment' },
    { label: 'Repair Approvals', path: '/authority/approvals', icon: 'verified' },
    {
      label: 'Company Sponsorships',
      path: '/authority/sponsorships',
      icon: 'domain',
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
  ];

  return (
    <div className="h-screen bg-background font-body-md text-on-surface flex flex-col overflow-hidden">
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface-container-lowest border-b border-outline-variant/30 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
          </span>
          <div>
            <span className="font-display-hero text-title-md font-bold text-on-surface block leading-tight">
              PotholeFix
            </span>
            <span className="text-[11px] text-secondary block leading-none">
              MC Chandigarh Public Works
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UserProfileMenu align="right" compact />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-variant transition-colors"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Desktop & Mobile Sidebar (Fixed/Sticky & Independently Scrollable) */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
            w-64 h-full bg-surface-container-lowest border-r border-outline-variant/30
            flex flex-col shrink-0 overflow-y-auto
            transform transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            p-5
          `}
        >
          {/* Header Brand */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-surface-container-high shrink-0">
            <Link to="/authority/dashboard" className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[18px]">account_balance</span>
              </span>
              <div>
                <span className="font-display-hero text-headline-sm font-bold text-on-surface block leading-tight">
                  Public Works
                </span>
                <span className="font-body-sm text-[11px] text-secondary block leading-none">
                  Triage &amp; Dispatch Desk
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg font-title-md text-label-md transition-all ${
                    isActive
                      ? 'bg-primary-fixed/40 text-primary font-semibold shadow-xs'
                      : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-xs ${item.badgeColor || 'bg-amber-500 text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-surface-container-high">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-title-md text-label-md text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">home</span>
                <span>Public Homepage</span>
              </Link>
            </div>
          </nav>

          {/* Authority User Strip with Profile Hover Card */}
          <div className="pt-4 border-t border-surface-container-high flex items-center justify-between shrink-0">
            <UserProfileMenu align="top" className="w-full" />
          </div>
        </aside>

        {/* Main Content Area - Independently Scrollable */}
        <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
