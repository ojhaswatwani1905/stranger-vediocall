import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Mail, User, Calendar, AlertTriangle,
  ArrowRight, Key, X, UserPlus, LogIn, Sparkles
} from 'lucide-react';
import { useAuth, HARDCODED_ACCOUNTS } from '../../context/AuthContext';

export const AuthModal = ({ isOpen, onClose, initialTab = 'signin', onSuccess }) => {
  const { loginWithCredentials, registerUser, authError, setAuthError, validateAge } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab); // 'signin' | 'signup'

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('alex@betadrix.com');
  const [signInPassword, setSignInPassword] = useState('password123');

  // Sign Up state
  const [signUpData, setSignUpData] = useState({
    name: 'Taylor Swift',
    email: 'taylor@example.com',
    password: 'password123',
    dob: '2000-06-15',
    gender: 'female',
    country: 'United States',
    acceptedGuidelines: true
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  // Handle Quick Demo Preset Sign-In
  const handleQuickFill = (account) => {
    setSignInEmail(account.email);
    setSignInPassword(account.password);
    const result = loginWithCredentials(account.email, account.password);
    if (result.success) {
      if (onSuccess) onSuccess(result.user);
      onClose();
    }
  };

  // Sign In Submit
  const handleSignInSubmit = (e) => {
    e.preventDefault();
    const result = loginWithCredentials(signInEmail, signInPassword);
    if (result.success) {
      if (onSuccess) onSuccess(result.user);
      onClose();
    }
  };

  // Sign Up Submit
  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    const result = registerUser(signUpData);
    if (result.success) {
      if (onSuccess) onSuccess(result.user);
      onClose();
    }
  };

  const isAdult = signUpData.dob ? validateAge(signUpData.dob, 18) : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      
      <div className="relative w-full max-w-lg glass-glow-card rounded-3xl p-5 sm:p-7 border border-violet-500/40 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar animate-modal-scale">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/60 transition-all z-20"
          title="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Logo */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-violet-500/30 mb-2.5">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">BETADRIX Account</h2>
          <p className="text-xs text-slate-400 mt-0.5">Strict 18+ Identity Verification & Matchmaking</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 mb-5">
          <button
            onClick={() => { setActiveTab('signin'); setAuthError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'signin'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => { setActiveTab('signup'); setAuthError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'signup'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Authentication Alert</span>
              {authError}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* SIGN IN VIEW                                  */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === 'signin' && (
          <div className="space-y-5">
            
            {/* Quick Demo Preset Auto-Fill Bar */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                ⚡ 1-Click Demo Sign-In Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {HARDCODED_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickFill(acc)}
                    className={`px-2 py-2 rounded-xl text-[11px] font-semibold border transition-all flex flex-col items-center justify-center text-center group ${
                      acc.isAdmin
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-violet-500/50 hover:text-white'
                    }`}
                    title={`Login as ${acc.name} (${acc.role})`}
                  >
                    <span className="truncate w-full font-bold">{acc.name.split(' ')[0]}</span>
                    <span className="text-[9px] opacity-75 font-normal">{acc.isAdmin ? '🛡️ Admin' : '👤 User'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Sign In Form */}
            <form onSubmit={handleSignInSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="alex@betadrix.com"
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl btn-glow-purple text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <span>Sign In to BETADRIX</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Hardcoded Credentials Reference */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1.5">
              <span className="font-semibold text-amber-400 block flex items-center gap-1">
                <Key className="w-3.5 h-3.5" /> Demo Credentials Reference:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-400 font-mono text-[10px]">
                <div>• User: <span className="text-slate-200">alex@betadrix.com</span> / <span className="text-slate-200">password123</span></div>
                <div>• Female: <span className="text-slate-200">elena@betadrix.com</span> / <span className="text-slate-200">password123</span></div>
                <div>• Male: <span className="text-slate-200">jordan@betadrix.com</span> / <span className="text-slate-200">password123</span></div>
                <div>• Admin: <span className="text-slate-200">admin@betadrix.com</span> / <span className="text-rose-300">admin123</span></div>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* SIGN UP VIEW                                  */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
            
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={signUpData.name}
                  onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                  placeholder="Alex Vance"
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block flex items-center justify-between">
                  <span>Date of Birth</span>
                  <span className={`text-[10px] ${isAdult ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isAdult ? '✓ 18+' : '⚠️ Under 18'}
                  </span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="date"
                    required
                    value={signUpData.dob}
                    onChange={(e) => setSignUpData({ ...signUpData, dob: e.target.value })}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Gender Identity</label>
                <select
                  value={signUpData.gender}
                  onChange={(e) => setSignUpData({ ...signUpData, gender: e.target.value })}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="female">♀️ Female</option>
                  <option value="male">♂️ Male</option>
                  <option value="non-binary">⚧ Non-Binary</option>
                  <option value="prefer-not">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Country</label>
                <select
                  value={signUpData.country}
                  onChange={(e) => setSignUpData({ ...signUpData, country: e.target.value })}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="United States">🇺🇸 United States</option>
                  <option value="United Kingdom">🇬🇧 United Kingdom</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="Australia">🇦🇺 Australia</option>
                  <option value="Germany">🇩🇪 Germany</option>
                  <option value="Spain">🇪🇸 Spain</option>
                  <option value="Japan">🇯🇵 Japan</option>
                  <option value="India">🇮🇳 India</option>
                </select>
              </div>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={signUpData.acceptedGuidelines}
                onChange={(e) => setSignUpData({ ...signUpData, acceptedGuidelines: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded text-violet-600 border-slate-700 bg-slate-950"
              />
              <span className="text-[11px] text-slate-300 leading-normal">
                I confirm I am at least 18 years of age and agree to the <span className="text-violet-400 font-semibold">Community Safety Terms</span>.
              </span>
            </label>

            <button
              type="submit"
              className="w-full py-3 rounded-xl btn-glow-purple text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <span>Create 18+ Verified Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
