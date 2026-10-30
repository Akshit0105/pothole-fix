import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthorityLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Triage Overview', path: '/authority/dashboard', icon: 'dashboard' },
    { label: 'Incoming Reports', path: '/authority/reports', icon: 'flag' },
    { label: 'Active Work Orders', path: '/authority/tasks', icon: 'assignment' },
    { label: 'Repair Approvals', path: '/authority/approvals', icon: 'verified' },
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

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-variant transition-colors"
          aria-label="Toggle navigation menu"
        >
          <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
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
          <div className="flex items-center gap-2.5 pb-6 mb-6 border-b border-surface-container-high shrink-0">
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-title-md text-label-md transition-all ${
                    isActive
                      ? 'bg-primary-fixed/40 text-primary font-semibold shadow-xs'
                      : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Authority User Strip */}
          <div className="pt-4 border-t border-surface-container-high flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-display-hero text-code-sm font-semibold shrink-0">
                {user?.avatarInitials || 'AS'}
              </div>
              <div className="min-w-0">
                <span className="font-title-md text-label-md text-on-surface block truncate font-medium">
                  {user?.name || 'Alice Sharma'}
                </span>
                <span className="font-body-sm text-[11px] text-secondary block truncate">
                  Public Works Authority
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-secondary hover:text-error hover:bg-surface-container-low transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
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
