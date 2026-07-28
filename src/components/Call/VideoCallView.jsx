import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video, VideoOff, Mic, MicOff, SkipForward, PhoneOff,
  MessageSquare, ShieldAlert, ShieldCheck, CheckCircle2, Lock, Coins, X, Send, Clock, Maximize2, Minimize2,
  Loader2, Radio, Globe, Users, Sparkles, LayoutGrid, Columns, Volume2
} from 'lucide-react';
import { searchMatch } from '../../services/matchmakingService';
import { p2pSignaling } from '../../services/p2pSignaling';
import { mediasoupClientService } from '../../services/mediasoupClientService';
import { useModeration } from '../../context/ModerationContext';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';

export const VideoCallView = ({ onReport, walletFilters, onOpenWallet, onOpenAuth }) => {
  const { filterTextMessage, isUserRestricted, usersList } = useModeration();
  const { spendCoins, deductCoins, balance, FILTER_PRICES, filterPrices } = useWallet();
  const { user } = useAuth();

  const matchCost = (filterPrices && filterPrices.match) || (FILTER_PRICES && FILTER_PRICES.match) || 80;

  const userStatusObj = usersList?.find((u) => u.id === user?.id) || user;
  const isRestricted = user?.id ? (isUserRestricted(user.id) || userStatusObj?.status === 'banned' || userStatusObj?.status === 'suspended') : false;

  // State machine: idle → searching → connected → ended
  const [callState, setCallState] = useState('idle');
  const [searchCountdown, setSearchCountdown] = useState(60);
  const searchTimerRef = useRef(null);
  const [matchedUser, setMatchedUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [maxAllowedSeconds, setMaxAllowedSeconds] = useState(120);
  const maxAllowedSecondsRef = useRef(120);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExtendCall = (addSeconds, coinCost, label) => {
    const res = deductCoins
      ? deductCoins(coinCost, `Extended Call (${label})`)
      : spendCoins('extendCall', `Extended Call (${label})`);

    if (res && res.success) {
      const newMax = maxAllowedSecondsRef.current + addSeconds;
      maxAllowedSecondsRef.current = newMax;
      setMaxAllowedSeconds(newMax);
      setShowExtendModal(false);
      triggerToast(`🎉 Call Extended by +${addSeconds >= 3600 ? 'Unlimited' : Math.round(addSeconds / 60) + ' min'}!`);
    } else {
      triggerToast(`⚠️ Insufficient Coins! You need ${coinCost} coins.`, 'error');
      onOpenWallet();
    }
  };

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

  // P2P WebRTC Multi-tab state
  const [isP2PCall, setIsP2PCall] = useState(false);
  const pcRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const activeRemotePeerIdRef = useRef(null);
  const isP2PRef = useRef(false);
  const p2pMatchedRef = useRef(false);
  const searchingRef = useRef(false);
  const searchIntervalRef = useRef(null);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const localStreamRef = useRef(null);
  const skippedIdsRef = useRef([]);

  const [hasCamStream, setHasCamStream] = useState(false);

  // Buffer ICE candidates until remote description is set
  const addIceCandidateOrQueue = async (candidate) => {
    if (!candidate) return;
    if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {}
    } else {
      iceCandidatesQueueRef.current.push(candidate);
    }
  };

  const processIceQueue = async () => {
    if (!pcRef.current || !pcRef.current.remoteDescription) return;
    while (iceCandidatesQueueRef.current.length > 0) {
      const candidate = iceCandidatesQueueRef.current.shift();
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {}
    }
  };

  // Synthetic Media Stream (Canvas + Silent Audio) fallback if camera is blocked/denied
  const createSyntheticStream = useCallback((name = 'Demo User') => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    let step = 0;
    const draw = () => {
      step += 0.05;
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      ctx.beginPath();
      ctx.arc(320, 240, 85 + Math.sin(step) * 12, 0, Math.PI * 2);
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, 320, 230);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = '16px sans-serif';
      ctx.fillText('🟢 Live P2P Stream', 320, 270);
    };

    const interval = setInterval(draw, 50);
    const canvasStream = canvas.captureStream(30);

    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ac.createOscillator();
      const dest = ac.createMediaStreamDestination();
      const gain = ac.createGain();
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(dest);
      osc.start();

      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }
    } catch (e) {}

    canvasStream._stopSynthetic = () => {
      clearInterval(interval);
    };

    return canvasStream;
  }, []);

  // Cleanup P2P & MediaSoup WebRTC Connection
  const cleanupP2P = useCallback(() => {
    try {
      mediasoupClientService.leave();
    } catch (e) {}
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
    if (searchTimerRef.current) {
      clearInterval(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    searchingRef.current = false;
    iceCandidatesQueueRef.current = [];
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }
    remoteStreamRef.current = null;
    activeRemotePeerIdRef.current = null;
    isP2PRef.current = false;
    p2pMatchedRef.current = false;
    setIsP2PCall(false);
  }, []);

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
        localVideoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera unavailable, creating synthetic stream:', err.message);
      const synthStream = createSyntheticStream(user?.name || 'Demo User');
      localStreamRef.current = synthStream;
      setHasCamStream(true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = synthStream;
        localVideoRef.current.play().catch(() => {});
      }
    }
  }, [user, createSyntheticStream]);

  // Cleanup camera
  const stopLocalCamera = useCallback(() => {
    if (localStreamRef.current) {
      if (localStreamRef.current._stopSynthetic) {
        localStreamRef.current._stopSynthetic();
      }
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
  }, []);

  // Search for a match (Hardcoded Alex ↔ Elena Demo Pairing)
  const startSearch = useCallback(async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (isRestricted) {
      alert(`Account Restricted: Your account status is currently ${userStatusObj?.status?.toUpperCase() || 'RESTRICTED'}. Reason: ${userStatusObj?.banReason || 'Policy Violation'}`);
      return;
    }

    const resultCoins = spendCoins('match', `Started 1:1 Stranger Call (${matchCost} coins)`);
    if (!resultCoins.success) {
      alert(`Insufficient Coins! Each stranger match costs ${matchCost} coins. You currently have ${balance} coins.`);
      if (onOpenWallet) onOpenWallet();
      return;
    }

    cleanupP2P();
    setCallState('searching');
    setSearchCountdown(60);
    setChatMessages([]);
    setCallDuration(0);
    setMatchedUser(null);
    setRemoteVideoError(false);

    searchingRef.current = true;
    p2pMatchedRef.current = false;

    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    searchTimerRef.current = setInterval(() => {
      setSearchCountdown((prev) => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    if (callMode === 'video') {
      await startLocalCamera();
    }

    // Broadcast SEARCH_START signal every 1.5s to initiate live WebRTC video offer/answer with active peers
    const sendSearchSignal = () => {
      if (searchingRef.current && !p2pMatchedRef.current) {
        console.log('[RTC] Broadcasting SEARCH_START signal to active peer queue...');
        p2pSignaling.send('SEARCH_START', {
          senderPeerId: p2pSignaling.peerId,
          userProfile: {
            id: user?.id || p2pSignaling.peerId,
            name: user?.name || 'Stranger',
            country: user?.country || 'Worldwide',
            age: user?.age || 24,
            avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          }
        });
      }
    };

    sendSearchSignal();
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    searchIntervalRef.current = setInterval(sendSearchSignal, 1500);

    // Fallback: If no real peer responds within 5s, connect demo partner
    setTimeout(() => {
      if (!p2pMatchedRef.current && searchingRef.current) {
        const isAlex = user?.email?.includes('alex') || user?.name?.toLowerCase()?.includes('alex');
        const isElena = user?.email?.includes('elena') || user?.name?.toLowerCase()?.includes('elena');

        let partner = null;
        if (isAlex) {
          partner = {
            id: 'usr-11029',
            name: 'Elena Rostova',
            gender: 'female',
            country: 'Spain',
            age: 24,
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            greeting: 'Hola Alex! Excited to connect with you from Barcelona ✨'
          };
        } else if (isElena) {
          partner = {
            id: 'usr-88329',
            name: 'Alex Vance',
            gender: 'non-binary',
            country: 'United States',
            age: 28,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            greeting: 'Hey Elena! Great connecting with you 👋'
          };
        } else {
          partner = {
            id: 'usr-demo-01',
            name: 'Elena Rostova',
            gender: 'female',
            country: 'Spain',
            age: 24,
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
            greeting: 'Hey there! Live P2P connection ready 👋'
          };
        }

        if (searchTimerRef.current) {
          clearInterval(searchTimerRef.current);
          searchTimerRef.current = null;
        }
        setMatchedUser(partner);
        setSessionId(`sess-${Date.now()}`);
        setCallState('connected');
        setChatOpen(true);
        setIsP2PCall(true);

        const targetPeerId = isAlex ? 'stranger_demo_elena_v7' : 'stranger_demo_alex_v7';
        activeRemotePeerIdRef.current = targetPeerId;

        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => {
            const next = prev + 1;
            if (next >= maxAllowedSecondsRef.current) {
              setShowExtendModal(true);
            }
            return next;
          });
        }, 1000);
      }
    }, 5000);
  }, [user, onOpenAuth, isRestricted, userStatusObj, spendCoins, matchCost, balance, onOpenWallet, cleanupP2P, callMode, startLocalCamera, genderFilter, locationFilter, stopLocalCamera, createSyntheticStream]);

  // WebRTC P2P Signaling Listeners for Multi-Tab 2-User Calls
  useEffect(() => {
    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        {
          urls: [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:443',
            'turn:openrelay.metered.ca:443?transport=tcp'
          ],
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    };

    const handleSearchStart = async (payload) => {
      if (searchingRef.current && payload.senderPeerId !== p2pSignaling.peerId && !p2pMatchedRef.current) {
        console.log(`[RTC] Received SEARCH_START from ${payload.userProfile?.name}. Initiating Offer...`, payload);
        p2pMatchedRef.current = true;
        searchingRef.current = false;
        if (searchIntervalRef.current) {
          clearInterval(searchIntervalRef.current);
          searchIntervalRef.current = null;
        }

        activeRemotePeerIdRef.current = payload.senderPeerId;
        isP2PRef.current = true;
        setIsP2PCall(true);

        console.log('[RTC] Creating PeerConnection with STUN/TURN configuration...');
        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        pc.onconnectionstatechange = () => {
          console.log(`[RTC] Connection State changed: ${pc.connectionState}`);
          if (pc.connectionState === 'failed') {
            console.error('[RTC] Connection Failed! Check TURN server / firewall settings.');
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log(`[RTC] ICE State changed: ${pc.iceConnectionState}`);
        };

        pc.onsignalingstatechange = () => {
          console.log(`[RTC] Signaling State changed: ${pc.signalingState}`);
        };

        if (localStreamRef.current) {
          console.log('[RTC] getUserMedia Started & Local Stream Tracks exist. Adding Tracks...');
          localStreamRef.current.getTracks().forEach((t) => {
            console.log(`[RTC] Adding Track [Kind: ${t.kind}, Enabled: ${t.enabled}]`);
            pc.addTrack(t, localStreamRef.current);
          });
        }

        pc.ontrack = (event) => {
          console.log(`[RTC] Remote Track received! [Kind: ${event.track.kind}]`, event.streams[0]);
          if (event.streams && event.streams[0]) {
            remoteStreamRef.current = event.streams[0];
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
              remoteVideoRef.current.play().catch(() => {});
            }
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`[RTC] ICE Generated [Candidate: ${event.candidate.candidate.substring(0, 40)}...]`);
            p2pSignaling.send('ICE_CANDIDATE', { targetPeerId: payload.senderPeerId, candidate: event.candidate });
          } else {
            console.log('[RTC] ICE Gathering Complete');
          }
        };

        console.log('[RTC] Creating Offer...');
        const offer = await pc.createOffer();
        console.log('[RTC] Local Description Set (Offer)');
        await pc.setLocalDescription(offer);

        console.log('[RTC] Offer Sent to peer:', payload.senderPeerId);
        p2pSignaling.send('MATCH_OFFER', {
          targetPeerId: payload.senderPeerId,
          offer,
          userProfile: {
            id: user?.id || p2pSignaling.peerId,
            name: user?.name || 'Alex Vance',
            country: user?.country || 'United States',
            age: user?.age || 28,
            avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          }
        });

        setMatchedUser({
          id: payload.senderPeerId,
          name: payload.userProfile?.name || 'Live Peer',
          country: payload.userProfile?.country || 'Live Multi-Tab Peer',
          age: payload.userProfile?.age || 24,
          avatar: payload.userProfile?.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
          greeting: `Connected live with ${payload.userProfile?.name || 'Stranger'}! 👋`
        });
        setSessionId(`p2p-${Date.now()}`);
        setCallState('connected');
        setChatOpen(true);

        // MediaSoup SFU Join for Live Multi-Device Call
        const activeLocalStream = localStreamRef.current || createSyntheticStream(user?.name || 'Live Peer');
        const audioTrack = activeLocalStream.getAudioTracks()[0] || null;
        const videoTrack = activeLocalStream.getVideoTracks()[0] || null;
        const sfuRoomId = `sfu_room_${payload.senderPeerId}_${p2pSignaling.peerId}`;

        mediasoupClientService.onRemoteTrackAdded = (consumerInfo) => {
          console.log(`%c[MEDIASOUP SFU 📺] Remote track received: ${consumerInfo.kind}`, 'color: #10b981; font-weight: bold;', consumerInfo.track);
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
          }
          remoteStreamRef.current.addTrack(consumerInfo.track);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            remoteVideoRef.current.play().catch(() => {});
          }
        };

        mediasoupClientService.joinRoom(sfuRoomId, user?.name || 'User', { audioTrack, videoTrack }).catch((err) => {
          console.warn('[MEDIASOUP SFU Notice]:', err.message);
        });

        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => {
            const next = prev + 1;
            if (next >= maxAllowedSecondsRef.current) {
              setShowExtendModal(true);
            }
            return next;
          });
        }, 1000);
      }
    };

    const handleMatchOffer = async (payload) => {
      if (payload.targetPeerId === p2pSignaling.peerId && !p2pMatchedRef.current) {
        console.log(`%c[WEBRTC CALL 📥] Received MATCH_OFFER from ${payload.userProfile?.name}. Creating Answer...`, 'color: #8b5cf6; font-weight: bold;', payload);
        p2pMatchedRef.current = true;
        searchingRef.current = false;
        if (searchIntervalRef.current) {
          clearInterval(searchIntervalRef.current);
          searchIntervalRef.current = null;
        }

        activeRemotePeerIdRef.current = payload.senderPeerId;
        isP2PRef.current = true;
        setIsP2PCall(true);

        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
        }

        pc.ontrack = (event) => {
          console.log(`%c[WEBRTC CALL 📺] Remote Stream Track Received!`, 'color: #f59e0b; font-weight: bold;', event.streams[0]);
          if (event.streams && event.streams[0]) {
            remoteStreamRef.current = event.streams[0];
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
              remoteVideoRef.current.play().catch(() => {});
            }
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            p2pSignaling.send('ICE_CANDIDATE', { targetPeerId: payload.senderPeerId, candidate: event.candidate });
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        await processIceQueue();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        p2pSignaling.send('MATCH_ANSWER', { targetPeerId: payload.senderPeerId, answer });

        setMatchedUser({
          id: payload.senderPeerId,
          name: payload.userProfile?.name || 'Live Peer',
          country: payload.userProfile?.country || 'Live Multi-Tab Peer',
          age: payload.userProfile?.age || 24,
          avatar: payload.userProfile?.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
          greeting: `Connected live with ${payload.userProfile?.name || 'Stranger'}! 👋`
        });
        setSessionId(`p2p-${Date.now()}`);
        setCallState('connected');
        setChatOpen(true);

        // MediaSoup SFU Join for Answerer
        const activeLocalStream = localStreamRef.current || createSyntheticStream(user?.name || 'Live Peer');
        const audioTrack = activeLocalStream.getAudioTracks()[0] || null;
        const videoTrack = activeLocalStream.getVideoTracks()[0] || null;
        const sfuRoomId = `sfu_room_${payload.senderPeerId}_${p2pSignaling.peerId}`;

        mediasoupClientService.onRemoteTrackAdded = (consumerInfo) => {
          console.log(`%c[MEDIASOUP SFU 📺] Remote track received: ${consumerInfo.kind}`, 'color: #10b981; font-weight: bold;', consumerInfo.track);
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
          }
          remoteStreamRef.current.addTrack(consumerInfo.track);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            remoteVideoRef.current.play().catch(() => {});
          }
        };

        mediasoupClientService.joinRoom(sfuRoomId, user?.name || 'User', { audioTrack, videoTrack }).catch((err) => {
          console.warn('[MEDIASOUP SFU Notice]:', err.message);
        });

        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => {
            const next = prev + 1;
            if (next >= maxAllowedSecondsRef.current) {
              setShowExtendModal(true);
            }
            return next;
          });
        }, 1000);
      }
    };

    const handleMatchAnswer = async (payload) => {
      if (payload.targetPeerId === p2pSignaling.peerId && pcRef.current) {
        console.log(`%c[WEBRTC CALL 🎉] Received MATCH_ANSWER! Connection ESTABLISHED!`, 'color: #06b6d4; font-weight: bold;', payload);
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        await processIceQueue();
      }
    };

    const handleIceCandidate = async (payload) => {
      if (payload.targetPeerId === p2pSignaling.peerId && payload.candidate) {
        await addIceCandidateOrQueue(payload.candidate);
      }
    };

    const handleP2PChat = (payload) => {
      console.log(`%c[P2P CHAT 📥 RECEIVED via P2P Engine] From: ${payload.senderName || 'Stranger'} | Message: "${payload.text}"`, 'color: #10b981; font-weight: bold; font-size: 13px;', payload);
      if (payload.senderName !== user?.name) {
        setChatMessages((prev) => {
          const isDuplicate = prev.some(
            (m) => m.sender === 'stranger' && m.text === payload.text && Math.abs(new Date(m.timestamp).getTime() - Date.now()) < 3000
          );
          if (isDuplicate) return prev;
          return [
            ...prev,
            {
              id: payload.msgId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              sender: 'stranger',
              text: payload.text,
              timestamp: new Date().toISOString()
            }
          ];
        });
      }
    };

    const handleEndCall = (payload) => {
      console.log(`%c[WEBRTC CALL 🛑] Received END_CALL event from ${payload.senderName || 'peer'}`, 'color: #ef4444; font-weight: bold;', payload);
      cleanupP2P();
      clearInterval(timerRef.current);
      stopLocalCamera();
      setCallState('ended');
      setCallDuration(0);
    };

    const unSubSearch = p2pSignaling.on('SEARCH_START', handleSearchStart);
    const unSubOffer = p2pSignaling.on('MATCH_OFFER', handleMatchOffer);
    const unSubAnswer = p2pSignaling.on('MATCH_ANSWER', handleMatchAnswer);
    const unSubIce = p2pSignaling.on('ICE_CANDIDATE', handleIceCandidate);
    const unSubChat = p2pSignaling.on('P2P_CHAT', handleP2PChat);
    const unSubEnd = p2pSignaling.on('END_CALL', handleEndCall);

    return () => {
      unSubSearch();
      unSubOffer();
      unSubAnswer();
      unSubIce();
      unSubChat();
      unSubEnd();
    };
  }, [user, cleanupP2P, stopLocalCamera]);

  // End current call
  const endCall = useCallback(() => {
    const targetPeerId = activeRemotePeerIdRef.current || (user?.email?.includes('alex') ? 'stranger_demo_elena_v7' : 'stranger_demo_alex_v7');
    console.log(`%c[WEBRTC CALL 🛑] Sending END_CALL to ${targetPeerId}`, 'color: #ef4444; font-weight: bold;');
    p2pSignaling.send('END_CALL', { targetPeerId, senderName: user?.name });
    cleanupP2P();
    clearInterval(timerRef.current);
    stopLocalCamera();
    setCallState('ended');
    setCallDuration(0);
    maxAllowedSecondsRef.current = 120;
    setMaxAllowedSeconds(120);
    setShowExtendModal(false);
  }, [user, stopLocalCamera, cleanupP2P]);

  // Skip to next stranger
  const skipToNext = useCallback(() => {
    const targetPeerId = activeRemotePeerIdRef.current || (user?.email?.includes('alex') ? 'stranger_demo_elena_v7' : 'stranger_demo_alex_v7');
    console.log(`%c[WEBRTC CALL 🛑] Skipping call. Sending END_CALL to ${targetPeerId}`, 'color: #ef4444; font-weight: bold;');
    p2pSignaling.send('END_CALL', { targetPeerId, senderName: user?.name });
    cleanupP2P();
    if (matchedUser) {
      skippedIdsRef.current.push(matchedUser.id);
    }
    clearInterval(timerRef.current);
    setCallDuration(0);
    maxAllowedSecondsRef.current = 120;
    setMaxAllowedSeconds(120);
    setShowExtendModal(false);
    setChatMessages([]);
    startSearch();
  }, [user, matchedUser, startSearch, cleanupP2P]);

  // Auto-initialize camera preview on mount
  useEffect(() => {
    if (!localStreamRef.current) {
      startLocalCamera();
    }
  }, [startLocalCamera]);

  // Attach camera stream & remote stream when connected view mounts
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.muted = true;
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localVideoRef.current.play().catch(() => {});
    }

    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [callState, callMode, hasCamStream, matchedUser, isP2PCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      stopLocalCamera();
      cleanupP2P();
    };
  }, [stopLocalCamera, cleanupP2P]);

  // Disconnect active session if user gets restricted by Admin in real-time
  useEffect(() => {
    if (isRestricted && (callState === 'connected' || callState === 'searching')) {
      endCall();
    }
  }, [isRestricted, callState, endCall]);

  // Scroll chat container to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Set deterministic PeerID for WebSocket signaling
  useEffect(() => {
    if (user?.email?.includes('alex') || user?.name?.toLowerCase()?.includes('alex')) {
      p2pSignaling.setPeerId('stranger_demo_alex_v7');
    } else if (user?.email?.includes('elena') || user?.name?.toLowerCase()?.includes('elena')) {
      p2pSignaling.setPeerId('stranger_demo_elena_v7');
    }
  }, [user]);

  // Answering incoming WebRTC PeerJS Video Calls (2-way camera sharing)
  useEffect(() => {
    p2pSignaling.onIncomingCall = (mediaCall) => {
      console.log(`%c[WEBRTC CALL 📞] Answering incoming WebRTC video call from ${mediaCall.peer}`, 'color: #10b981; font-weight: bold;');
      const activeStream = localStreamRef.current || createSyntheticStream(user?.name || 'Demo');
      mediaCall.answer(activeStream);
      mediaCall.on('stream', (remoteStream) => {
        console.log(`%c[WEBRTC CALL 📺] Remote WebRTC stream received & playing!`, 'color: #06b6d4; font-weight: bold;', remoteStream);
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(() => {});
        }
      });
    };
  }, [user, createSyntheticStream]);

  // Send a chat message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const { cleanText, isFlagged } = filterTextMessage(chatInput);

    console.log(`%c[P2P CHAT 📤 SENT] Sender: ${user?.name} | Message: "${cleanText}"`, 'color: #3b82f6; font-weight: bold; font-size: 13px;');

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender: 'me',
        text: cleanText,
        flagged: isFlagged,
        timestamp: new Date().toISOString()
      }
    ]);
    setChatInput('');

    const isAlex = user?.email?.includes('alex') || user?.name?.toLowerCase()?.includes('alex');
    const targetPeerId = isAlex ? 'stranger_demo_elena_v7' : 'stranger_demo_alex_v7';

    // Broadcast chat to target user via PeerJS Cloud WebSocket Engine
    p2pSignaling.send('P2P_CHAT', {
      targetPeerId,
      senderName: user?.name,
      text: cleanText
    });
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
  // ═══════════════════════════════════════════════
  // RENDER: IDLE STATE — Home / Landing
  // ═══════════════════════════════════════════════
  if (callState === 'idle' || callState === 'ended') {
    return (
      <div className="min-h-[calc(100vh-70px)] px-3 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col justify-center">
        
        {/* Main Grid: Left Side Panel | Center Setup Box | Right Side Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* ════════ LEFT SIDE PANEL: LIVE MATCHMAKER FEED & SAFETY BADGES ════════ */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-4">
            
            {/* Live Stranger Feed Widget */}
            <div className="glass-panel rounded-3xl p-4 border border-slate-800/80 shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">Live Match Feed</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  1,432 Online
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {[
                  { name: 'Elena R.', age: 22, flag: 'Spain', mode: 'Video Call', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
                  { name: 'Marcus Chen', age: 25, flag: 'Singapore', mode: 'Text Room', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80' },
                  { name: 'Sophia M.', age: 21, flag: 'USA', mode: 'Video Call', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80' }
                ].map((st, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/60 transition-transform hover:scale-[1.02]">
                    <img src={st.avatar} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-500/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white truncate">{st.name}</p>
                        <span className="text-[9px] text-slate-400">{st.flag}</span>
                      </div>
                      <p className="text-[10px] text-violet-300 font-medium">{st.mode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Safety Guarantee Card */}
            <div className="glass-panel rounded-3xl p-4 border border-rose-500/20 bg-rose-950/10 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Strict Safety Standards</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                BETADRIX maintains a zero-tolerance policy against inappropriate behavior.
              </p>
              <div className="space-y-1.5 pt-1 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>18+ Age Gated & Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Encrypted WebRTC Signaling</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>24/7 Moderation Oversight</span>
                </div>
              </div>
            </div>

          </div>

          {/* ════════ CENTER COLUMN: MAIN MATCHMAKER SETUP ════════ */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            
            {/* Hero Section */}
            <div className="text-center mb-6 sm:mb-8 max-w-lg">
              <div className="relative inline-flex items-center justify-center mb-4 sm:mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-violet-600 via-purple-500 to-cyan-400 p-1 shadow-2xl shadow-violet-500/30">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                    <Video className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
                  </div>
                </div>
                <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-violet-500/30 animate-radar" />
                <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-violet-500/20 animate-radar" style={{ animationDelay: '0.5s' }} />
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-2.5 sm:mb-3 bg-gradient-to-r from-white via-violet-200 to-cyan-300 bg-clip-text text-transparent leading-tight">
                Meet Strangers Instantly
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed px-2">
                1:1 random video & text chat with people around the world. Moderated for safety with real-time AI + human oversight.
              </p>

              {callState === 'ended' && (
                <div className="mt-3 sm:mt-4 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 inline-flex items-center gap-2">
                  <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
                  Call ended. Ready for the next one?
                </div>
              )}

              {isRestricted && (
                <div className="mt-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 backdrop-blur-md text-left flex items-start gap-3 shadow-xl">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-300 flex items-center gap-2">
                      <span>Account Restricted</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-[9px] font-extrabold uppercase border border-rose-500/30">
                        {userStatusObj?.status}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      {userStatusObj?.banReason || 'Your account has been restricted by administrators due to community guidelines violation reports.'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Contact safety@betadrix.com for appeals.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mode & Filter Selection Cards */}
            <div className="w-full max-w-md space-y-3.5 sm:space-y-4 mb-5 sm:mb-6">
              {/* Mode Toggle */}
              <div className="glass-panel rounded-2xl p-3.5 sm:p-4 border border-slate-800/60">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Chat Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCallMode('video')}
                    className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs font-semibold transition-all ${
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
                    className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs font-semibold transition-all ${
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
              <div className="glass-panel rounded-2xl p-3.5 sm:p-4 border border-slate-800/60">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Match Filters</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <option value="any">Anyone</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non-binary">Non-Binary</option>
                      <option value="trans">Transgender</option>
                      <option value="couples">Couples / Duo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Region
                      {walletFilters?.location ? (
                        <span className="text-emerald-400 text-[9px]">✓ Unlocked</span>
                      ) : (
                        <span className="text-amber-400 text-[9px]">Coins</span>
                      )}
                    </label>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      disabled={!walletFilters?.location}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="any">Worldwide</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="South Korea">South Korea</option>
                      <option value="Singapore">Singapore</option>
                      <option value="India">India</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Mexico">Mexico</option>
                      <option value="Spain">Spain</option>
                      <option value="Italy">Italy</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                    </select>
                  </div>
                </div>

                {/* Age Range & Verified Badges Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800/60">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Age Range
                    </label>
                    <select
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="any">Any Adult Age (18+)</option>
                      <option value="18-24">18 – 24 years</option>
                      <option value="25-34">25 – 34 years</option>
                      <option value="35+">35+ years</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
                      <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-violet-600 border-slate-700 bg-slate-950"
                      />
                      <span className="text-[10px] font-medium text-slate-300 flex items-center gap-1">
                        Verified 18+ Only
                      </span>
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* Start Match CTA */}
            <button
              onClick={startSearch}
              className="w-full max-w-md py-3.5 sm:py-4 rounded-2xl btn-glow-purple animate-pulse-glow text-white text-sm sm:text-base font-bold flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                <span>Start Random Match</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  {matchCost} Coins
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-normal text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Max 2 Minutes per Match Session
              </span>
            </button>
          </div>

          {/* ════════ RIGHT SIDE PANEL: PROMO & REGION HIGHLIGHTS ════════ */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-4">
            
            {/* VIP Coin Promo Card */}
            <div
              onClick={onOpenWallet}
              className="glass-panel-interactive rounded-3xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-slate-950 shadow-xl cursor-pointer group relative overflow-hidden"
            >
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[9px] font-extrabold uppercase shadow-md">
                Special Deal
              </span>

              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                <Coins className="w-5 h-5" />
              </div>

              <h4 className="text-sm font-extrabold text-white mb-1">Get 500 Coins Bundle</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                Unlock female / male stranger matching & country filters instantly.
              </p>

              <button className="w-full py-2 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md">
                Claim Offer • $3.99 →
              </button>
            </div>

            {/* Trending Active Regions */}
            <div className="glass-panel rounded-3xl p-4 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" /> Active Regions
                </span>
                <span className="text-[10px] text-slate-400">180+ Countries</span>
              </div>

              <div className="space-y-2">
                {[
                  { region: 'United States', count: '480 Active' },
                  { region: 'Europe & UK', count: '320 Active' },
                  { region: 'Asia-Pacific', count: '290 Active' },
                  { region: 'Latin America', count: '180 Active' }
                ].map((rg, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/60 border border-slate-800/40">
                    <span className="font-medium text-slate-200">{rg.region}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">{rg.count}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER: SEARCHING STATE — Matchmaking Queue
  // ═══════════════════════════════════════════════
  if (callState === 'searching') {
    const progressPercent = Math.round(((60 - searchCountdown) / 60) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="text-center max-w-md w-full glass-panel p-8 sm:p-10 rounded-3xl border border-violet-500/30 bg-slate-950/90 shadow-2xl relative overflow-hidden">
          
          {/* Top 60s Timer Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold mb-6">
            <Clock className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>60s Partner Matchmaking Timer</span>
          </div>

          <div className="relative inline-flex items-center justify-center mb-6">
            {/* Animated Ring with 60s Countdown in Center */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 p-1 shadow-2xl shadow-violet-500/40">
              <div className="w-full h-full bg-slate-950 rounded-full flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold font-mono text-cyan-300 drop-shadow-md">{searchCountdown}s</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider">SEARCHING</span>
              </div>
            </div>
            <div className="absolute w-32 h-32 rounded-full border-2 border-violet-500/40 animate-radar" />
            <div className="absolute w-32 h-32 rounded-full border-2 border-cyan-400/30 animate-radar" style={{ animationDelay: '0.7s' }} />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Finding Your Partner…</h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-4">
            Scanning active queue for a {genderFilter !== 'any' ? genderFilter : 'random'} stranger {locationFilter !== 'any' ? `in ${locationFilter}` : 'worldwide'}
          </p>

          {/* 60s Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 mb-4">
            <div
              className="bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-400 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-6">
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            <span>Connecting to signaling server… ({60 - searchCountdown}s elapsed)</span>
          </div>

          <button
            onClick={() => {
              if (searchTimerRef.current) clearInterval(searchTimerRef.current);
              clearInterval(timerRef.current);
              stopLocalCamera();
              cleanupP2P();
              setCallState('idle');
            }}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-all border border-slate-800 hover:border-rose-500/30 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel Matchmaking Search
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER: CONNECTED STATE — Active Call
  // ═══════════════════════════════════════════════
  const remainingSeconds = Math.max(0, maxAllowedSeconds - callDuration);
  const isTimeRunningLow = remainingSeconds <= 30;

  return (
    <div className={`relative flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950' : 'h-[calc(100vh-62px)] sm:h-[calc(100vh-68px)] overflow-hidden'}`}>
      
      {/* Top Floating Controls Bar */}
      <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-30 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto">
          {/* Connection Status */}
          <div className="glass-panel rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 text-[11px] sm:text-xs backdrop-blur-md bg-slate-950/80 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
            <span className="text-emerald-300 font-medium hidden xs:inline">Connected</span>
            <span className="text-emerald-300 font-medium xs:hidden">Live</span>
          </div>

          {/* Mode Badge: Live 2-User P2P vs Simulated Bot */}
          <div className={`glass-panel rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 text-[10px] sm:text-xs font-bold backdrop-blur-md border ${
            isP2PCall
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
              : 'bg-slate-900/90 text-amber-300 border-amber-500/30'
          }`}>
            <span>{isP2PCall ? '🟢 LIVE 2-USER P2P MATCH' : '🤖 DEMO BOT'}</span>
          </div>

          {/* Countdown Timer with + Extend button */}
          <div className={`glass-panel rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold backdrop-blur-md transition-all ${
            isTimeRunningLow
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : 'bg-slate-950/80 text-amber-300 border-amber-500/30'
          }`}>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono">{formatDuration(remainingSeconds)}</span>
            <button
              onClick={() => setShowExtendModal(true)}
              className="ml-1 px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:scale-105 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              + Extend
            </button>
          </div>
        </div>

        {/* Top Right Actions: Layout Switcher & Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {callMode === 'video' && (
            <button
              onClick={() => setLayoutMode(layoutMode === 'split' ? 'pip' : 'split')}
              className="px-2.5 sm:px-3 py-1.5 rounded-full glass-panel backdrop-blur-md bg-slate-950/80 border border-slate-800 text-[11px] sm:text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
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
            className="p-1.5 sm:p-2 rounded-full glass-panel backdrop-blur-md bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Containers Area */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden p-2 sm:p-3 pt-14 sm:pt-16 pb-2 sm:pb-3">
        {callMode === 'text' ? (
          /* ═════════ DEDICATED TEXT-ONLY MESSENGER ROOM ═════════ */
          <div className="w-full h-full max-w-4xl mx-auto flex flex-col glass-panel rounded-2xl sm:rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl bg-slate-950/90">
            {/* Stranger Header */}
            <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-2.5 sm:gap-3.5">
                <div className="relative">
                  <img
                    src={matchedUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={matchedUser?.name || 'Stranger'}
                    className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-cyan-500/50 shadow-md"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 flex items-center justify-center text-[7px] sm:text-[8px] text-white font-bold">✓</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white">{matchedUser?.name || 'Stranger'}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] sm:text-[10px] font-semibold hidden xs:inline-block">
                      💬 Text Only Chat
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400">{matchedUser?.country ? `${matchedUser.country} • ${matchedUser.age} yrs` : 'Live Stranger Chat'}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-emerald-400 bg-slate-950/80 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Stranger Live</span>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
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
                    className={`max-w-[82%] sm:max-w-[65%] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
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
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 border-t border-slate-800/60 bg-slate-950/80 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
              {['👋', '❤️', '🔥', '😂', '👏', '💯', '✨', '🎉', '😊', '👍'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setChatInput((prev) => prev + emoji)}
                  className="px-2.5 py-1 rounded-xl text-xs sm:text-sm hover:bg-slate-800 text-slate-300 hover:text-white transition-all shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={sendMessage} className="p-2.5 sm:p-3 border-t border-slate-800/80 bg-slate-900/90 flex items-center gap-2 sm:gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Type a message to ${matchedUser?.name?.split(' ')[0] || 'stranger'}…`}
                className="flex-1 bg-slate-950/90 border border-slate-800 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 sm:gap-2 shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* ═════════ VIDEO CHAT ROOM ═════════ */
          <div className={`w-full h-full relative transition-all duration-300 ${layoutMode === 'split' ? 'flex flex-col md:grid md:grid-cols-2 gap-2 sm:gap-4' : ''}`}>
            
            {/* BLOCK 1: OTHER'S CAM (Stranger) */}
            <div className={`overflow-hidden transition-all duration-300 bg-slate-900/90 shadow-2xl flex flex-col justify-between group ${
              layoutMode === 'split'
                ? 'relative w-full h-[calc(50%-4px)] md:h-full min-h-[160px] md:min-h-[220px] rounded-2xl border-2 border-violet-500/40'
                : 'absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl border-2 border-violet-500/60'
            }`}>
              {/* Header Badge */}
              <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950/85 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-violet-500/30">
                  <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-rose-500"></span>
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-white tracking-wide uppercase">Other's Cam</span>
                </div>
                <div className="bg-slate-950/85 backdrop-blur-md px-2 sm:px-2.5 py-1 rounded-full border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1.5">
                  <img src={matchedUser?.avatar} alt={matchedUser?.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                  <span className="font-semibold text-white truncate max-w-[90px] sm:max-w-none">{matchedUser?.name}</span>
                </div>
              </div>

              {/* Video Content / Live WebRTC Stream / Fallback */}
              <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${remoteVideoError ? 'hidden' : ''}`}
                />
                {remoteVideoError && (
                  /* High quality animated fallback stream card */
                  <div className="w-full h-full relative flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-slate-900 via-violet-950/40 to-slate-950">
                    <div className="relative mb-2.5 sm:mb-4">
                      <div className="w-20 h-20 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-violet-500 via-purple-500 to-cyan-400 shadow-2xl shadow-violet-500/30 animate-pulse">
                        <img
                          src={matchedUser?.avatar}
                          alt={matchedUser?.name}
                          className="w-full h-full rounded-full object-cover ring-2 sm:ring-4 ring-slate-950"
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold">
                        ✓
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">{matchedUser?.name}</h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 mb-2 sm:mb-3">{matchedUser?.country} • {matchedUser?.age} yrs</p>

                    {/* Audio visualizer spectrum bars */}
                    <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800/80 shadow-inner">
                      <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[10px] text-violet-300 font-medium mr-1 hidden xs:inline">Live Audio</span>
                      <span className="w-1 h-3 bg-violet-500 rounded-full animate-pulse" style={{ animationDuration: '0.5s' }} />
                      <span className="w-1 h-5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDuration: '0.35s' }} />
                      <span className="w-1 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDuration: '0.7s' }} />
                      <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse" style={{ animationDuration: '0.45s' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Block Footer overlay */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 z-20 flex items-center justify-between pointer-events-none">
                <div className="bg-slate-950/85 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-lg border border-slate-800 text-[11px] sm:text-xs text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{matchedUser?.country}</span>
                </div>
                <div className="bg-slate-950/85 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-lg border border-slate-800 text-[11px] sm:text-xs text-emerald-400 font-medium">
                  ● Stranger Live
                </div>
              </div>
            </div>

            {/* BLOCK 2: YOUR CAM (Self) */}
            <div className={`overflow-hidden transition-all duration-300 bg-slate-900/90 shadow-2xl flex flex-col justify-between group ${
              layoutMode === 'split'
                ? 'relative w-full h-[calc(50%-4px)] md:h-full min-h-[160px] md:min-h-[220px] rounded-2xl border-2 border-cyan-500/40'
                : `absolute top-2.5 ${chatOpen ? 'right-2.5 md:right-[360px]' : 'right-2.5 sm:right-6'} w-28 h-24 sm:w-48 sm:h-36 rounded-2xl border-2 border-cyan-400/60 z-30 shadow-2xl hover:scale-105`
            }`}>
              {/* Header Badge */}
              <div className={`absolute ${layoutMode === 'pip' ? 'top-2 left-2 z-20' : 'top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 z-20'} flex items-center justify-between pointer-events-none`}>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950/85 backdrop-blur-md px-2 sm:px-2.5 py-1 rounded-full border border-cyan-500/30">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-white tracking-wide uppercase">Your Cam</span>
                </div>
                {layoutMode === 'split' && (
                  <div className="bg-slate-950/85 backdrop-blur-md px-2 sm:px-2.5 py-1 rounded-full border border-slate-800 text-[9px] sm:text-[10px] text-slate-300">
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
                  style={{ transform: 'scaleX(-1)' }}
                  className={`w-full h-full object-cover ${(!hasCamStream || isCameraOff) ? 'hidden' : ''}`}
                />
                {(!hasCamStream || isCameraOff) && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/95 text-slate-300 p-2 sm:p-3 text-center">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
                      alt="You"
                      className={`${layoutMode === 'pip' ? 'w-8 h-8 sm:w-12 sm:h-12' : 'w-16 h-16 sm:w-28 sm:h-28'} rounded-full object-cover ring-2 sm:ring-4 ring-cyan-500/40 mb-1 sm:mb-2 shadow-xl`}
                    />
                    <span className={`${layoutMode === 'pip' ? 'text-[8px] sm:text-[9px]' : 'text-xs sm:text-sm'} font-semibold text-white`}>
                      {isCameraOff ? 'Camera Off' : 'Live Self View'}
                    </span>
                  </div>
                )}
              </div>

              {/* Block Footer overlay */}
              {layoutMode === 'split' ? (
                <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none">
                  <div className="bg-slate-950/85 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-lg border border-slate-800 text-[11px] sm:text-xs text-slate-300">
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
      <div className="relative z-30 glass-panel border-t border-slate-800/80 px-2 sm:px-4 py-2 sm:py-3 pb-safe">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">

          {/* Left: Report & Block */}
          <button
            onClick={() => onReport && onReport(matchedUser, sessionId)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all group shrink-0"
            title="Report & Block User"
          >
            <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Report & Block</span>
            <span className="sm:hidden text-[10px]">Report</span>
          </button>

          {/* Center: Call Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Audio Mute button - Video mode only */}
            {callMode === 'video' && (
              <button
                onClick={async () => {
                  const nextMuted = !isMuted;
                  setIsMuted(nextMuted);
                  try {
                    await mediasoupClientService.toggleAudio(nextMuted);
                  } catch (e) {}
                  if (localStreamRef.current) {
                    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !nextMuted; });
                  }
                }}
                className={`p-2.5 sm:p-3 rounded-full transition-all ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            )}

            {/* Camera Toggle button - Video mode only */}
            {callMode === 'video' && (
              <button
                onClick={async () => {
                  const nextCamOff = !isCameraOff;
                  setIsCameraOff(nextCamOff);
                  try {
                    await mediasoupClientService.toggleVideo(!nextCamOff);
                  } catch (e) {}
                  if (localStreamRef.current) {
                    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !nextCamOff; });
                  }
                }}
                className={`p-2.5 sm:p-3 rounded-full transition-all ${
                  isCameraOff
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
                }`}
                title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isCameraOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            )}

            {/* End Call */}
            <button
              onClick={endCall}
              className="p-2.5 sm:p-3 rounded-full btn-glow-rose text-white"
              title="End Chat"
            >
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Skip / Next Stranger */}
            <button
              onClick={skipToNext}
              className="p-2.5 sm:p-3 rounded-full btn-glow-cyan text-white"
              title="Skip to Next Stranger"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Floating Chat Toggle button - Video mode only */}
            {callMode === 'video' && (
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`p-2.5 sm:p-3 rounded-full transition-all ${
                  chatOpen
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
                }`}
                title="Toggle Overlay Chat"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ═══ MOBILE BACKDROP OVERLAY FOR CHAT DRAWER ═══ */}
      {callMode === 'video' && chatOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setChatOpen(false)}
        />
      )}

      {/* ═══ FLOATING CHAT BOX (Desktop Panel / Mobile Bottom Drawer) ═══ */}
      {callMode === 'video' && (
        <div
          className={`fixed inset-x-0 bottom-0 z-50 md:absolute md:top-16 md:bottom-20 md:right-4 md:inset-x-auto w-full md:w-[330px] lg:w-[350px] h-[70vh] md:h-auto max-h-[480px] md:max-h-none transition-all duration-300 ease-in-out ${
            chatOpen ? 'translate-y-0 md:translate-x-0 opacity-100' : 'translate-y-full md:translate-x-[120%] opacity-0 pointer-events-none'
          }`}
        >
          <div className="glass-panel rounded-t-3xl md:rounded-2xl border border-violet-500/30 flex flex-col h-full shadow-2xl backdrop-blur-xl bg-slate-950/95 md:bg-slate-950/90 overflow-hidden">
            
            {/* Mobile Drag Indicator */}
            <div className="md:hidden w-12 h-1 bg-slate-700/80 rounded-full mx-auto my-2" />

            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-2.5 sm:py-3 border-b border-slate-800/80 bg-slate-900/80">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
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
            <form onSubmit={sendMessage} className="p-2.5 border-t border-slate-800/80 bg-slate-900/90 flex items-center gap-2 pb-safe">
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

      {/* ════════ CALL EXTENSION MODAL ════════ */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-amber-500/10 space-y-4 sm:space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Call Limit Reached</h3>
                  <p className="text-xs text-slate-400">Extend time to keep talking with {matchedUser?.name?.split(' ')[0] || 'stranger'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowExtendModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Balance Indicator */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-xs text-slate-400 font-medium">Your Coins Balance</span>
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
                <Coins className="w-4 h-4" />
                <span>{balance} Coins</span>
              </div>
            </div>

            {/* Extension Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: +1 Min */}
              <button
                onClick={() => handleExtendCall(60, 5, '+1 Min')}
                className="flex flex-col justify-between p-3 rounded-2xl bg-slate-950 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/50 transition-all group text-left"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">+1 Minute</span>
                    <span className="text-[10px] font-semibold text-slate-400">5 Coins/min</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Quick extension</p>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-400">5 Coins</span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Add +1m
                  </span>
                </div>
              </button>

              {/* Option 2: +5 Mins (Popular) */}
              <button
                onClick={() => handleExtendCall(300, 20, '+5 Mins')}
                className="relative flex flex-col justify-between p-3 rounded-2xl bg-gradient-to-b from-amber-500/15 to-slate-950 hover:from-amber-500/25 border border-amber-500/50 transition-all group text-left shadow-lg shadow-amber-500/10"
              >
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full bg-amber-400 text-slate-950 shadow-sm">
                  Save 20%
                </span>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">+5 Minutes</span>
                    <span className="text-[10px] font-semibold text-amber-400/80">4 Coins/min</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Most popular choice</p>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-400">20 Coins</span>
                  <span className="text-[10px] font-bold text-slate-950 bg-amber-400 px-2 py-0.5 rounded-full shadow-sm">
                    Add +5m
                  </span>
                </div>
              </button>

              {/* Option 3: +10 Mins (Best Value) */}
              <button
                onClick={() => handleExtendCall(600, 35, '+10 Mins')}
                className="flex flex-col justify-between p-3 rounded-2xl bg-slate-950 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/50 transition-all group text-left"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">+10 Minutes</span>
                    <span className="text-[10px] font-semibold text-slate-400">3.5 Coins/min</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Best value for long chat</p>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-400">35 Coins</span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Add +10m
                  </span>
                </div>
              </button>

              {/* Option 4: Unlimited Pass */}
              <button
                onClick={() => handleExtendCall(3600, 50, 'Unlimited Pass')}
                className="flex flex-col justify-between p-3 rounded-2xl bg-slate-950 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/50 transition-all group text-left"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Unlimited Pass</span>
                    <span className="text-[10px] font-semibold text-slate-400">No Limit</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Talk as long as you want</p>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-400">50 Coins</span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Unlimited
                  </span>
                </div>
              </button>
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800/80">
              <button
                onClick={endCall}
                className="px-4 py-2 rounded-full text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-all"
              >
                End Call
              </button>
              <button
                onClick={onOpenWallet}
                className="px-4 py-2 rounded-full text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition-all flex items-center gap-1.5"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Get Coins</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold backdrop-blur-xl border transition-all animate-bounce ${
          toastMessage.type === 'error'
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-rose-950/50'
            : 'bg-slate-900/95 text-amber-300 border-amber-500/50 shadow-amber-500/20'
        }`}>
          {toastMessage.text}
        </div>
      )}
    </div>
  );
};
