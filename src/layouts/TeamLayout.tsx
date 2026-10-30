import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const TeamLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navTabs = [
    { label: 'Assigned Work Queue', path: '/team/dashboard', icon: 'handyman' },
    { label: 'All Unit Tasks', path: '/team/tasks', icon: 'format_list_bulleted' },
  ];

  return (
    <div className="h-screen bg-background font-body-md text-on-surface flex flex-col overflow-hidden">
      {/* Field Crew Header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 shadow-xs shrink-0">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
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
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-display-hero text-code-sm font-semibold">
                {user?.avatarInitials || 'GS'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="font-title-md text-label-md text-on-surface block leading-tight font-medium">
                  {user?.name || 'Gurpreet Singh'}
                </span>
                <span className="font-body-sm text-[11px] text-tertiary block leading-none">
                  Crew Lead
                </span>
              </div>
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

        {/* Tab Bar */}
        <div className="bg-surface-container-low border-t border-surface-container-high px-4">
          <div className="max-w-5xl mx-auto flex items-center gap-2 py-2">
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
        </div>
      </header>

      {/* Main Content Area - Independently Scrollable */}
      <main className="flex-1 h-full overflow-y-auto max-w-5xl w-full mx-auto p-4 sm:p-6 pb-16">
        <Outlet />
      </main>
    </div>
  );
};
