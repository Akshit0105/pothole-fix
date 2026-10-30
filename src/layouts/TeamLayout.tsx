import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { UserProfileMenu } from '../components/common/UserProfileMenu';

export const TeamLayout: React.FC = () => {
  const location = useLocation();

  const navTabs = [
    { label: 'Assigned Work Queue', path: '/team/dashboard', icon: 'handyman' },
    { label: 'All Unit Tasks', path: '/team/tasks', icon: 'format_list_bulleted' },
  ];

  return (
    <div className="h-screen bg-background font-body-md text-on-surface flex flex-col overflow-hidden">
      {/* Field Crew Header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 shadow-xs shrink-0">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/team/dashboard" className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-tertiary-container text-on-tertiary shadow-sm">
              <span className="material-symbols-outlined text-[18px]">construction</span>
            </span>
            <div>
              <span className="font-display-hero text-headline-sm font-bold text-on-surface block leading-tight">
                Punjab PWD Unit 04
              </span>
              <span className="font-body-sm text-[11px] text-secondary block leading-none">
                Field Repair Crew Workspace
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-on-surface px-2.5 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
              title="Return to Public Homepage"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              <span>Home</span>
            </Link>

            {/* Profile Menu with Hover Card */}
            <UserProfileMenu align="right" />
          </div>
        </div>

        {/* Tab Bar */}
        <div className="bg-surface-container-low border-t border-surface-container-high px-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {navTabs.map((tab) => {
                const isActive = location.pathname === tab.path;
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-title-md transition-all ${
                      isActive
                        ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                        : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>

            <Link
              to="/"
              className="sm:hidden flex items-center gap-1 text-xs text-secondary hover:text-primary"
            >
              <span className="material-symbols-outlined text-[15px]">home</span>
              <span>Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area - Independently Scrollable */}
      <main className="flex-1 h-full overflow-y-auto max-w-5xl w-full mx-auto p-4 sm:p-6 pb-16">
        <Outlet />
      </main>
    </div>
  );
};
