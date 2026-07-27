import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  Video, MessageSquare, ShieldCheck, ShieldAlert, Sparkles, Coins,
  Globe, Users, Radio, ArrowRight, Lock, CheckCircle2, Star, Zap,
  Play, Volume2, Clock, Eye, AlertTriangle, ChevronRight, Heart, User
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export const LandingPage = ({ onLaunchApp, onOpenWallet, onOpenAuth, onOpenAdmin }) => {
  const { coinPacks, filterPrices, FILTER_PRICES } = useWallet();
  const matchCost = (filterPrices && filterPrices.match) || (FILTER_PRICES && FILTER_PRICES.match) || 80;
  const [demoMode, setDemoMode] = useState('video');
  const [demoGender, setDemoGender] = useState('any');
  const [demoRegion, setDemoRegion] = useState('Worldwide');
  const [simulatedMatch, setSimulatedMatch] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Photo avatars for live stream preview switcher
  const strangerPhotos = [
    { name: 'Sophia M.', age: 22, country: 'United States', flag: '🇺🇸', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80' },
    { name: 'Marcus Chen', age: 25, country: 'Singapore', flag: '🇸🇬', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80' },
    { name: 'Elena Rostova', age: 23, country: 'Spain', flag: '🇪🇸', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80' },
    { name: 'Chloe Laurent', age: 21, country: 'France', flag: '🇫🇷', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80' }
  ];

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const currentPhotoStranger = strangerPhotos[activePhotoIdx];

  // Run interactive demo simulation
  const handleSimulateDemo = () => {
    setIsSimulating(true);
    setSimulatedMatch(null);
    setTimeout(() => {
      const match = strangerPhotos[Math.floor(Math.random() * strangerPhotos.length)];
      setSimulatedMatch(match);
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 selection:bg-purple-500 selection:text-white overflow-x-hidden">
      
      {/* ═══════════════════════════════════════════════ */}
      {/* 1. HERO SECTION                                */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 max-w-7xl mx-auto">
        
        {/* Background Radiant Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/20 via-purple-500/15 to-cyan-400/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column: Headline & Action CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Pill Badge & Live Active User Photo Stack */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-violet-500/30 text-xs font-semibold text-violet-300 shadow-lg shadow-violet-500/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>#1 Moderated 1:1 Stranger Matchmaking Platform</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>

              {/* Photo Stack Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                <div className="flex -space-x-2 overflow-hidden">
                  {strangerPhotos.map((s, i) => (
                    <img
                      key={i}
                      className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-950 object-cover"
                      src={s.avatar}
                      alt={s.name}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  12.8k Online
                </span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-[1.15]">
              Connect Instantly with Strangers <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">Worldwide</span>
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Experience crystal-clear 1:1 video calls & real-time text chat with people in over 180 countries. Strictly 18+ age gated with AI moderation for safe connections.
            </p>

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => onLaunchApp && onLaunchApp('video')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl btn-glow-purple text-white text-base font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
              >
                <Video className="w-5 h-5" />
                <span>Start Video Match</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  {matchCost} Coins
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => onLaunchApp && onLaunchApp('text')}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Try Text Only Chat</span>
              </button>
            </div>

            {/* Safety Guarantee Pills */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>18+ Age Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Encrypted Signaling</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>AI Moderated</span>
              </div>
            </div>

          </div>

          {/* Right Column: Animated Live Preview Frame with Interactive Photo Switcher */}
          <div className="lg:col-span-5 relative flex justify-center animate-float">
            
            <div className="relative w-full max-w-sm sm:max-w-md aspect-[3/4] glass-glow-card rounded-3xl p-3 border-2 border-violet-500/40 shadow-2xl overflow-hidden group">
              
              {/* Top Floating Badge inside preview */}
              <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
                <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-violet-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-300">● Live Match Preview</span>
                </div>
                <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-[10px] text-amber-300 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>01:45 (2m max)</span>
                </div>
              </div>

              {/* Stranger Simulated Video Stream */}
              <div className="w-full h-full rounded-2xl overflow-hidden relative bg-gradient-to-b from-slate-900 via-purple-950/50 to-slate-950 flex flex-col items-center justify-between p-6 text-center">
                
                <div />

                {/* Avatar with pulse ring */}
                <div className="relative mb-2">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-violet-500 via-purple-500 to-cyan-400 shadow-2xl shadow-violet-500/40 animate-pulse">
                    <img
                      src={currentPhotoStranger.avatar}
                      alt={currentPhotoStranger.name}
                      className="w-full h-full rounded-full object-cover ring-4 ring-slate-950 transition-all duration-500"
                    />
                  </div>
                  <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[10px] text-white font-bold">
                    ✓
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-0.5 flex items-center justify-center gap-1.5">
                    <span>{currentPhotoStranger.name}</span>
                    <span>{currentPhotoStranger.flag}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">{currentPhotoStranger.country} • {currentPhotoStranger.age} yrs</p>

                  {/* Audio visualizer */}
                  <div className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800">
                    <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[10px] text-violet-300 font-medium mr-1">Stranger Speaking</span>
                    <span className="w-1 bg-violet-500 rounded-full animate-wave-bar" style={{ animationDelay: '0.1s' }} />
                    <span className="w-1 bg-cyan-400 rounded-full animate-wave-bar" style={{ animationDelay: '0.3s' }} />
                    <span className="w-1 bg-purple-500 rounded-full animate-wave-bar" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1 bg-emerald-400 rounded-full animate-wave-bar" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>

                {/* Photo Switcher Avatars Row inside preview */}
                <div className="flex items-center justify-center gap-2 pt-2 z-10">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Next Stranger:</span>
                  {strangerPhotos.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`w-7 h-7 rounded-full overflow-hidden transition-transform ${
                        activePhotoIdx === idx ? 'ring-2 ring-violet-400 scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                      title={s.name}
                    >
                      <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Small Self-View Floating Box inside frame */}
                <div className="absolute bottom-4 right-4 w-24 h-20 rounded-xl bg-slate-900 border-2 border-cyan-400/60 overflow-hidden shadow-xl flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80"
                    alt="You"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 text-[8px] font-bold text-white bg-black/60 px-1 rounded">You</span>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 2. STATS COUNTER BAR                           */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="border-y border-slate-800/80 bg-slate-950/60 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          
          <div>
            <div className="flex items-center justify-center gap-1 text-2xl sm:text-3xl font-extrabold text-white">
              <span>12,800</span>
              <span className="text-violet-400">+</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Daily Active Users</p>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-2xl sm:text-3xl font-extrabold text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
              <span>1,430</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Live 1:1 Calls Now</p>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-2xl sm:text-3xl font-extrabold text-cyan-400">
              <span>180</span>
              <span className="text-cyan-400">+</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Countries Supported</p>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-2xl sm:text-3xl font-extrabold text-amber-400">
              <span>99.4%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Safety & Moderation Score</p>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 3. CORE FEATURES & MODES SHOWCASE              */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="features" className="py-20 px-4 max-w-7xl mx-auto">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Designed for Instant, High-Quality Matchmaking
          </h2>
          <p className="text-sm text-slate-400">
            Everything you need for safe, fun, and effortless random stranger connections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="glass-glow-card rounded-3xl p-6 border border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-5">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1:1 Stranger Video Calls</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Crystal-clear WebRTC video streaming with low-latency signaling. Switch layouts between Picture-in-Picture and Split Blocks.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-glow-card rounded-3xl p-6 border border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Anonymous Text Messenger</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Prefer text? Launch dedicated text messenger rooms with quick emoji reaction bars and automated toxic content filters.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-glow-card rounded-3xl p-6 border border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Region & Gender Match Filters</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Filter strangers by specific countries (USA, UK, Asia, Europe) or gender preferences using your server-authoritative Coin Wallet.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-glow-card rounded-3xl p-6 border border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI + Human Safety Moderation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant 1-click Report & Block controls with real-time text keyword suppression and live admin moderation queue oversight.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass-glow-card rounded-3xl p-6 border border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Coin Wallet System</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fair, server-authoritative balance ledger. Each match costs 80 coins and unlocks special match options.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass-glow-card rounded-3xl p-6 border border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2-Minute Session Timer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every match session has a 2-minute max timer, keeping matches exciting, spontaneous, and encouraging quick skips.
            </p>
          </div>

        </div>

      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 4. INTERACTIVE MATCHMAKER DEMO SIMULATOR        */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-slate-950/80 border-y border-slate-800/60">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-10">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold uppercase tracking-wider">
              Interactive Demo
            </span>
            <h2 className="text-3xl font-bold text-white mt-3 mb-2">Test Matchmaker Filters</h2>
            <p className="text-xs text-slate-400">Simulate how BETADRIX finds matches based on your preferences</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-2xl">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Mode</label>
                <select
                  value={demoMode}
                  onChange={(e) => setDemoMode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="video">Video Chat Mode</option>
                  <option value="text">Text Only Mode</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Gender Preference</label>
                <select
                  value={demoGender}
                  onChange={(e) => setDemoGender(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="any">Anyone</option>
                  <option value="female">Female Only</option>
                  <option value="male">Male Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Preferred Region</label>
                <select
                  value={demoRegion}
                  onChange={(e) => setDemoRegion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="Worldwide">Worldwide</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Singapore">Singapore</option>
                </select>
              </div>

            </div>

            <button
              onClick={handleSimulateDemo}
              disabled={isSimulating}
              className="w-full py-3.5 rounded-xl btn-glow-purple text-white text-xs font-bold flex items-center justify-center gap-2"
            >
              {isSimulating ? (
                <>
                  <Radio className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Scanning Stranger Queue…</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Simulate Random Match</span>
                </>
              )}
            </button>

            {/* Simulation Result Card */}
            {simulatedMatch && (
              <div className="mt-6 p-4 rounded-2xl bg-slate-900/90 border border-violet-500/30 flex items-center gap-4 animate-fadeIn">
                <img src={simulatedMatch.avatar} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-violet-500/50" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{simulatedMatch.name}</span>
                    <span className="text-xs text-slate-400">{simulatedMatch.country} • {simulatedMatch.age} yrs</span>
                  </div>
                  <p className="text-xs text-violet-300 italic mt-0.5">"{simulatedMatch.greeting}"</p>
                </div>
                <button
                  onClick={() => onLaunchApp && onLaunchApp(demoMode)}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shrink-0"
                >
                  Start Real Call →
                </button>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 5. TRUST & SAFETY HIGHLIGHT                    */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="safety" className="py-20 px-4 max-w-7xl mx-auto">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-rose-500/20 relative overflow-hidden">
          
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4" />
                Strict Trust & Safety Standards
              </div>

              <h2 className="text-3xl font-bold text-white">Your Safety is Our Top Priority</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                BETADRIX maintains a zero-tolerance policy against inappropriate content, CSAM, hate speech, and underage users. All accounts require strict 18+ identity verification.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  'Strict 18+ Age & Identity Verification Gating',
                  'Instant 1-Click Report & Block User Controls',
                  'Automated AI Keyword Suppression & Profanity Filter',
                  '24/7 Human Moderation Audit Queue Oversight'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-xs p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white">18+ Verified Only</h4>
                <p className="text-xs text-slate-400">
                  Unverified users cannot initiate video calls. Enjoy a safe, mature stranger matchmaking environment.
                </p>
                <button
                  onClick={onOpenAuth}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
                >
                  Verify Your Account
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 6. COIN PACKAGES & PRICING SHOWCASE            */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="pricing" className="py-16 px-4 max-w-7xl mx-auto">
        
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
            <Coins className="w-4 h-4" />
            Coin Wallet Packages
          </div>
          <h2 className="text-3xl font-bold text-white">Simple, Transparent Pricing</h2>
          <p className="text-xs text-slate-400 mt-1">Get coins to start 1:1 stranger matches and unlock region/gender filters</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {(coinPacks || []).filter((p) => p.active).map((pack) => (
            <div
              key={pack.id}
              className={`glass-panel rounded-3xl p-6 border flex flex-col justify-between transition-all hover:-translate-y-1 relative ${
                pack.badge || pack.popular ? 'border-amber-500/40 shadow-xl shadow-amber-500/10' : 'border-slate-800'
              }`}
            >
              {pack.badge && (
                <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-extrabold uppercase shadow-md">
                  {pack.badge}
                </span>
              )}

              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-1">{pack.name || pack.label}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-white">{pack.amount.toLocaleString()}</span>
                  <span className="text-xs font-bold text-amber-400">Coins</span>
                </div>
                <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 mb-4">
                  ~{Math.floor(pack.amount / 80)} Stranger Video Matches
                </p>
              </div>

              <div>
                <div className="text-xl font-bold text-white mb-3">${pack.price}</div>
                <button
                  onClick={onOpenWallet}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  Buy Package
                </button>
              </div>
            </div>
          ))}

        </div>

      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* 7. FOOTER                                      */}
      {/* ═══════════════════════════════════════════════ */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Logo" className="w-8 h-8 rounded-xl object-cover" />
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block">BETADRIX</span>
              <span className="text-[10px] text-slate-400">Random Stranger Matchmaking & Safety Platform</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#safety" className="hover:text-white transition-colors">Safety Standard</a>
            <a href="#pricing" className="hover:text-white transition-colors">Coin Wallet</a>
            <button onClick={() => onLaunchApp && onLaunchApp('video')} className="hover:text-violet-400 transition-colors">Video Chat App</button>
            <button onClick={onOpenAdmin} className="hover:text-rose-400 transition-colors">Admin Panel</button>
          </div>

          <div className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} BETADRIX Platform. Enforcing strict 18+ Age Gating.
          </div>

        </div>
      </footer>

    </div>
  );
};
