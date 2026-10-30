import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserProfileMenu } from '../components/common/UserProfileMenu';

export const PublicLayout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'AUTHORITY') return '/authority/dashboard';
    if (user.role === 'REPAIR_TEAM') return '/team/dashboard';
    return '/citizen/dashboard';
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      navigate('/login?role=CITIZEN&redirect=/citizen/report');
    } else {
      navigate('/citizen/report');
    }
  };

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Main Public Navbar */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary-container text-on-primary shadow-sm group-hover:bg-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">alt_route</span>
            </span>
            <div>
              <span className="font-display-hero text-headline-sm font-bold text-on-surface tracking-tight block leading-tight">
                PotholeFix
              </span>
              <span className="font-body-sm text-[11px] text-secondary block leading-none">
                Smarter Roads. Safer Journeys.
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {isHome ? (
              <>
                <a href="#about" className="font-title-md text-label-md text-secondary hover:text-on-surface transition-colors">
                  About Us
                </a>
                <a href="#mission" className="font-title-md text-label-md text-secondary hover:text-on-surface transition-colors">
                  Mission
                </a>
                <a href="#features" className="font-title-md text-label-md text-secondary hover:text-on-surface transition-colors">
                  Platform
                </a>
                <a href="#how-it-works" className="font-title-md text-label-md text-secondary hover:text-on-surface transition-colors">
                  How It Works
                </a>
                <a href="#impact" className="font-title-md text-label-md text-secondary hover:text-on-surface transition-colors">
                  Impact Globe
                </a>
              </>
            ) : (
              <Link to="/" className="font-title-md text-label-md text-secondary hover:text-on-surface transition-colors">
                Overview
              </Link>
            )}

            <Link
              to="/resolution-preview"
              className={`font-title-md text-label-md transition-colors flex items-center gap-1.5 ${
                location.pathname === '/resolution-preview'
                  ? 'text-primary font-semibold'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">mail</span>
              <span>Citizen Resolution Preview</span>
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to={getDashboardLink()}
                  className="px-3.5 py-1.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-title-md text-label-md font-medium shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Enter Workspace</span>
                  <span className="material-symbols-outlined text-[16px]">east</span>
                </Link>
                <UserProfileMenu align="right" />
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low text-on-surface font-title-md text-label-md transition-colors"
                >
                  Sign In
                </Link>
                <button
                  type="button"
                  onClick={handleReportClick}
                  className="px-4 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-title-md text-label-md font-medium shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                  <span>Report Pothole</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Modern Compact Civic Footer */}
      <footer className="border-t border-outline-variant/30 bg-surface-container-lowest/80 text-secondary text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-on-surface">PotholeFix Civic Infrastructure Network</span>
            <span>·</span>
            <span>Municipal Corporation Chandigarh &amp; Punjab PWD</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hover:text-primary transition-colors">Lifecycle Audit</a>
            <a href="#impact" className="hover:text-primary transition-colors">3D Impact Map</a>
            <Link to="/resolution-preview" className="hover:text-primary transition-colors">Resolution Dispatch</Link>
            <Link to="/login" className="hover:text-primary transition-colors">Municipal Sign-In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
