import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { VideoCallView } from './components/Call/VideoCallView';
import { ReportModal } from './components/Safety/ReportModal';
import { WalletModal } from './components/Wallet/WalletModal';
import { OnboardingModal } from './components/Auth/OnboardingModal';
import { AdminDashboard } from './pages/AdminDashboard';
import { useWallet } from './context/WalletContext';
import { useAuth } from './context/AuthContext';

function App() {
  const { unlockedFilters } = useWallet();
  const { isOnboarded, user } = useAuth();

  // Platform mode: 'user' | 'admin'
  const [currentMode, setCurrentMode] = useState('user');

  const isAdmin = user?.role === 'admin' || user?.isAdmin;
  const activeMode = isAdmin ? currentMode : 'user';

  // Modal states
  const [walletOpen, setWalletOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(!isOnboarded);
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

  // Report handler from VideoCallView
  const handleReport = useCallback((user, sessionId) => {
    setReportTarget({ user, sessionId });
    setReportOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-dark)]">
      {/* ═══ NAVBAR ═══ */}
      <Navbar
        currentMode={activeMode}
        setCurrentMode={setCurrentMode}
        onOpenWallet={() => setWalletOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* ═══ MAIN CONTENT ═══ */}
      {activeMode === 'user' ? (
        <VideoCallView
          onReport={handleReport}
          walletFilters={unlockedFilters}
          onOpenWallet={() => setWalletOpen(true)}
        />
      ) : (
        <AdminDashboard />
      )}

      {/* ═══ MODALS ═══ */}
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

      <OnboardingModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
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
