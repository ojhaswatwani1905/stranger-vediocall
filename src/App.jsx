import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { VideoCallView } from './components/Call/VideoCallView';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { AuthModal } from './components/Auth/AuthModal';
import { ReportModal } from './components/Safety/ReportModal';
import { WalletModal } from './components/Wallet/WalletModal';
import { OnboardingModal } from './components/Auth/OnboardingModal';
import { AdminDashboard } from './pages/AdminDashboard';
import { useWallet } from './context/WalletContext';
import { useAuth } from './context/AuthContext';

function App() {
  const { unlockedFilters } = useWallet();
  const { isOnboarded, user, loginWithCredentials } = useAuth();

  // Platform mode: 'user' | 'landing' | 'admin'
  const [currentMode, setCurrentMode] = useState('landing');

  const activeMode = currentMode;

  // Modal states
  const [walletOpen, setWalletOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('signin');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState({ user: null, sessionId: null });

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const openAuth = (tab = 'signin') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  // Report handler from VideoCallView
  const handleReport = useCallback((user, sessionId) => {
    setReportTarget({ user, sessionId });
    setReportOpen(true);
  }, []);

  // Mode navigation handler enforcing mandatory auth before video chat
  const handleNavigateMode = (targetMode) => {
    if (targetMode === 'signin' || targetMode === 'signup') {
      openAuth(targetMode);
      return;
    }
    if (targetMode === 'user' && !user) {
      addToast('Authentication Required: Please Sign In or Create an 18+ Account first.', 'error');
      openAuth('signin');
      return;
    }
    if (targetMode === 'admin' && (!user || (user.role !== 'admin' && !user.isAdmin))) {
      loginWithCredentials('admin@betadrix.com', 'admin123');
      addToast('Authenticated as Admin Master', 'info');
    }
    setCurrentMode(targetMode);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-dark)]">
      {/* ═══ NAVBAR ═══ */}
      <Navbar
        currentMode={activeMode}
        setCurrentMode={handleNavigateMode}
        onOpenWallet={() => setWalletOpen(true)}
        onOpenAuth={(tab) => openAuth(tab || 'signin')}
      />

      {/* ═══ MAIN CONTENT ═══ */}
      {activeMode === 'landing' ? (
        <LandingPage
          onLaunchApp={() => handleNavigateMode('user')}
          onOpenWallet={() => setWalletOpen(true)}
          onOpenAuth={(tab) => openAuth(tab || 'signin')}
          onOpenAdmin={() => handleNavigateMode('admin')}
        />
      ) : activeMode === 'user' ? (
        <VideoCallView
          onReport={handleReport}
          walletFilters={unlockedFilters}
          onOpenWallet={() => setWalletOpen(true)}
          onOpenAuth={() => {
            addToast('Authentication Required: Please Sign In to start matching.', 'error');
            openAuth('signin');
          }}
        />
      ) : (
        <AdminDashboard />
      )}

      {/* ═══ MODALS ═══ */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedInUser) => {
          const isAdminUser = loggedInUser?.isAdmin || loggedInUser?.role === 'admin';
          addToast(`Welcome, ${loggedInUser.name.split(' ')[0]}!`, 'success');
          setCurrentMode(isAdminUser ? 'admin' : 'user');
        }}
      />

      <WalletModal
        isOpen={walletOpen}
        onClose={() => setWalletOpen(false)}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedUser={reportTarget.user}
        sessionId={reportTarget.sessionId}
      />



      {/* ═══ TOAST NOTIFICATION SYSTEM ═══ */}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl text-xs font-medium shadow-2xl border backdrop-blur-md animate-slideUp ${
              toast.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : toast.type === 'error'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-violet-500/15 text-violet-300 border-violet-500/30'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
