import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Sparkles,
  Compass,
  PlusCircle,
  Layers,
  SlidersHorizontal,
  User,
  RotateCcw,
  Menu,
  X,
  Lightbulb,
  LayoutDashboard,
} from 'lucide-react';
import { A, navigate } from '../hooks/useNav.jsx';
import { useCurrentUser } from '../hooks/useCurrentUser.jsx';
import { useSpark } from '../hooks/SparkContext.jsx';
import { resetDemoData } from '../api/ideaApi.js';

export default function Header({ path }) {
  const user = useCurrentUser();
  const { bump, toast } = useSpark();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on path change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  const isWelcomePage = path === '/';
  const isAdminWorkspace = path.startsWith('/admin') || path === '/dashboard' || path === '/review';

  // Creative Employee Nav items with modern icons
  const employeeNav = [
    { to: '/employee', label: 'Home', icon: Compass },
    { to: '/employee/ideas', label: 'Explore ideas', icon: Sparkles },
    { to: '/employee/submit', label: 'Submit an idea', icon: PlusCircle },
    { to: '/employee/my-ideas', label: 'My ideas', icon: Layers },
  ];

  // Creative Leadership Nav items
  const adminNav = [
    { to: '/admin', label: 'Leadership Home', icon: Compass },
    { to: '/admin/ideas', label: 'Explore & Review', icon: Sparkles },
    { to: '/admin/manage', label: 'Manage pipeline', icon: SlidersHorizontal },
  ];

  const navItems = isAdminWorkspace ? adminNav : employeeNav;

  // Strict route matching so visiting /employee/ideas ONLY highlights Explore ideas, NOT Home!
  const isCurrent = (to) => {
    if (to === '/employee') return path === '/employee';
    if (to === '/admin') return path === '/admin';
    if (to === '/') return path === '/';
    return path === to || path.startsWith(to + '/');
  };

  const roleLabel = isAdminWorkspace
    ? 'Leadership • Office of the CIO'
    : 'Associate • Data Engineering';

  const userName = isAdminWorkspace ? 'Meera K.' : (user?.name || 'Priya N.');
  const userEmail = isAdminWorkspace ? 'meera.k@example.com' : (user?.email || 'priya.n@example.com');

  return (
    <header className="sticky top-2.5 sm:top-3 z-40 w-full px-3 sm:px-5 lg:px-6 max-w-[1380px] mx-auto pointer-events-auto transition-all">
      {/* FLOATING CAPSULE CONTAINER — EXECUTIVE & PROMINENT */}
      <div className="bg-white/94 dark:bg-[#1C153B]/94 backdrop-blur-xl border border-purple-200/90 dark:border-purple-800/70 rounded-full px-5 sm:px-7 md:px-8 py-2.5 sm:py-3 shadow-[0_10px_35px_rgba(107,47,168,0.09)] flex items-center justify-between gap-4 sm:gap-6 transition-all duration-200 min-h-[66px] sm:min-h-[70px]">
        
        {/* LEFT SECTION: Prominently Sized Official GWC DATA.AI SVG Logo */}
        <div className="flex items-center gap-3.5 shrink-0">
          <A
            to={isWelcomePage ? '/' : (isAdminWorkspace ? '/admin' : '/employee')}
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-90 py-0.5"
            aria-label="GWC DATA.AI Home"
          >
            <img
              src="/assets/gwc_logo.svg"
              alt="GWC DATA.AI"
              className="h-9 sm:h-10 md:h-10.5 lg:h-11 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </A>
        </div>

        {/* CENTER SECTION: CREATIVE & ATTRACTIVE CAPSULE DOCK — SIZED UP (Desktop) */}
        {!isWelcomePage && (
          <nav
            className="hidden md:flex items-center gap-2 p-1.5 bg-[#F5F0FD]/90 dark:bg-[#251D4A]/80 rounded-full border border-purple-200/70 dark:border-purple-800/50 shadow-inner-2xs"
            aria-label="Main navigation"
          >
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = isCurrent(to);
              return (
                <A
                  key={to}
                  to={to}
                  className={`group relative flex items-center gap-2.5 px-4.5 lg:px-5 py-2 lg:py-2.5 rounded-full text-[13.5px] lg:text-[14px] font-semibold tracking-wide transition-all duration-200 ${
                    active
                      ? 'sp-nav-pill-active bg-gradient-to-r from-[#6B2FA8] to-[#8B5CF6] text-white shadow-md shadow-purple-500/30 ring-1 ring-purple-400/50'
                      : 'text-[#1E1B4B] hover:text-[#6B2FA8] hover:bg-white/95 dark:text-purple-200 dark:hover:bg-purple-900/60'
                  }`}
                  style={active ? { color: '#ffffff' } : { color: '#1E1B4B' }}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon
                    size={16}
                    className={`transition-transform duration-200 shrink-0 ${
                      active
                        ? 'text-white'
                        : 'text-[#6B2FA8] dark:text-purple-300 group-hover:scale-110'
                    }`}
                    style={active ? { color: '#ffffff' } : { color: '#6B2FA8' }}
                  />
                  <span
                    className={`transition-colors ${active ? 'text-white font-bold' : 'text-[#1E1B4B] dark:text-purple-100 font-semibold'}`}
                    style={active ? { color: '#ffffff' } : { color: '#1E1B4B' }}
                  >
                    {label}
                  </span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 shadow-xs" />
                  )}
                </A>
              );
            })}
          </nav>
        )}

        {/* RIGHT SECTION: USER PROFILE CAPSULE TRIGGER — SIZED UP (No Search Bar) */}
        <div className="flex items-center gap-3.5 shrink-0">
          {!isWelcomePage ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#F5F0FD]/90 hover:bg-white dark:bg-[#251D4A]/80 dark:hover:bg-[#2A2053] border border-purple-200/70 dark:border-purple-800/50 shadow-inner-2xs hover:shadow-xs transition-all duration-200 cursor-pointer group"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                {/* Name & Designation */}
                <div className="flex flex-col text-left">
                  <span className="text-[13px] sm:text-[13.5px] font-bold text-[#1E1B4B] dark:text-[#FAF7FF] leading-tight group-hover:text-[#6B2FA8] dark:group-hover:text-purple-300 transition-colors">
                    {userName}
                  </span>
                  <span className="text-[10.5px] sm:text-[11px] font-medium text-[#6B2FA8] dark:text-purple-300 leading-tight mt-0.5">
                    {isAdminWorkspace ? 'Office of the CIO' : 'Data Engineering'}
                  </span>
                </div>

                {/* Subtle Divider */}
                <div className="w-px h-5 bg-purple-200/80 dark:bg-purple-800/60 shrink-0" />

                {/* Chevron */}
                <ChevronDown
                  size={14}
                  className={`text-[#6B2FA8]/70 group-hover:text-[#6B2FA8] dark:text-purple-300 transition-transform duration-200 shrink-0 ${
                    profileOpen ? 'rotate-180 text-[#6B2FA8]' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2.5 w-64 bg-white dark:bg-[#1E1740] rounded-2xl shadow-xl border border-[#E2D9F3] dark:border-purple-900/60 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-purple-100/70 dark:border-purple-900/40">
                    <p className="text-xs font-bold text-[#1E1B4B] dark:text-purple-100 truncate">{userName}</p>
                    <p className="text-[11px] text-[#64748B] dark:text-[#A9A1C9] truncate mt-0.5">{userEmail}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-[#6B2FA8] bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-100 dark:border-purple-800/40">
                      {roleLabel}
                    </span>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    {/* Direct 1-click workspace switcher */}
                    {isAdminWorkspace ? (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/employee');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#6B2FA8] hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-xl transition text-left cursor-pointer"
                      >
                        <Compass size={14} />
                        <span>Switch to Employee View</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition text-left cursor-pointer"
                      >
                        <LayoutDashboard size={14} />
                        <span>Switch to Admin / CIO View</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-xl transition text-left cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      <span>Workspace portal</span>
                    </button>

                    {isAdminWorkspace ? (
                      <A
                        to="/admin/manage"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#334155] dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-xl transition"
                        onClick={() => setProfileOpen(false)}
                      >
                        <SlidersHorizontal size={14} /> Pipeline manager
                      </A>
                    ) : (
                      <>
                        <A
                          to="/employee/my-ideas"
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#334155] dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-xl transition"
                          onClick={() => setProfileOpen(false)}
                        >
                          <User size={14} /> My submitted ideas
                        </A>
                        <A
                          to="/employee/submit"
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#334155] dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-xl transition"
                          onClick={() => setProfileOpen(false)}
                        >
                          <Sparkles size={14} /> Submit new idea
                        </A>
                      </>
                    )}

                    {/* Reset demo data */}
                    <div className="pt-1 mt-1 border-t border-purple-100 dark:border-purple-900/40">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          resetDemoData();
                          bump();
                          toast('Demo data reset to clean initial state.');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 rounded-xl transition text-left cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        <span>Reset demo data</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/employee')}
                className="text-xs font-semibold text-[#6B2FA8] hover:text-[#4E03B9] px-3 py-1.5 rounded-full hover:bg-purple-50 transition cursor-pointer"
              >
                Employee
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition cursor-pointer"
              >
                Leadership
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          {!isWelcomePage && (
            <button
              type="button"
              className="md:hidden p-1.5 text-[#475569] hover:text-[#1E1B4B] rounded-full hover:bg-purple-50 transition cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu (Capsule Style) */}
      {!isWelcomePage && mobileMenuOpen && (
        <div className="md:hidden mt-2 rounded-3xl border border-[#E4DCF5] bg-white/95 dark:bg-[#1C153B]/95 backdrop-blur-xl px-4 py-3 space-y-1 shadow-xl animate-in slide-in-from-top-1 duration-150">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = isCurrent(to);
            return (
              <A
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-[13px] font-semibold ${
                  active
                    ? 'sp-nav-pill-active bg-gradient-to-r from-[#6B2FA8] to-[#8B5CF6] text-white'
                    : 'text-[#1E1B4B] hover:text-[#6B2FA8] hover:bg-purple-50 dark:text-purple-200'
                }`}
                style={active ? { color: '#ffffff' } : { color: '#1E1B4B' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon
                  size={15}
                  className={active ? 'text-white' : 'text-[#6B2FA8]'}
                  style={active ? { color: '#ffffff' } : { color: '#6B2FA8' }}
                />
                <span style={active ? { color: '#ffffff' } : { color: '#1E1B4B' }}>{label}</span>
              </A>
            );
          })}
        </div>
      )}
    </header>
  );
}
