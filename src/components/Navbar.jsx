import React, { useState } from 'react';
import { Video, ShieldCheck, Coins, UserCheck, ShieldAlert, Sparkles, LogOut } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

export const Navbar = ({ currentMode, setCurrentMode, onOpenWallet, onOpenAuth }) => {
  const { balance } = useWallet();
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentMode && setCurrentMode('user')}>
          {!imgError ? (
            <img 
              src={logoImg} 
              alt="BETADRIX Logo" 
              onError={() => setImgError(true)}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-violet-500/40 shadow-lg shadow-violet-500/25 transition-transform hover:scale-105"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-violet-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Video className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                BETADRIX
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                1:1 Video
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Random Stranger Matchmaking & Safety Platform</p>
          </div>
        </div>

        {/* Center Mode Switcher - Only shown to admins */}
        {(user?.role === 'admin' || user?.isAdmin) && (
          <div className="flex items-center bg-slate-900/90 p-1 rounded-full border border-slate-800 shadow-inner">
            <button
              onClick={() => setCurrentMode('user')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentMode === 'user'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video Chat</span>
            </button>

            <button
              onClick={() => setCurrentMode('admin')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentMode === 'admin'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          </div>
        )}

        {/* Right Section: Coin Ledger & User Profile */}
        <div className="flex items-center gap-3">
          
          {/* Coin Balance Pill */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-sm transition-all group"
          >
            <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>{balance} Coins</span>
            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">
              +
            </span>
          </button>

          {/* User Profile Badge */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 text-xs">
              <img src={user.avatar} alt="User" className="w-5 h-5 rounded-full object-cover ring-1 ring-violet-500/50" />
              <span className="font-medium text-slate-200 hidden md:inline">{user.name.split(' ')[0]}</span>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                <ShieldCheck className="w-3 h-3" />
                18+
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Verify & Sign In</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
