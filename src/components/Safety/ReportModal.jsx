import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, X, CheckCircle2, UserX, Lock, AlertOctagon } from 'lucide-react';
import { useModeration } from '../../context/ModerationContext';

const REPORT_REASONS = [
  { code: 'nudity', label: 'Nudity / Sexual Content', icon: '🚫', color: 'rose' },
  { code: 'harassment', label: 'Harassment / Offensive Behavior', icon: '💢', color: 'amber' },
  { code: 'minor-suspected', label: 'Suspected Minor / CSAM Risk', icon: '⚠️', color: 'red', critical: true },
  { code: 'spam', label: 'Spam / Bot / Scam', icon: '🤖', color: 'orange' },
  { code: 'other', label: 'Other Violation', icon: '📋', color: 'slate' }
];

export const ReportModal = ({ isOpen, onClose, reportedUser, sessionId }) => {
  const { fileReport } = useModeration();
  const [selectedReason, setSelectedReason] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedReason) return;

    const reason = REPORT_REASONS.find((r) => r.code === selectedReason);

    fileReport({
      sessionId: sessionId || `sess-${Date.now()}`,
      reportedUser: reportedUser || { id: 'usr-stranger', name: 'Unknown Stranger' },
      reasonCode: selectedReason,
      reasonLabel: reason?.label || 'Unknown Reason'
    });

    setSubmitted(true);
  };

  // Submitted confirmation
  if (submitted) {
    const isCritical = selectedReason === 'minor-suspected';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-slate-800/60 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isCritical
              ? 'bg-red-500/20 border-2 border-red-500/40'
              : 'bg-emerald-500/20 border-2 border-emerald-500/40'
          }`}>
            {isCritical ? (
              <AlertOctagon className="w-8 h-8 text-red-400" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            {isCritical ? 'Critical Report Filed' : 'Report Submitted'}
          </h3>
          <p className="text-xs text-slate-400 mb-2">
            {isCritical
              ? 'This report has been immediately escalated to our Trust & Safety team. The reported account has been locked pending review.'
              : 'The user has been blocked from matching with you. Our moderation team will review within 24 hours.'
            }
          </p>

          {isCritical && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400 shrink-0" />
              CSAM / Minor Safety protocol activated. Account frozen & evidence preserved for legal compliance.
            </div>
          )}

          <button
            onClick={() => { setSubmitted(false); setSelectedReason(null); onClose(); }}
            className="mt-6 w-full py-3 rounded-xl btn-glow-purple text-white text-sm font-semibold"
          >
            Return to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-5 sm:p-6 border border-rose-500/20 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
        
        {/* Decorative gradient */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/60 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Report & Block User</h3>
            <p className="text-[11px] text-slate-400">
              Reporting{' '}
              <span className="text-rose-300 font-medium">
                {reportedUser?.name || 'Unknown Stranger'}
              </span>
            </p>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="space-y-2 mb-6">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason.code}
              onClick={() => setSelectedReason(reason.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border ${
                selectedReason === reason.code
                  ? reason.critical
                    ? 'bg-red-500/15 border-red-500/40 ring-2 ring-red-500/20'
                    : 'bg-violet-500/15 border-violet-500/40 ring-2 ring-violet-500/20'
                  : 'bg-slate-900/60 border-slate-800/60 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <span className="text-lg">{reason.icon}</span>
              <div className="flex-1">
                <span className={`text-xs font-semibold ${
                  selectedReason === reason.code ? 'text-white' : 'text-slate-300'
                }`}>
                  {reason.label}
                </span>
                {reason.critical && (
                  <span className="block text-[10px] text-red-400 mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Triggers immediate account lock & legal escalation
                  </span>
                )}
              </div>
              <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                selectedReason === reason.code
                  ? reason.critical
                    ? 'bg-red-500 border-red-500'
                    : 'bg-violet-500 border-violet-500'
                  : 'border-slate-600'
              }`} />
            </button>
          ))}
        </div>

        {/* CSAM Warning Banner */}
        {selectedReason === 'minor-suspected' && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
            <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">CSAM / Minor Safety Escalation</span>
              This will immediately lock the reported account, preserve evidence securely, and escalate past normal moderators to our Legal & Safety compliance team.
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason}
            className={`flex-1 py-3 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              selectedReason === 'minor-suspected'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-lg shadow-red-500/30 hover:shadow-red-500/50'
                : 'btn-glow-rose'
            }`}
          >
            <UserX className="w-4 h-4" />
            Report & Block
          </button>
        </div>
      </div>
    </div>
  );
};
