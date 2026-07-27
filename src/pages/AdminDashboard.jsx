import React, { useState } from 'react';
import {
  LayoutDashboard, Users, ShieldAlert, Filter, Coins, ScrollText,
  TrendingUp, Video, Globe, AlertTriangle, Eye, Ban, AlertOctagon,
  CheckCircle2, XCircle, ArrowUpRight, X, Plus, Trash2, Lock,
  DollarSign, Activity, BarChart3, Clock, Phone
} from 'lucide-react';
import { useModeration } from '../context/ModerationContext';

// ═══════════════════════════════════════════════
// Admin Sidebar Navigation
// ═══════════════════════════════════════════════
const ADMIN_SECTIONS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'moderation', label: 'Moderation Queue', icon: ShieldAlert },
  { key: 'users', label: 'User Management', icon: Users },
  { key: 'keywords', label: 'Keyword Filters', icon: Filter },
  { key: 'pricing', label: 'Coin Pricing', icon: Coins },
  { key: 'audit', label: 'Audit Logs', icon: ScrollText }
];

// ═══════════════════════════════════════════════
// Simulated Platform Analytics
// ═══════════════════════════════════════════════
const ANALYTICS = {
  dau: 12847,
  mau: 89230,
  activeCalls: 1432,
  totalReports24h: 47,
  revenue30d: 28450,
  avgCallDuration: '3m 42s',
  matchSuccessRate: '94.2%',
  reportResolution: '98.1%'
};

const MOCK_USERS = [
  { id: 'usr-88329', name: 'Alex Vance', status: 'active', gender: 'non-binary', country: 'United States', reports: 0, coins: 450, joinDate: '2025-12-01' },
  { id: 'usr-33104', name: 'Unknown User #33104', status: 'suspended', gender: 'male', country: 'Brazil', reports: 3, coins: 0, joinDate: '2026-01-15' },
  { id: 'usr-55102', name: 'Banned Account', status: 'banned', gender: 'male', country: 'Russia', reports: 12, coins: 0, joinDate: '2026-02-20' },
  { id: 'usr-11029', name: 'Jordan Lee', status: 'active', gender: 'female', country: 'South Korea', reports: 0, coins: 1200, joinDate: '2026-03-05' },
  { id: 'usr-99210', name: 'Account #99210', status: 'banned', gender: 'male', country: 'Unknown', reports: 1, coins: 0, joinDate: '2026-06-01' }
];

const COIN_PRICING_CONFIG = [
  { id: 'pack-100', amount: 100, price: 0.99 },
  { id: 'pack-500', amount: 500, price: 3.99 },
  { id: 'pack-1000', amount: 1000, price: 6.99 },
  { id: 'pack-5000', amount: 5000, price: 24.99 }
];

export const AdminDashboard = () => {
  const { reports, auditLogs, keywordList, updateReportStatus, addKeyword, removeKeyword } = useModeration();

  const [activeSection, setActiveSection] = useState('overview');
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionNote, setActionNote] = useState('');

  // ═══ REPORT ACTION HANDLER ═══
  const handleReportAction = (reportId, action) => {
    updateReportStatus(reportId, action, 'Admin User', actionNote || `Action: ${action}`);
    setSelectedReport(null);
    setActionNote('');
  };

  // ═══ RENDER ═══
  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      
      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside className="w-56 shrink-0 glass-panel border-r border-slate-800/60 p-3 space-y-1">
        <div className="px-3 py-2 mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span className="text-sm font-bold text-white">Admin Panel</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Trust & Safety Controls</p>
        </div>

        {ADMIN_SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeSection === key
                ? 'bg-gradient-to-r from-rose-500/15 to-amber-500/10 text-white border border-rose-500/25 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === 'moderation' && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold border border-rose-500/30">
                {reports.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </aside>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <main className="flex-1 p-6 overflow-y-auto">

        {/* ═══════════════════════════════════════════════ */}
        {/* OVERVIEW SECTION                               */}
        {/* ═══════════════════════════════════════════════ */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Platform Overview</h2>
              <p className="text-xs text-slate-400">Real-time analytics & health metrics</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Daily Active Users', value: ANALYTICS.dau.toLocaleString(), icon: Users, color: 'violet', delta: '+12.3%' },
                { label: 'Active Calls Now', value: ANALYTICS.activeCalls.toLocaleString(), icon: Phone, color: 'emerald', delta: 'Live' },
                { label: 'Reports (24h)', value: ANALYTICS.totalReports24h, icon: ShieldAlert, color: 'rose', delta: '-8.1%' },
                { label: 'Revenue (30d)', value: `$${ANALYTICS.revenue30d.toLocaleString()}`, icon: DollarSign, color: 'amber', delta: '+22.5%' }
              ].map(({ label, value, icon: Icon, color, delta }, idx) => (
                <div key={idx} className="glass-panel rounded-2xl p-4 border border-slate-800/60">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl bg-${color}-500/15 flex items-center justify-center`}
                         style={{ backgroundColor: `var(--accent-${color === 'violet' ? 'purple' : color}, rgba(139,92,246,0.15))`.replace('var(--accent-purple, ', '').replace(')', '') + '26' }}>
                      <Icon className="w-4.5 h-4.5" style={{ color: `var(--accent-${color === 'violet' ? 'purple' : color})` }} />
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      delta.startsWith('+') ? 'bg-emerald-500/15 text-emerald-400' :
                      delta.startsWith('-') ? 'bg-rose-500/15 text-rose-400' :
                      'bg-cyan-500/15 text-cyan-400'
                    }`}>
                      {delta}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'MAU', value: ANALYTICS.mau.toLocaleString(), icon: TrendingUp },
                { label: 'Avg. Call Duration', value: ANALYTICS.avgCallDuration, icon: Clock },
                { label: 'Match Success Rate', value: ANALYTICS.matchSuccessRate, icon: Activity },
                { label: 'Report Resolution', value: ANALYTICS.reportResolution, icon: CheckCircle2 }
              ].map(({ label, value, icon: Icon }, idx) => (
                <div key={idx} className="glass-panel rounded-xl p-3 border border-slate-800/40 flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-sm font-bold text-white">{value}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Reports Preview */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Recent Reports
                </h3>
                <button onClick={() => setActiveSection('moderation')} className="text-[10px] text-violet-400 hover:text-violet-300 font-medium">
                  View All →
                </button>
              </div>
              <div className="space-y-2">
                {reports.slice(0, 3).map((report) => (
                  <div key={report.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/40">
                    <img src={report.reportedAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{report.reportedName}</p>
                      <p className="text-[10px] text-slate-400">{report.reasonLabel}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      report.status === 'pending' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                      report.status === 'escalated' ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                      report.status === 'dismissed' ? 'bg-slate-700/50 text-slate-400 border border-slate-700' :
                      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    }`}>
                      {report.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* MODERATION QUEUE SECTION                       */}
        {/* ═══════════════════════════════════════════════ */}
        {activeSection === 'moderation' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Moderation Queue</h2>
              <p className="text-xs text-slate-400">Review & action user reports. CSAM reports are highlighted in red.</p>
            </div>

            <div className="space-y-3">
              {reports.map((report) => {
                const isCritical = report.reasonCode === 'minor-suspected';
                const isExpanded = selectedReport === report.id;

                return (
                  <div
                    key={report.id}
                    className={`glass-panel rounded-2xl border overflow-hidden transition-all ${
                      isCritical
                        ? 'border-red-500/40 bg-red-950/20'
                        : 'border-slate-800/60'
                    }`}
                  >
                    {/* Report Header Row */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-800/30 transition-all"
                      onClick={() => setSelectedReport(isExpanded ? null : report.id)}
                    >
                      {/* Critical indicator */}
                      {isCritical && (
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                          <AlertOctagon className="w-4 h-4 text-red-400" />
                        </div>
                      )}

                      <img src={report.reportedAvatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{report.reportedName}</p>
                          {isCritical && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold border border-red-500/30">
                              CSAM / MINOR RISK
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {report.reasonLabel} • Reported by {report.reporterName}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(report.timestamp).toLocaleString()} • Session: {report.sessionId}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                        report.status === 'pending' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                        report.status === 'escalated' ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                        report.status === 'dismissed' ? 'bg-slate-700/50 text-slate-400 border border-slate-700' :
                        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      }`}>
                        {report.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-800/40 pt-3 space-y-3">
                        <p className="text-xs text-slate-300">{report.notes}</p>

                        {/* CSAM Warning */}
                        {isCritical && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                            <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block mb-0.5">CSAM / Minor Safety Protocol Active</span>
                              Account is frozen. Evidence preserved for legal authority export. This report bypasses normal moderation and requires Senior Safety Officer review.
                            </div>
                          </div>
                        )}

                        {/* Admin Note */}
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">Admin Action Note</label>
                          <input
                            type="text"
                            value={actionNote}
                            onChange={(e) => setActionNote(e.target.value)}
                            placeholder="Add a note for the audit log..."
                            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {report.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleReportAction(report.id, 'dismiss')}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-medium hover:bg-slate-700 border border-slate-700 transition-all"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Dismiss
                              </button>
                              <button
                                onClick={() => handleReportAction(report.id, 'warn')}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 text-amber-300 text-[11px] font-medium hover:bg-amber-500/25 border border-amber-500/30 transition-all"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" /> Warn User
                              </button>
                              <button
                                onClick={() => handleReportAction(report.id, 'suspend')}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500/15 text-orange-300 text-[11px] font-medium hover:bg-orange-500/25 border border-orange-500/30 transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" /> Suspend
                              </button>
                              <button
                                onClick={() => handleReportAction(report.id, 'ban')}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/15 text-rose-300 text-[11px] font-medium hover:bg-rose-500/25 border border-rose-500/30 transition-all"
                              >
                                <Ban className="w-3.5 h-3.5" /> Ban
                              </button>
                              {isCritical && (
                                <button
                                  onClick={() => handleReportAction(report.id, 'escalate')}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-500 border border-red-500 transition-all shadow-lg shadow-red-500/30"
                                >
                                  <AlertOctagon className="w-3.5 h-3.5" /> Escalate to Legal / NCMEC
                                </button>
                              )}
                            </>
                          )}
                          {report.status !== 'pending' && (
                            <span className="text-[11px] text-slate-500 italic">
                              Action already taken: {report.actionTaken || report.status}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* USER MANAGEMENT SECTION                        */}
        {/* ═══════════════════════════════════════════════ */}
        {activeSection === 'users' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">User Management</h2>
              <p className="text-xs text-slate-400">View and manage registered platform users</p>
            </div>

            <div className="glass-panel rounded-2xl border border-slate-800/60 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">User</th>
                    <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Gender</th>
                    <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Country</th>
                    <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Reports</th>
                    <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Coins</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_USERS.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-all">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-white">{u.name}</p>
                        <p className="text-[10px] text-slate-500">{u.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                          u.status === 'suspended' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                          'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                        }`}>
                          {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300 capitalize">{u.gender}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">{u.country}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">{u.reports}</td>
                      <td className="px-4 py-3 text-xs text-amber-400 font-medium">{u.coins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* KEYWORD FILTER CONFIG                          */}
        {/* ═══════════════════════════════════════════════ */}
        {activeSection === 'keywords' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Profanity / Keyword Filter Config</h2>
              <p className="text-xs text-slate-400">Manage blocked keywords for real-time text chat filtering</p>
            </div>

            {/* Add Keyword */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add a blocked keyword..."
                className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newKeyword.trim()) {
                    addKeyword(newKeyword.trim());
                    setNewKeyword('');
                  }
                }}
              />
              <button
                onClick={() => { if (newKeyword.trim()) { addKeyword(newKeyword.trim()); setNewKeyword(''); } }}
                className="px-5 py-2.5 rounded-xl btn-glow-purple text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Keyword List */}
            <div className="flex flex-wrap gap-2">
              {keywordList.map((kw) => (
                <div
                  key={kw}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 group"
                >
                  <span>{kw}</span>
                  <button
                    onClick={() => removeKeyword(kw)}
                    className="text-slate-500 hover:text-rose-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-500">
              {keywordList.length} keywords active. Matches are replaced with *** in real-time before message delivery.
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* COIN PRICING CONFIG                            */}
        {/* ═══════════════════════════════════════════════ */}
        {activeSection === 'pricing' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Section Header with Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">Coin Pricing & Economy Config</h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    Live Server Ledger
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Configure coin package pricing, discounts, and in-app filter unlocking costs.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Pricing configuration deployed to live production ledger!')}
                  className="px-4 py-2 rounded-xl btn-glow-purple text-white text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save & Deploy Config
                </button>
              </div>
            </div>

            {/* Economy KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="glass-panel rounded-2xl p-4 border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Projected Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-extrabold text-white">$34,890</p>
                <p className="text-[10px] text-emerald-400 mt-1">+18.4% vs last month</p>
              </div>

              <div className="glass-panel rounded-2xl p-4 border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Top Selling Pack</span>
                  <Coins className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-extrabold text-amber-400">500 Coins</p>
                <p className="text-[10px] text-slate-400 mt-1">42% of total coin volume</p>
              </div>

              <div className="glass-panel rounded-2xl p-4 border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Spend / User</span>
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-2xl font-extrabold text-white">$8.40</p>
                <p className="text-[10px] text-cyan-400 mt-1">ARPPU across active buyers</p>
              </div>

              <div className="glass-panel rounded-2xl p-4 border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Filter Unlock Rate</span>
                  <Activity className="w-4 h-4 text-violet-400" />
                </div>
                <p className="text-2xl font-extrabold text-white">68.2%</p>
                <p className="text-[10px] text-violet-300 mt-1">Gender filter most unlocked</p>
              </div>
            </div>

            {/* Coin Package Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Active In-App Purchase Packages
                </h3>
                <span className="text-[11px] text-slate-400">4 Packages Active</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'pack-100', name: 'Starter Pack', coins: 100, price: 0.99, badge: null, popular: false, active: true },
                  { id: 'pack-500', name: 'Popular Pack', coins: 500, price: 3.99, badge: '⭐ Best Value', popular: true, active: true },
                  { id: 'pack-1000', name: 'Premium Pack', coins: 1000, price: 6.99, badge: '🔥 Most Popular', popular: false, active: true },
                  { id: 'pack-5000', name: 'VIP Bundle', coins: 5000, price: 24.99, badge: '💎 VIP Bonus', popular: false, active: true }
                ].map((pack) => (
                  <div
                    key={pack.id}
                    className={`relative glass-panel rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                      pack.popular
                        ? 'border-amber-500/40 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/20'
                        : 'border-slate-800/60'
                    }`}
                  >
                    {pack.badge && (
                      <span className="absolute -top-3 right-4 px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md">
                        {pack.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-slate-500">{pack.id}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                      </div>

                      <h4 className="text-base font-bold text-white mb-1">{pack.name}</h4>

                      <div className="flex items-baseline gap-1 my-3">
                        <Coins className="w-6 h-6 text-amber-400 shrink-0" />
                        <span className="text-3xl font-extrabold text-amber-400">{pack.coins.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 font-medium">coins</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Price (USD)</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-emerald-400 font-bold">$</span>
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={pack.price}
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-400 font-bold focus:outline-none focus:border-amber-400 text-right"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Cost / Coin</span>
                        <span className="font-mono text-slate-300">${(pack.price / pack.coins).toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In-App Feature Costs & Unlock Rules */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/60 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  Feature Unlock Pricing (Coin Deductions)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Set how many coins are spent when users unlock filters or extend calls.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'gender', title: 'Gender Filter', desc: 'Unlock female / male stranger matching', defaultCoins: 50, icon: Users, color: 'violet' },
                  { key: 'location', title: 'Region Filter', desc: 'Filter strangers by country', defaultCoins: 100, icon: Globe, color: 'cyan' },
                  { key: 'extend', title: 'Extend Call (per min)', desc: 'Add extra minute to active call', defaultCoins: 20, icon: Clock, color: 'emerald' }
                ].map((feat) => (
                  <div key={feat.key} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <feat.icon className="w-4 h-4 text-violet-400" />
                          {feat.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">{feat.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <span className="text-[11px] text-slate-400">Unlock Cost:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          defaultValue={feat.defaultCoins}
                          className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-400 text-center"
                        />
                        <span className="text-xs text-amber-400 font-medium">Coins</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* AUDIT LOGS                                     */}
        {/* ═══════════════════════════════════════════════ */}
        {activeSection === 'audit' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Audit Logs</h2>
              <p className="text-xs text-slate-400">Immutable record of all admin actions and system events</p>
            </div>

            <div className="space-y-2">
              {auditLogs.map((log) => {
                const isCritical = log.action.includes('CSAM') || log.action.includes('BAN');

                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border ${
                      isCritical
                        ? 'bg-red-950/20 border-red-500/25'
                        : 'glass-panel border-slate-800/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isCritical ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <ScrollText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                          isCritical ? 'bg-red-500/15 text-red-400' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-500">→ {log.targetUserId}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{log.reason}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        By: {log.adminId} • {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
