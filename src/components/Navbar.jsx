import React, { useState, useEffect } from 'react';
import { Video, ShieldCheck, Coins, LogOut, Home, Zap, Crown, ShieldAlert } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

export const Navbar = ({ currentMode, setCurrentMode, onOpenWallet, onOpenAuth }) => {
  const { balance } = useWallet();
  const { user, logout } = useAuth();
  const [imgError, setImgError] = useState(false);

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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-2.5 sm:px-4 py-2.5 sm:py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" 
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
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover ring-2 ring-violet-500/40 shadow-lg shadow-violet-500/25 transition-transform hover:scale-105"
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-violet-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                BETADRIX
              </span>
              <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold tracking-wide uppercase rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                1:1 Video
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block">Random Stranger Matchmaking Platform</p>
          </div>
        </div>

        {/* Center Middle Section: Navigation Bar Links */}
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

          <button
            onClick={() => setCurrentMode('admin')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              currentMode === 'admin'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                : 'text-slate-300 hover:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Admin</span>
          </button>
        </nav>

        {/* Right Section: Coin Ledger & User Profile & Inline Theme Toggle Switch */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Coin Balance Pill */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-sm transition-all group"
            title="Coins Wallet"
          >
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>{balance} <span className="hidden xs:inline sm:inline">Coins</span></span>
            <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">
              +
            </span>
          </button>

          {/* User Profile Badge & Auth Actions */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/80 px-2 sm:px-3 py-1.5 rounded-full border border-slate-800 text-xs">
                <img src={user.avatar} alt="User" className="w-5 h-5 rounded-full object-cover ring-1 ring-violet-500/50" />
                <span className="font-medium text-slate-200 hidden md:inline">{user.name.split(' ')[0]}</span>
                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="hidden xs:inline">18+</span>
                </span>
              </div>

              <button
                onClick={() => { logout(); setCurrentMode('landing'); }}
                className="p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth ? onOpenAuth('signin') : setCurrentMode('signin')}
                className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth ? onOpenAuth('signup') : setCurrentMode('signup')}
                className="px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-sm"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Perfectly Aligned Inline iOS Style Toggle Switch Button */}
          <button
            onClick={toggleTheme}
            type="button"
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none shadow-sm ml-1 ${
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

        </div>

      </div>
    </header>
  );
};
