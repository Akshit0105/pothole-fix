import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PublicLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'AUTHORITY') return '/authority/dashboard';
    if (user.role === 'REPAIR_TEAM') return '/team/dashboard';
    return '/citizen/dashboard';
  };

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Main Public Navbar */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
                <a href="#vision" className="font-title-md text-label-md text-secondary hover:text-on-surface transition-colors">
                  Vision
                </a>
                <a href="#features" className="font-title-md text-label-md text-secondary hover:text-on-surface transition-colors">
                  Platform
                </a>
                <a href="#how-it-works" className="font-title-md text-label-md text-secondary hover:text-on-surface transition-colors">
                  How It Works
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
              <>
                <Link
                  to={getDashboardLink()}
                  className="px-4 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-title-md text-body-md font-medium shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Enter Workspace</span>
                  <span className="material-symbols-outlined text-[16px]">east</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-2 text-xs font-semibold text-secondary hover:text-error hover:bg-surface-variant rounded-lg transition-colors"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low text-on-surface font-title-md text-label-md transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/citizen/report"
                  className="px-4 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-title-md text-label-md font-medium shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                  <span>Report Pothole</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer (Phase 12: Professional Compact Footer) */}
      <footer className="bg-surface-container-low border-t border-outline-variant/30 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-container text-on-primary shadow-xs">
                <span className="material-symbols-outlined text-[17px]">alt_route</span>
              </span>
              <span className="font-display-hero text-headline-sm font-bold text-on-surface">
                PotholeFix
              </span>
            </div>
            <p className="font-body-md text-secondary text-sm max-w-md mb-4">
              AI-powered road hazard detection, citizen reporting, and municipal triage dispatch platform. Built to empower urban local bodies and citizens with accountable, rapid repair workflows.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-xs text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pilot Deployment: Chandigarh Tricity &amp; Delhi Arterials</span>
            </div>
          </div>

          {/* Quick Nav */}
          <div>
            <h4 className="font-title-md text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <Link to="/citizen/report" className="hover:text-primary transition-colors">
                  Citizen Hazard Reporting
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Municipal Authority Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Field Repair Crew Workspace
                </Link>
              </li>
              <li>
                <Link to="/resolution-preview" className="hover:text-primary transition-colors">
                  Citizen Resolution Notifications
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Transparency */}
          <div>
            <h4 className="font-title-md text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
              Governance
            </h4>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <span className="text-secondary">MC Chandigarh Public Works</span>
              </li>
              <li>
                <span className="text-secondary">Punjab PWD Highway Cell</span>
              </li>
              <li>
                <span className="text-secondary">Open Road Safety Standards</span>
              </li>
              <li>
                <span className="text-secondary">Privacy &amp; Data Security</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
          <p>© 2026 PotholeFix. Smarter Roads. Safer Journeys. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>ISO 9001 Road Audit Compliant</span>
            <span>·</span>
            <span>Precision GIS Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
