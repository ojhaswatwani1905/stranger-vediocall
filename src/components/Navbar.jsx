import React, { useState, useEffect } from 'react';
import { Video, ShieldCheck, Coins, LogOut, Home, Zap, Crown, Menu, X } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

export const Navbar = ({ currentMode, setCurrentMode, onOpenWallet, onOpenAuth }) => {
  const { balance } = useWallet();
  const { user, logout } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Theme preview state (persistent in localStorage)
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('theme_preview_mode') || 'off';
  });

  const isPinkTheme = themeMode === 'pink';

  useEffect(() => {
    if (isPinkTheme) {
      document.documentElement.setAttribute('data-theme', 'pink');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme_preview_mode', themeMode);
  }, [isPinkTheme, themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'pink' ? 'off' : 'pink'));
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 px-2 sm:px-4 py-2 sm:py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        
        {/* Brand Logo & Name */}
        <div 
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer shrink-0" 
          onClick={() => {
            if (!user) setCurrentMode('landing');
            else if (user.role === 'admin' || user.isAdmin) setCurrentMode('admin');
            else setCurrentMode('user');
          }}
        >
          {!imgError ? (
            <img 
              src={logoImg} 
              alt="BETADRIX Logo" 
              onError={() => setImgError(true)}
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl object-cover ring-2 ring-violet-500/40 shadow-lg shadow-violet-500/25 transition-transform hover:scale-105"
            />
          ) : (
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-violet-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                BETADRIX
              </span>
              <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-semibold tracking-wide uppercase rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 hidden xs:inline-block">
                1:1 Video
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden lg:block">Random Stranger Matchmaking Platform</p>
          </div>
        </div>

        {/* Center Desktop Navigation Bar Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800/90 shadow-inner">
          <button
            onClick={() => {
              if (currentMode !== 'landing') setCurrentMode('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            <Home className="w-3.5 h-3.5 text-violet-400" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              if (currentMode !== 'landing') setCurrentMode('landing');
              setTimeout(() => {
                const el = document.getElementById('features');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Features</span>
          </button>

          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 transition-all shadow-sm group"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Subscriptions</span>
            <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-amber-400 text-slate-950">
              VIP
            </span>
          </button>

          <button
            onClick={() => {
              if (currentMode !== 'landing') setCurrentMode('landing');
              setTimeout(() => {
                const el = document.getElementById('safety');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safety</span>
          </button>

        </nav>

        {/* Right Section: Coins & User Actions (Fully Mobile Responsive) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Coin Balance Pill */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 text-amber-400 text-[11px] sm:text-xs font-semibold shadow-sm transition-all group shrink-0"
            title="Coins Wallet"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>{balance} <span className="hidden xs:inline">Coins</span></span>
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[9px] font-bold">
              +
            </span>
          </button>

          {/* User Profile / Auth Action Buttons (Sign In & Sign Up - Never Cut Off on Phone) */}
          {user ? (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-full border border-slate-800 text-[11px] sm:text-xs">
                <img src={user.avatar} alt="User" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover ring-1 ring-violet-500/50" />
                <span className="font-medium text-slate-200 hidden sm:inline">{user.name.split(' ')[0]}</span>
              </div>

              <button
                onClick={() => { logout(); setCurrentMode('landing'); }}
                className="p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onOpenAuth ? onOpenAuth('signin') : setCurrentMode('signin')}
                className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth ? onOpenAuth('signup') : setCurrentMode('signup')}
                className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-[11px] sm:text-xs font-semibold transition-all shadow-sm shadow-violet-600/30 whitespace-nowrap shrink-0"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Desktop Theme Toggle Switch */}
          <button
            onClick={toggleTheme}
            type="button"
            className={`hidden sm:inline-flex relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none shadow-sm ml-0.5 ${
              isPinkTheme ? 'bg-[#FF0F6D] shadow-rose-600/50' : 'bg-slate-700/90 shadow-slate-950/60'
            }`}
            role="switch"
            aria-checked={isPinkTheme}
            title={isPinkTheme ? 'Switch Theme OFF' : 'Switch Theme ON'}
          >
            <span className="sr-only">Toggle Theme Preview</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                isPinkTheme ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-all shrink-0 ml-0.5"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5 text-violet-400" />}
          </button>

        </div>

      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 pt-3 pb-4 border-t border-slate-800/90 space-y-2 bg-slate-950/95 backdrop-blur-xl rounded-2xl p-3 border border-slate-800 shadow-2xl animate-fade-in">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (currentMode !== 'landing') setCurrentMode('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-900 border border-slate-800/40 transition-all"
          >
            <Home className="w-4 h-4 text-violet-400" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (currentMode !== 'landing') setCurrentMode('landing');
              setTimeout(() => {
                const el = document.getElementById('features');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-900 border border-slate-800/40 transition-all"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Features</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenWallet();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Subscriptions (VIP)</span>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-amber-400 text-slate-950">
              VIP
            </span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (currentMode !== 'landing') setCurrentMode('landing');
              setTimeout(() => {
                const el = document.getElementById('safety');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-900 border border-slate-800/40 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Safety & Moderation</span>
          </button>


          {/* Theme Mode switch inside mobile drawer */}
          <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between px-2">
            <span className="text-xs text-slate-400 font-medium">Pink Theme Switch</span>
            <button
              onClick={toggleTheme}
              type="button"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none shadow-sm ${
                isPinkTheme ? 'bg-[#FF0F6D] shadow-rose-600/50' : 'bg-slate-700/90 shadow-slate-950/60'
              }`}
              role="switch"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out ${
                  isPinkTheme ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>
      )}
    </header>
  );
};
