import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface UserProfileMenuProps {
  align?: 'left' | 'right' | 'top';
  className?: string;
  compact?: boolean;
}

const ROLE_BADGE_MAP: Record<UserRole, { label: string; bg: string; text: string; icon: string }> = {
  CITIZEN: {
    label: 'Citizen Reporter',
    bg: 'bg-secondary-container',
    text: 'text-on-secondary-container',
    icon: 'person',
  },
  AUTHORITY: {
    label: 'Municipal Authority',
    bg: 'bg-primary-fixed',
    text: 'text-on-primary-fixed',
    icon: 'account_balance',
  },
  REPAIR_TEAM: {
    label: 'Field Repair Squad',
    bg: 'bg-tertiary-fixed',
    text: 'text-on-tertiary-fixed',
    icon: 'engineering',
  },
};

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  align = 'right',
  className = '',
  compact = false,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleSignOut = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const roleMeta = ROLE_BADGE_MAP[user.role] || ROLE_BADGE_MAP.CITIZEN;

  const dashboardRoute =
    user.role === 'AUTHORITY'
      ? '/authority/dashboard'
      : user.role === 'REPAIR_TEAM'
      ? '/team/dashboard'
      : '/citizen/dashboard';

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-surface-container-low transition-colors group text-left focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary-container text-on-primary font-display-hero text-xs sm:text-sm font-bold flex items-center justify-center shrink-0 shadow-xs ring-2 ring-primary/20 group-hover:ring-primary transition-all">
          {user.avatarInitials || user.name.slice(0, 2).toUpperCase()}
        </div>

        {!compact && (
          <div className="hidden sm:block min-w-0 text-left">
            <span className="font-title-md text-xs sm:text-sm font-semibold text-on-surface block leading-tight truncate">
              {user.name}
            </span>
            <span className="font-body-sm text-[11px] text-secondary block leading-none truncate">
              {user.title || roleMeta.label}
            </span>
          </div>
        )}

        <span className="material-symbols-outlined text-secondary text-[16px] hidden sm:inline-block transition-transform duration-200 group-hover:text-on-surface">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Floating Animated Profile Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: align === 'top' ? -10 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: align === 'top' ? -10 : 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`absolute z-50 w-72 sm:w-80 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 p-4 sm:p-5 backdrop-blur-md ${
              align === 'top'
                ? 'bottom-full mb-2 left-0'
                : align === 'left'
                ? 'top-full mt-2 left-0'
                : 'top-full mt-2 right-0'
            }`}
          >
            {/* Header info */}
            <div className="flex items-start gap-3 pb-3 border-b border-outline-variant/20">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white font-display-hero text-base font-bold flex items-center justify-center shrink-0 shadow-sm">
                {user.avatarInitials || user.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-title-md text-sm font-bold text-on-surface truncate">
                    {user.name}
                  </h4>
                  <span className="material-symbols-outlined text-primary text-[15px]" title="Authenticated Account">
                    verified
                  </span>
                </div>
                <p className="font-body-sm text-[11px] text-secondary truncate font-mono">
                  {user.email}
                </p>

                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${roleMeta.bg} ${roleMeta.text}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">{roleMeta.icon}</span>
                    <span>{roleMeta.label}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Account Details from Backend Model */}
            <div className="py-2.5 space-y-1.5 text-xs border-b border-outline-variant/20">
              {user.title && (
                <div className="flex items-center justify-between text-secondary">
                  <span>Official Title:</span>
                  <span className="font-medium text-on-surface truncate ml-2">{user.title}</span>
                </div>
              )}

              {user.department && (
                <div className="flex items-center justify-between text-secondary">
                  <span>Department:</span>
                  <span className="font-medium text-on-surface truncate ml-2">{user.department}</span>
                </div>
              )}

              {user.unit && (
                <div className="flex items-center justify-between text-secondary">
                  <span>Assigned Unit:</span>
                  <span className="font-medium text-on-surface truncate ml-2">{user.unit}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-secondary">
                <span>Account ID:</span>
                <span className="font-mono text-[11px] text-secondary truncate ml-2">{user.id}</span>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="pt-2.5 space-y-1">
              <Link
                to={dashboardRoute}
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">dashboard</span>
                <span>My Operational Workspace</span>
              </Link>

              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">home</span>
                <span>Back to Home</span>
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full px-3 py-2 mt-1 rounded-lg text-xs font-semibold text-error hover:bg-error/10 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Sign Out of PotholeFix</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
