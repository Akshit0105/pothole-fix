import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { UserProfileMenu } from '../components/common/UserProfileMenu';

export const CitizenLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/citizen/dashboard', icon: 'dashboard' },
    { label: 'Report Pothole', path: '/citizen/report', icon: 'add_a_photo' },
    { label: 'My Submissions', path: '/citizen/reports', icon: 'list_alt' },
  ];

  return (
    <div className="h-screen bg-background font-body-md text-on-surface flex flex-col overflow-hidden">
      {/* Citizen Workspace Top Navigation */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 shadow-xs shrink-0">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
              to="/"
              className="hidden lg:inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-on-surface px-2.5 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
              title="Return to Public Homepage"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              <span>Home</span>
            </Link>

            <Link
              to="/citizen/report"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-title-md text-label-md font-medium shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Report</span>
            </Link>

            {/* Animated Profile Hover Card */}
            <div className="pl-2 border-l border-surface-container-high">
              <UserProfileMenu align="right" />
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
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[11px] font-title-md ${
                  isActive ? 'text-primary font-bold' : 'text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Link
            to="/"
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[11px] font-title-md text-secondary"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area - Independently Scrollable */}
      <main className="flex-1 h-full overflow-y-auto max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 pb-16">
        <Outlet />
      </main>
    </div>
  );
};
