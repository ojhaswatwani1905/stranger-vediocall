import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video, VideoOff, Mic, MicOff, SkipForward, PhoneOff,
  MessageSquare, ShieldAlert, X, Send, Clock, Maximize2, Minimize2,
  Loader2, Radio, Globe, Users, Sparkles, LayoutGrid, Columns, Volume2
} from 'lucide-react';
import { searchMatch } from '../../services/matchmakingService';
import { useModeration } from '../../context/ModerationContext';
import { useWallet } from '../../context/WalletContext';

export const VideoCallView = ({ onReport, walletFilters, onOpenWallet }) => {
  const { filterTextMessage } = useModeration();
  const { spendCoins, balance } = useWallet();

  // State machine: idle → searching → connected → ended
  const [callState, setCallState] = useState('idle');
  const [matchedUser, setMatchedUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callMode, setCallMode] = useState('video'); // video | text
  const [layoutMode, setLayoutMode] = useState('pip'); // 'pip' (big center Other's Cam + small floating Your Cam) | 'split'
  const [remoteVideoError, setRemoteVideoError] = useState(false);

  // Media controls
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Text chat
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Filters
  const [genderFilter, setGenderFilter] = useState('any');
  const [locationFilter, setLocationFilter] = useState('any');
  const [ageRange, setAgeRange] = useState('any');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const localStreamRef = useRef(null);
  const skippedIdsRef = useRef([]);

  const [hasCamStream, setHasCamStream] = useState(false);

  // Start user's camera
  const startLocalCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true
      });
      localStreamRef.current = stream;
      setHasCamStream(true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access denied or unattached, using avatar preview:', err.message);
      setHasCamStream(false);
    }
  }, []);

  // Cleanup camera
  const stopLocalCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
  }, []);

  // Search for a match
  const startSearch = useCallback(async () => {
    // Check coin balance (80 coins per match)
    const resultCoins = spendCoins('match', 'Started 1:1 Stranger Call (80 coins)');
    if (!resultCoins.success) {
      alert(`Insufficient Coins! Each stranger match costs 80 coins. You currently have ${balance} coins.`);
      if (onOpenWallet) onOpenWallet();
      return;
    }

    setCallState('searching');
    setChatMessages([]);
    setCallDuration(0);
    setMatchedUser(null);

    if (callMode === 'video') {
      await startLocalCamera();
    }

    const result = await searchMatch({
      mode: callMode,
      genderFilter,
      locationFilter,
      excludeIds: skippedIdsRef.current
    });

    setMatchedUser(result.matchedUser);
    setRemoteVideoError(false);
    setSessionId(result.sessionId);
    setCallState('connected');
    setChatOpen(true);

    // Start 2-minute max call timer (120 seconds cutoff)
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => {
        if (prev >= 119) {
          clearInterval(timerRef.current);
          stopLocalCamera();
          setCallState('ended');
          return 120;
        }
        return prev + 1;
      });
    }, 1000);

    // Auto-greeting from stranger
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'stranger',
          text: result.matchedUser.greeting || 'Hey there! 👋',
          timestamp: new Date().toISOString()
        }
      ]);
    }, 1500 + Math.random() * 2000);
  }, [callMode, genderFilter, locationFilter, startLocalCamera, spendCoins, balance, onOpenWallet, stopLocalCamera]);

  // End current call
  const endCall = useCallback(() => {
    clearInterval(timerRef.current);
    stopLocalCamera();
    setCallState('ended');
    setCallDuration(0);
  }, [stopLocalCamera]);

  // Skip to next stranger
  const skipToNext = useCallback(() => {
    if (matchedUser) {
      skippedIdsRef.current.push(matchedUser.id);
    }
    clearInterval(timerRef.current);
    setCallDuration(0);
    setChatMessages([]);
    startSearch();
  }, [matchedUser, startSearch]);

  // Attach camera stream & ensure video playback when connected view mounts or stream changes
  useEffect(() => {
    if (callState === 'connected' && callMode === 'video') {
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.muted = true;
        if (localVideoRef.current.srcObject !== localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        localVideoRef.current.play().catch(() => {});
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.muted = true;
        remoteVideoRef.current.play().catch(() => {});
      }
    }
  }, [callState, callMode, hasCamStream, matchedUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      stopLocalCamera();
    };
  }, [stopLocalCamera]);

  // Scroll chat container to bottom ONLY within its box, without scrolling the window
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Send a chat message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const { cleanText, isFlagged } = filterTextMessage(chatInput);

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'me',
        text: cleanText,
        flagged: isFlagged,
        timestamp: new Date().toISOString()
      }
    ]);
    setChatInput('');

    // Simulated stranger reply
    setTimeout(() => {
      const replies = [
        'That\'s interesting! Tell me more 😊',
        'Haha nice one! Where are you from?',
        'Cool! I love meeting new people here',
        'That\'s awesome! What do you do for fun?',
        'Oh wow, I\'ve never heard that before!'
      ];
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'stranger',
          text: replies[Math.floor(Math.random() * replies.length)],
          timestamp: new Date().toISOString()
        }
      ]);
    }, 1500 + Math.random() * 2500);
  };

  // Format seconds to MM:SS
  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ═══════════════════════════════════════════════
  // RENDER: IDLE STATE — Home / Landing
  // ═══════════════════════════════════════════════
  if (callState === 'idle' || callState === 'ended') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 max-w-lg">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-600 via-purple-500 to-cyan-400 p-1 shadow-2xl shadow-violet-500/30">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                <Video className="w-10 h-10 text-cyan-400" />
              </div>
            </div>
            <div className="absolute w-24 h-24 rounded-full bg-violet-500/30 animate-radar" />
            <div className="absolute w-24 h-24 rounded-full bg-violet-500/20 animate-radar" style={{ animationDelay: '0.5s' }} />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 bg-gradient-to-r from-white via-violet-200 to-cyan-300 bg-clip-text text-transparent leading-tight">
            Meet Strangers Instantly
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            1:1 random video & text chat with people around the world. Moderated for safety with real-time AI + human oversight.
          </p>

          {callState === 'ended' && (
            <div className="mt-4 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 inline-flex items-center gap-2">
              <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
              Call ended. Ready for the next one?
            </div>
          )}
        </div>

        {/* Mode & Filter Selection Cards */}
        <div className="w-full max-w-md space-y-4 mb-6">
          {/* Mode Toggle */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800/60">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Chat Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCallMode('video')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  callMode === 'video'
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20 ring-2 ring-violet-400/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Video className="w-4 h-4" />
                Video Chat
              </button>
              <button
                onClick={() => setCallMode('text')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  callMode === 'text'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Text Only
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800/60">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Match Filters</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block flex items-center gap-1">
                  <Users className="w-3 h-3" /> Gender
                  {walletFilters?.gender && <span className="text-emerald-400 text-[9px]">✓ Unlocked</span>}
                </label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  disabled={!walletFilters?.gender}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="any">🌈 Anyone</option>
                  <option value="female">♀️ Female</option>
                  <option value="male">♂️ Male</option>
                  <option value="non-binary">⚧ Non-Binary</option>
                  <option value="trans">⚧ Transgender</option>
                  <option value="couples">👥 Couples / Duo</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Region
                  {walletFilters?.location ? (
                    <span className="text-emerald-400 text-[9px]">✓ Unlocked</span>
                  ) : (
                    <span className="text-amber-400 text-[9px]">🔒 Coins</span>
                  )}
                </label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  disabled={!walletFilters?.location}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="any">🌐 Worldwide</option>
                  <option value="United States">🇺🇸 United States</option>
                  <option value="United Kingdom">🇬🇧 United Kingdom</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="Australia">🇦🇺 Australia</option>
                  <option value="Germany">🇩🇪 Germany</option>
                  <option value="France">🇫🇷 France</option>
                  <option value="Japan">🇯🇵 Japan</option>
                  <option value="South Korea">🇰🇷 South Korea</option>
                  <option value="Singapore">🇸🇬 Singapore</option>
                  <option value="India">🇮🇳 India</option>
                  <option value="Brazil">🇧🇷 Brazil</option>
                  <option value="Mexico">🇲🇽 Mexico</option>
                  <option value="Spain">🇪🇸 Spain</option>
                  <option value="Italy">🇮🇹 Italy</option>
                  <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
                </select>
              </div>
            </div>

            {/* Age Range & Verified Badges Row */}
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800/60">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Age Range
                </label>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="any">🎂 Any Adult Age (18+)</option>
                  <option value="18-24">⚡ 18 – 24 years</option>
                  <option value="25-34">✨ 25 – 34 years</option>
                  <option value="35+">🌟 35+ years</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-violet-600 border-slate-700 bg-slate-950"
                  />
                  <span className="text-[10px] font-medium text-slate-300 flex items-center gap-1">
                    🛡️ Verified 18+ Only
                  </span>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* Start Match CTA */}
        <button
          onClick={startSearch}
          className="w-full max-w-md py-4 rounded-2xl btn-glow-purple text-white text-base font-bold flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>Start Random Match</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              80 Coins
            </span>
          </div>
          <span className="text-[11px] font-normal text-slate-300">⏱️ Max 2 Minutes per Match Session</span>
        </button>

        {/* Safety Note */}
        <p className="mt-4 text-[10px] text-slate-500 text-center max-w-sm">
          All calls are moderated. Each match costs 80 coins and has a 2-minute max timer. BETADRIX enforces strict 18+ age gating.
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER: SEARCHING STATE — Matchmaking Queue
  // ═══════════════════════════════════════════════
  if (callState === 'searching') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400 p-1 shadow-2xl shadow-violet-500/40">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                <Radio className="w-12 h-12 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div className="absolute w-28 h-28 rounded-full border-2 border-violet-500/40 animate-radar" />
            <div className="absolute w-28 h-28 rounded-full border-2 border-cyan-400/30 animate-radar" style={{ animationDelay: '0.7s' }} />
            <div className="absolute w-28 h-28 rounded-full border border-purple-500/20 animate-radar" style={{ animationDelay: '1.3s' }} />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Finding Your Match…</h2>
          <p className="text-sm text-slate-400 mb-1">Scanning queue for a {genderFilter !== 'any' ? genderFilter : 'random'} stranger {locationFilter !== 'any' ? `in ${locationFilter}` : 'worldwide'}</p>

          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            Deducting 80 coins & connecting to signaling server…
          </div>

          <button
            onClick={() => { clearInterval(timerRef.current); stopLocalCamera(); setCallState('idle'); }}
            className="mt-8 px-6 py-2 rounded-full bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-all border border-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER: CONNECTED STATE — Active Call
  // ═══════════════════════════════════════════════
  const remainingSeconds = Math.max(0, 120 - callDuration);
  const isTimeRunningLow = remainingSeconds <= 30;

  return (
    <div className={`relative flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950' : 'h-[calc(100vh-68px)] overflow-hidden'}`}>
      
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Connection Status */}
          <div className="glass-panel rounded-full px-3 py-1.5 flex items-center gap-2 text-xs backdrop-blur-md bg-slate-950/80 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
            <span className="text-emerald-300 font-medium">Connected</span>
          </div>

          {/* 2-Minute Max Countdown Timer */}
          <div className={`glass-panel rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all ${
            isTimeRunningLow
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : 'bg-slate-950/80 text-amber-300 border-amber-500/30'
          }`}>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono">{formatDuration(remainingSeconds)}</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">(2m max)</span>
          </div>
        </div>

        {/* Top Right Actions: Layout Switcher & Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {callMode === 'video' && (
            <button
              onClick={() => setLayoutMode(layoutMode === 'split' ? 'pip' : 'split')}
              className="px-3 py-1.5 rounded-full glass-panel backdrop-blur-md bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
              title="Toggle Layout View"
            >
              {layoutMode === 'split' ? (
                <>
                  <Columns className="w-3.5 h-3.5 text-violet-400" />
                  <span className="hidden sm:inline">Split Blocks View</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Picture-in-Picture</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-full glass-panel backdrop-blur-md bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Containers Area */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden p-3 pt-16 pb-3">
        {callMode === 'text' ? (
          /* ═════════ DEDICATED TEXT-ONLY MESSENGER ROOM ═════════ */
          <div className="w-full h-full max-w-4xl mx-auto flex flex-col glass-panel rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl bg-slate-950/90">
            {/* Stranger Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <img
                    src={matchedUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={matchedUser?.name || 'Stranger'}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-500/50 shadow-md"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 flex items-center justify-center text-[8px] text-white font-bold">✓</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{matchedUser?.name || 'Stranger'}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold">
                      💬 Text Only Chat
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{matchedUser?.country ? `${matchedUser.country} • ${matchedUser.age} yrs` : 'Live Stranger Chat'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Stranger Live</span>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 text-cyan-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">Text Chat Room Active</p>
                  <p className="text-xs text-slate-500 mt-1">Send a message to start chatting with {matchedUser?.name?.split(' ')[0] || 'your stranger'}!</p>
                </div>
              )}

              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                      msg.sender === 'me'
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-br-xs border border-cyan-400/30'
                        : 'bg-slate-900/95 text-slate-200 rounded-bl-xs border border-slate-800'
                    } ${msg.flagged ? 'ring-1 ring-amber-500/40' : ''}`}
                  >
                    {msg.text}
                    {msg.flagged && (
                      <span className="block text-[10px] text-amber-400 mt-1 font-medium">⚠ Content filtered</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Emojis Bar */}
            <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {['👋', '❤️', '🔥', '😂', '👏', '💯', '✨', '🎉', '😊', '👍'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setChatInput((prev) => prev + emoji)}
                  className="px-2.5 py-1 rounded-xl text-sm hover:bg-slate-800 text-slate-300 hover:text-white transition-all shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={sendMessage} className="p-3 border-t border-slate-800/80 bg-slate-900/90 flex items-center gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Type a message to ${matchedUser?.name?.split(' ')[0] || 'stranger'}…`}
                className="flex-1 bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 shrink-0"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* ═════════ VIDEO CHAT ROOM ═════════ */
          <div className={`w-full h-full relative transition-all duration-300 ${layoutMode === 'split' ? 'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4' : ''}`}>
            
            {/* BLOCK 1: OTHER'S CAM (Stranger) */}
            <div className={`overflow-hidden transition-all duration-300 bg-slate-900/90 shadow-2xl flex flex-col justify-between group ${
              layoutMode === 'split'
                ? 'relative w-full h-full min-h-[220px] rounded-2xl border-2 border-violet-500/40'
                : 'absolute inset-0 w-full h-full rounded-3xl border-2 border-violet-500/60'
            }`}>
              {/* Header Badge */}
              <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-violet-500/30">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                  <span className="text-xs font-bold text-white tracking-wide uppercase">Other's Cam</span>
                </div>
                <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1.5">
                  <img src={matchedUser?.avatar} alt={matchedUser?.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                  <span className="font-semibold text-white">{matchedUser?.name}</span>
                </div>
              </div>

              {/* Video Content / Fallback */}
              <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                {matchedUser?.videoUrl && !remoteVideoError ? (
                  <video
                    ref={remoteVideoRef}
                    src={matchedUser.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => setRemoteVideoError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* High quality animated fallback stream card */
                  <div className="w-full h-full relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-violet-950/40 to-slate-950">
                    <div className="relative mb-4">
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-violet-500 via-purple-500 to-cyan-400 shadow-2xl shadow-violet-500/30 animate-pulse">
                        <img
                          src={matchedUser?.avatar}
                          alt={matchedUser?.name}
                          className="w-full h-full rounded-full object-cover ring-4 ring-slate-950"
                        />
                      </div>
                      <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[10px] text-white font-bold">
                        ✓
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-0.5">{matchedUser?.name}</h3>
                    <p className="text-xs text-slate-400 mb-3">{matchedUser?.country} • {matchedUser?.age} yrs</p>

                    {/* Audio visualizer spectrum bars */}
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800/80 shadow-inner">
                      <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[10px] text-violet-300 font-medium mr-1">Live Audio</span>
                      <span className="w-1 h-3 bg-violet-500 rounded-full animate-pulse" style={{ animationDuration: '0.5s' }} />
                      <span className="w-1 h-5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDuration: '0.35s' }} />
                      <span className="w-1 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDuration: '0.7s' }} />
                      <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse" style={{ animationDuration: '0.45s' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Block Footer overlay */}
              <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{matchedUser?.country}</span>
                </div>
                <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-xs text-emerald-400 font-medium">
                  ● Stranger Live
                </div>
              </div>
            </div>

            {/* BLOCK 2: YOUR CAM (Self) */}
            <div className={`overflow-hidden transition-all duration-300 bg-slate-900/90 shadow-2xl flex flex-col justify-between group ${
              layoutMode === 'split'
                ? 'relative w-full h-full min-h-[220px] rounded-2xl border-2 border-cyan-500/40'
                : `absolute top-3 ${chatOpen ? 'right-3 sm:right-[360px]' : 'right-3 sm:right-6'} w-36 h-28 sm:w-48 sm:h-36 rounded-2xl border-2 border-cyan-400/60 z-30 shadow-2xl hover:scale-105`
            }`}>
              {/* Header Badge */}
              <div className={`absolute ${layoutMode === 'pip' ? 'top-2 left-2 z-20' : 'top-3 left-3 right-3 z-20'} flex items-center justify-between pointer-events-none`}>
                <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-cyan-500/30">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-extrabold text-white tracking-wide uppercase">Your Cam</span>
                </div>
                {layoutMode === 'split' && (
                  <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-[10px] text-slate-300">
                    {isCameraOff ? '🚫 Cam Muted' : '📹 Cam Active'}
                  </div>
                )}
              </div>

              {/* Video Content / Local WebCam Stream */}
              <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${(!hasCamStream || isCameraOff) ? 'hidden' : ''}`}
                />
                {(!hasCamStream || isCameraOff) && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/95 text-slate-300 p-3 text-center">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
                      alt="You"
                      className={`${layoutMode === 'pip' ? 'w-10 h-10' : 'w-24 h-24 sm:w-28 sm:h-28'} rounded-full object-cover ring-4 ring-cyan-500/40 mb-2 shadow-xl`}
                    />
                    <span className={`${layoutMode === 'pip' ? 'text-[9px]' : 'text-sm'} font-semibold text-white`}>
                      {isCameraOff ? 'Camera Off' : 'Live Self View'}
                    </span>
                  </div>
                )}
              </div>

              {/* Block Footer overlay */}
              {layoutMode === 'split' ? (
                <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
                  <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
                    {isMuted ? '🔇 Mic Muted' : '🎙️ Mic Active'}
                  </div>
                </div>
              ) : (
                <span className="absolute bottom-1.5 left-2 text-[9px] text-white/90 font-medium bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none">
                  You
                </span>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ═══ BOTTOM CONTROL BAR ═══ */}
      <div className="relative z-30 glass-panel border-t border-slate-800/80 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">

          {/* Left: Report & Block */}
          <button
            onClick={() => onReport && onReport(matchedUser, sessionId)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all group"
            title="Report & Block User"
          >
            <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Report & Block</span>
          </button>

          {/* Center: Call Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Mute button - Video mode only */}
            {callMode === 'video' && (
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (localStreamRef.current) {
                    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
                  }
                }}
                className={`p-3 rounded-full transition-all ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            {/* Camera Toggle button - Video mode only */}
            {callMode === 'video' && (
              <button
                onClick={() => {
                  setIsCameraOff(!isCameraOff);
                  if (localStreamRef.current) {
                    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = isCameraOff; });
                  }
                }}
                className={`p-3 rounded-full transition-all ${
                  isCameraOff
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
                }`}
                title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            )}

            {/* End Call */}
            <button
              onClick={endCall}
              className="p-3 rounded-full btn-glow-rose text-white"
              title="End Chat"
            >
              <PhoneOff className="w-5 h-5" />
            </button>

            {/* Skip / Next Stranger */}
            <button
              onClick={skipToNext}
              className="p-3 rounded-full btn-glow-cyan text-white"
              title="Skip to Next Stranger"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Floating Chat Toggle button - Video mode only */}
            {callMode === 'video' && (
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`p-3 rounded-full transition-all ${
                  chatOpen
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
                }`}
                title="Toggle Overlay Chat"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Right: Spacer for symmetry */}
          <div className="w-28 sm:w-36" />
        </div>
      </div>

      {/* ═══ RIGHT-SIDE FLOATING CHAT BOX (Video Mode Only) ═══ */}
      {callMode === 'video' && (
        <div
          className={`absolute top-16 bottom-20 right-4 z-40 w-[330px] sm:w-[350px] transition-all duration-300 ease-in-out ${
            chatOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'
          }`}
        >
          <div className="glass-panel rounded-2xl border border-violet-500/30 flex flex-col h-full shadow-2xl backdrop-blur-xl bg-slate-950/90 overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img
                    src={matchedUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={matchedUser?.name || 'Stranger'}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-violet-500/50"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-slate-950" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">
                    {matchedUser?.name || 'Stranger'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {matchedUser?.country ? `${matchedUser.country} • Live Chat` : 'Live Chat'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-2">
                    <MessageSquare className="w-5 h-5 text-violet-400" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">Live Chat Active</p>
                  <p className="text-[11px] text-slate-500 mt-1">Send a message to {matchedUser?.name?.split(' ')[0] || 'your stranger'}!</p>
                </div>
              )}

              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'me'
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-xs border border-violet-500/30'
                        : 'bg-slate-900/90 text-slate-200 rounded-bl-xs border border-slate-700/60'
                    } ${msg.flagged ? 'ring-1 ring-amber-500/40' : ''}`}
                  >
                    {msg.text}
                    {msg.flagged && (
                      <span className="block text-[9px] text-amber-400 mt-1">⚠ Content filtered</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Reaction Emojis bar */}
            <div className="px-3 py-1.5 border-t border-slate-800/60 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['👋', '❤️', '🔥', '😂', '👏', '💯', '✨'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setChatInput((prev) => prev + emoji)}
                  className="px-2 py-1 rounded-lg text-xs hover:bg-slate-800 text-slate-300 hover:text-white transition-all shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input form */}
            <form onSubmit={sendMessage} className="p-2.5 border-t border-slate-800/80 bg-slate-900/90 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
