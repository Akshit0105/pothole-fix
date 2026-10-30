import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const CitizenLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/citizen/dashboard', icon: 'dashboard' },
    { label: 'Report Pothole', path: '/citizen/report', icon: 'add_a_photo' },
    { label: 'My Submissions', path: '/citizen/reports', icon: 'list_alt' },
  ];

  return (
    <div className="h-screen bg-background font-body-md text-on-surface flex flex-col overflow-hidden">
      {/* Citizen Workspace Top Navigation */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 shadow-xs shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/citizen/dashboard" className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-container text-on-primary">
                <span className="material-symbols-outlined text-[18px]">alt_route</span>
              </span>
              <div>
                <span className="font-display-hero text-headline-sm font-bold text-on-surface block leading-tight">
                  PotholeFix
                </span>
                <span className="font-body-sm text-[11px] text-secondary block leading-none">
                  Citizen Reporting Workspace
                </span>
              </div>
            </Link>

            {/* Desktop Nav Items */}
            <nav className="hidden md:flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-md font-title-md text-label-md flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
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

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/citizen/report"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-title-md text-label-md font-medium shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Report</span>
            </Link>

            <div className="flex items-center gap-2.5 pl-2 border-l border-surface-container-high">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-display-hero text-code-sm font-semibold">
                {user?.avatarInitials || 'AS'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="font-title-md text-label-md font-semibold text-on-surface block leading-tight">
                  {user?.name || 'Akshit Sharma'}
                </span>
                <span className="font-body-sm text-[11px] text-secondary block leading-none">
                  Verified Civic Reporter
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="w-8 h-8 rounded-lg text-secondary hover:text-error hover:bg-surface-container-low flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Subnav Strip */}
        <div className="md:hidden flex items-center justify-around border-t border-surface-container-high py-2 px-2 bg-surface-container-low">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-title-md transition-colors ${
                  isActive ? 'text-primary font-semibold' : 'text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Body - Independent Smooth Scrolling */}
      <main className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};
