import React, { useState } from 'react';
import {
  LayoutDashboard, Users, ShieldAlert, Filter, Coins, ScrollText,
  TrendingUp, Video, Globe, AlertTriangle, Eye, Ban, AlertOctagon,
  CheckCircle2, XCircle, ArrowUpRight, X, Plus, Trash2, Lock,
  DollarSign, Activity, BarChart3, Clock, Phone, CreditCard, Search,
  ChevronRight, Edit2, RotateCcw, Award, Menu
} from 'lucide-react';
import { useModeration } from '../context/ModerationContext';
import { useWallet } from '../context/WalletContext';

// ═══════════════════════════════════════════════
// Admin Sidebar Navigation
// ═══════════════════════════════════════════════
const ADMIN_SECTIONS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'moderation', label: 'Moderation Queue', icon: ShieldAlert },
  { key: 'users', label: 'User & Ban Management', icon: Users },
  { key: 'pricing', label: 'Subscription & Pricing', icon: Coins },
  { key: 'keywords', label: 'Keyword Filters', icon: Filter },
  { key: 'audit', label: 'Audit Logs', icon: ScrollText }
];

export const AdminDashboard = () => {
  const {
    usersList, reports, auditLogs, keywordList,
    updateReportStatus, banUser, suspendUser, warnUser, unbanUser,
    getUserReports, addKeyword, removeKeyword
  } = useModeration();

  const {
    coinPacks, filterPrices, addCoinPack, updateCoinPack, deleteCoinPack,
    toggleCoinPackActive, updateFilterPrices, adminGrantCoins
  } = useWallet();

  const [activeSection, setActiveSection] = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionNote, setActionNote] = useState('');

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inspectingUser, setInspectUser] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [suspendHours, setSuspendHours] = useState(24);
  const [grantCoinsAmount, setGrantCoinsAmount] = useState(100);

  // New Subscription Pack Form Modal
  const [showAddPackModal, setShowAddPackModal] = useState(false);
  const [packForm, setPackForm] = useState({
    name: 'Pro Pass Pack',
    amount: 300,
    price: 2.49,
    label: 'Popular',
    badge: '⚡ Deal',
    popular: false
  });

  // Calculate platform metrics
  const activeCount = usersList.filter((u) => u.status === 'active').length;
  const bannedCount = usersList.filter((u) => u.status === 'banned').length;
  const suspendedCount = usersList.filter((u) => u.status === 'suspended').length;
  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReportAction = (reportId, action) => {
    updateReportStatus(reportId, action, 'Admin Master', actionNote || `Action ${action} executed`);
    setSelectedReport(null);
    setActionNote('');
  };

  const handleAddPackSubmit = (e) => {
    e.preventDefault();
    if (!packForm.amount || !packForm.price) return;
    addCoinPack(packForm);
    setShowAddPackModal(false);
    setPackForm({
      name: 'Custom Coin Bundle',
      amount: 400,
      price: 2.99,
      label: 'Special',
      badge: '🔥 Hot',
      popular: false
    });
  };

  const activeSectionObj = ADMIN_SECTIONS.find(s => s.key === activeSection) || ADMIN_SECTIONS[0];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-68px)] bg-[#070913]">
      
      {/* ═══ MOBILE TOP ADMIN BAR ═══ */}
      <div className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-slate-950/95 border-b border-slate-800/90 sticky top-[57px] z-30 backdrop-blur-xl">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-slate-200 hover:text-white border border-slate-800 transition-all text-xs font-bold shadow-sm"
        >
          <Menu className="w-4 h-4 text-rose-400" />
          <span>Admin Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-extrabold tracking-wide uppercase">
            {activeSectionObj.label}
          </span>
        </div>
      </div>

      {/* ═══ MOBILE SLIDE-OUT SIDEBAR OVERLAY DRAWER ═══ */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Dark Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity animate-fade-in"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Drawer Sidebar */}
          <aside className="relative w-72 max-w-[85vw] h-full bg-slate-950 border-r border-slate-800/90 p-4 flex flex-col z-10 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                  <ShieldAlert className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-white block tracking-tight">Admin Console</span>
                  <span className="text-[10px] text-slate-400">Governance & Controls</span>
                </div>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 flex-1">
              {ADMIN_SECTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveSection(key);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeSection === key
                      ? 'bg-gradient-to-r from-rose-500/20 via-purple-500/15 to-amber-500/10 text-white border border-rose-500/30 shadow-md shadow-rose-500/10 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${activeSection === key ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span>{label}</span>
                  {key === 'moderation' && pendingReportsCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                      {pendingReportsCount}
                    </span>
                  )}
                  {key === 'users' && (bannedCount + suspendedCount) > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                      {bannedCount + suspendedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* ═══ DESKTOP LEFT SIDEBAR NAVIGATION ═══ */}
      <aside className="hidden md:flex w-64 shrink-0 glass-panel border-r border-slate-800/80 p-3 flex-col items-stretch gap-1.5">
        <div className="px-3 py-2.5 mb-2 shrink-0 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white block tracking-tight">Admin Console</span>
            <span className="text-[10px] text-slate-400">Governance & Subscriptions</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 w-full">
          {ADMIN_SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeSection === key
                  ? 'bg-gradient-to-r from-rose-500/20 via-purple-500/15 to-amber-500/10 text-white border border-rose-500/30 shadow-md shadow-rose-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${activeSection === key ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>{label}</span>
              {key === 'moderation' && pendingReportsCount > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                  {pendingReportsCount}
                </span>
              )}
              {key === 'users' && (bannedCount + suspendedCount) > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  {bannedCount + suspendedCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl">

        {/* ═══════════════════════════════════════════════ */}
        {/* OVERVIEW SECTION                               */}
        {/* ═══════════════════════════════════════════════ */}
        {activeSection === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Platform Overview</h2>
              <p className="text-xs text-slate-400">Live platform stats, moderation queue status, & subscription activity</p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="glass-panel rounded-2xl p-4 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                    {activeCount} Active
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-white">{usersList.length}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Total Registered Accounts</p>
              </div>

              <div className="glass-panel rounded-2xl p-4 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
                    <Ban className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400">
                    {bannedCount} Banned
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-white">{bannedCount + suspendedCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Restricted / Suspended Users</p>
              </div>

              <div className="glass-panel rounded-2xl p-4 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                    <Coins className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                    {coinPacks.filter((p) => p.active).length} Active Plans
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-amber-400">{coinPacks.length}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Managed Subscription Packs</p>
              </div>

              <div className="glass-panel rounded-2xl p-4 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                    +18.4%
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-white">$28,450</p>
                <p className="text-[11px] text-slate-400 mt-0.5">30-Day Subscription Revenue</p>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-400" />
                    User Governance Overview
                  </h3>
                  <button onClick={() => setActiveSection('users')} className="text-xs text-violet-400 hover:text-violet-300 font-semibold">
                    Manage Users →
                  </button>
                </div>
                <div className="space-y-2.5">
                  {usersList.slice(0, 4).map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700" />
                        <div>
                          <p className="text-xs font-semibold text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email} • {u.country}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        u.status === 'warned' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                        u.status === 'suspended' ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30' :
                        'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        {u.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    Active Subscription Packages
                  </h3>
                  <button onClick={() => setActiveSection('pricing')} className="text-xs text-amber-400 hover:text-amber-300 font-semibold">
                    Pricing Config →
                  </button>
                </div>
                <div className="space-y-2.5">
                  {coinPacks.map((pack) => (
                    <div key={pack.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                      <div>
                        <span className="text-xs font-bold text-white">{pack.name || pack.label}</span>
                        <span className="text-[10px] text-slate-400 block">{pack.amount.toLocaleString()} Coins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-amber-400">${pack.price}</span>
                        <span className={`w-2 h-2 rounded-full ${pack.active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* MODERATION QUEUE SECTION                       */}
        {/* ═══════════════════════════════════════════════ */}
        {activeSection === 'moderation' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Moderation & Reports Queue</h2>
              <p className="text-xs text-slate-400">Review reported user sessions and take disciplinary actions</p>
            </div>

            <div className="space-y-3">
              {reports.map((report) => {
                const isCritical = report.reasonCode === 'minor-suspected';
                const isExpanded = selectedReport === report.id;

                return (
                  <div
                    key={report.id}
                    className={`glass-panel rounded-2xl border overflow-hidden transition-all ${
                      isCritical ? 'border-red-500/40 bg-red-950/20' : 'border-slate-800/70'
                    }`}
                  >
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-800/30 transition-all"
                      onClick={() => setSelectedReport(isExpanded ? null : report.id)}
                    >
                      {isCritical && (
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                          <AlertOctagon className="w-4 h-4 text-red-400" />
                        </div>
                      )}

                      <img src={report.reportedAvatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{report.reportedName}</p>
                          <span className="text-[10px] text-slate-400 font-mono">({report.reportedId})</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {report.reasonLabel} • Reported by {report.reporterName}
                        </p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 uppercase ${
                        report.status === 'pending' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                        report.status === 'escalated' ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                        report.status === 'dismissed' ? 'bg-slate-700/50 text-slate-400 border border-slate-700' :
                        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      }`}>
                        {report.status}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-800/40 pt-3 space-y-3 bg-slate-950/40">
                        <p className="text-xs text-slate-300">{report.notes}</p>

                        <div>
                          <label className="text-[10px] text-slate-400 mb-1 block font-semibold">Action Audit Note</label>
                          <input
                            type="text"
                            value={actionNote}
                            onChange={(e) => setActionNote(e.target.value)}
                            placeholder="Reason or notes for audit trail..."
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => handleReportAction(report.id, 'dismiss')}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                          >
                            Dismiss Report
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'warn')}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/30"
                          >
                            Issue Warning
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'suspend')}
                            className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-medium border border-orange-500/30"
                          >
                            Suspend User
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'ban')}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30"
                          >
                            Ban User Permanently
                          </button>
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
        {/* USER & BAN MANAGEMENT SECTION                   */}
        {/* ═══════════════════════════════════════════════ */}
        {activeSection === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header + Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">User & Ban Management</h2>
                <p className="text-xs text-slate-400">View user history, file reports review, ban/unban accounts & grant coins</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, email or ID..."
                    className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 w-64"
                  />
                </div>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-fit">
              {[
                { key: 'all', label: `All Users (${usersList.length})` },
                { key: 'active', label: `Active (${activeCount})` },
                { key: 'warned', label: 'Warned' },
                { key: 'suspended', label: `Suspended (${suspendedCount})` },
                { key: 'banned', label: `Banned (${bannedCount})` }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === key
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* User Directory Table */}
            <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/60">
                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">User Profile</th>
                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">Account Status</th>
                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">Country & Gender</th>
                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">Reports History</th>
                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">Coin Balance</th>
                    <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-all">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-800" />
                          <div>
                            <p className="text-xs font-bold text-white">{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.email} • <span className="font-mono text-slate-500">{u.id}</span></p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          u.status === 'active' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                          u.status === 'warned' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                          u.status === 'suspended' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' :
                          'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}>
                          {u.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-300">
                        {u.country} • <span className="capitalize">{u.gender}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            u.reports > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {u.reports || 0} Reports
                          </span>
                          {u.warningCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                              ⚠️ {u.warningCount} W
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs font-bold text-amber-400">
                        {u.coins || 0} Coins
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setInspectUser(u)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-all inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-violet-400" />
                          View History & Actions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* SUBSCRIPTION & PRICING MANAGER                  */}
        {/* ═══════════════════════════════════════════════ */}
        {activeSection === 'pricing' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">Subscription & Pricing Manager</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
                    Live Dynamic Ledger
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Manage subscription tiers, call rates, coin package prices, and in-app filter unlock costs.</p>
              </div>

              <button
                onClick={() => setShowAddPackModal(true)}
                className="px-4 py-2.5 rounded-xl btn-glow-purple text-white text-xs font-bold flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Add New Subscription Package
              </button>
            </div>

            {/* ═══ LIVE CALL RATE CONTROLLER CARD ═══ */}
            <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-slate-950 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>Live 1:1 Call Rate Controller</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        App-Wide Sync
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Configure the coin cost for 1:1 video calls and session extensions. Changes apply instantly to video match buttons and landing page badges.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 shrink-0">
                  <div className="text-center">
                    <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">Match Call Rate</label>
                    <div className="flex items-center gap-1.5 justify-center">
                      <input
                        type="number"
                        value={filterPrices.match || 80}
                        onChange={(e) => updateFilterPrices('match', e.target.value)}
                        className="w-20 bg-slate-900 border-2 border-amber-500/50 rounded-xl px-2 py-1.5 text-base font-extrabold text-amber-400 text-center focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-xs text-amber-300 font-bold">Coins</span>
                    </div>
                  </div>

                  <div className="h-9 w-px bg-slate-800" />

                  <div className="text-center">
                    <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Extension Rate</label>
                    <div className="flex items-center gap-1.5 justify-center">
                      <input
                        type="number"
                        value={filterPrices.extendCall || 20}
                        onChange={(e) => updateFilterPrices('extendCall', e.target.value)}
                        className="w-20 bg-slate-900 border-2 border-cyan-500/50 rounded-xl px-2 py-1.5 text-base font-extrabold text-cyan-300 text-center focus:outline-none focus:border-cyan-400"
                      />
                      <span className="text-xs text-cyan-300 font-bold">Coins/min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coin Package Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {coinPacks.map((pack) => (
                <div
                  key={pack.id}
                  className={`glass-panel rounded-2xl p-5 border flex flex-col justify-between relative transition-all ${
                    pack.popular || pack.badge ? 'border-amber-500/40 shadow-lg shadow-amber-500/10' : 'border-slate-800/80'
                  }`}
                >
                  {pack.badge && (
                    <span className="absolute -top-3 right-4 px-2.5 py-0.5 text-[9px] font-extrabold rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md">
                      {pack.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-slate-500">{pack.id}</span>
                      <button
                        onClick={() => toggleCoinPackActive(pack.id)}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          pack.active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {pack.active ? '● Active' : 'Disabled'}
                      </button>
                    </div>

                    <input
                      type="text"
                      value={pack.name || pack.label}
                      onChange={(e) => updateCoinPack(pack.id, { name: e.target.value })}
                      className="text-base font-bold text-white bg-transparent border-b border-slate-700/60 focus:border-amber-400 focus:outline-none w-full mb-2"
                    />

                    <div className="flex items-baseline gap-1 my-2">
                      <Coins className="w-5 h-5 text-amber-400 shrink-0" />
                      <input
                        type="number"
                        value={pack.amount}
                        onChange={(e) => updateCoinPack(pack.id, { amount: Number(e.target.value) })}
                        className="text-2xl font-extrabold text-amber-400 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 w-28 focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-xs text-slate-400">coins</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-semibold">USD Price</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-emerald-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={pack.price}
                          onChange={(e) => updateCoinPack(pack.id, { price: Number(e.target.value) })}
                          className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-400 font-bold focus:outline-none focus:border-amber-400 text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => deleteCoinPack(pack.id)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Pack
                      </button>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ${(pack.price / (pack.amount || 1)).toFixed(4)}/coin
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Unlock Prices */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  In-App Feature Costs (Coin Deductions)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Define coin fees charged to users for matching and unlocking filters</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'match', title: '1:1 Match Fee', desc: 'Coins deducted per stranger call', icon: Video },
                  { key: 'gender', title: 'Gender Filter', desc: 'Unlock female / male stranger match', icon: Users },
                  { key: 'location', title: 'Region Filter', desc: 'Filter strangers by country', icon: Globe },
                  { key: 'extendCall', title: 'Extend Call', desc: 'Add extra minute to call', icon: Clock }
                ].map((feat) => (
                  <div key={feat.key} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <feat.icon className="w-3.5 h-3.5 text-violet-400" />
                        {feat.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{feat.desc}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <span className="text-[11px] text-slate-400 font-medium">Cost:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={filterPrices[feat.key] || 50}
                          onChange={(e) => updateFilterPrices(feat.key, e.target.value)}
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-amber-400 font-bold text-center focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-[10px] text-amber-400 font-bold">Coins</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* KEYWORD FILTER CONFIG                          */}
        {/* ═══════════════════════════════════════════════ */}
        {activeSection === 'keywords' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Profanity / Keyword Filter Config</h2>
              <p className="text-xs text-slate-400">Manage real-time blocked keywords in stranger text messages</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add a blocked keyword..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newKeyword.trim()) {
                    addKeyword(newKeyword.trim());
                    setNewKeyword('');
                  }
                }}
              />
              <button
                onClick={() => { if (newKeyword.trim()) { addKeyword(newKeyword.trim()); setNewKeyword(''); } }}
                className="px-5 py-2.5 rounded-xl btn-glow-purple text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Keyword
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {keywordList.map((kw) => (
                <div
                  key={kw}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300"
                >
                  <span>{kw}</span>
                  <button onClick={() => removeKeyword(kw)} className="text-slate-500 hover:text-rose-400 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* AUDIT LOGS                                     */}
        {/* ═══════════════════════════════════════════════ */}
        {activeSection === 'audit' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">System Audit Logs</h2>
              <p className="text-xs text-slate-400">Immutable governance ledger recording admin actions</p>
            </div>

            <div className="space-y-2">
              {auditLogs.map((log) => {
                const isCritical = log.action.includes('BAN') || log.action.includes('CSAM');

                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border ${
                      isCritical ? 'bg-red-950/20 border-red-500/30' : 'glass-panel border-slate-800/60'
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
                          isCritical ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400">Target: {log.targetUserId}</span>
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

      {/* ═══════════════════════════════════════════════ */}
      {/* USER DETAIL & HISTORY MODAL DRAWER              */}
      {/* ═══════════════════════════════════════════════ */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm p-2 sm:p-4">
          <div className="w-full max-w-lg h-full max-h-[92vh] glass-panel rounded-3xl p-6 border border-slate-800 overflow-y-auto flex flex-col justify-between shadow-2xl relative animate-fadeIn">
            
            <button
              onClick={() => setInspectUser(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              {/* Header Profile Info */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-800/80">
                <img src={inspectingUser.avatar} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-violet-500/50" />
                <div>
                  <h3 className="text-lg font-bold text-white">{inspectingUser.name}</h3>
                  <p className="text-xs text-slate-400">{inspectingUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-500">{inspectingUser.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                      inspectingUser.status === 'active' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                      inspectingUser.status === 'warned' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                      inspectingUser.status === 'suspended' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' :
                      'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}>
                      {inspectingUser.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-semibold block">Country & Gender</span>
                  <span className="text-xs text-white font-medium">{inspectingUser.country} • {inspectingUser.gender}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-semibold block">Coin Balance</span>
                  <span className="text-xs text-amber-400 font-extrabold">{inspectingUser.coins || 0} Coins</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-semibold block">Warning Count</span>
                  <span className="text-xs text-slate-300 font-bold">{inspectingUser.warningCount || 0} Warnings</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-semibold block">Join Date</span>
                  <span className="text-xs text-slate-300">{inspectingUser.joinDate}</span>
                </div>
              </div>

              {/* Ban / Suspension Details if present */}
              {inspectingUser.banReason && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 mb-4 text-xs text-rose-300">
                  <span className="font-bold block mb-0.5">Restriction Reason:</span>
                  {inspectingUser.banReason}
                </div>
              )}

              {/* Report History Timeline */}
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Report History ({getUserReports(inspectingUser.id).length})</span>
                </h4>

                {getUserReports(inspectingUser.id).length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-950 text-center">
                    No reports filed against or by this user.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {getUserReports(inspectingUser.id).map((rep) => (
                      <div key={rep.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono">{rep.id} • Session {rep.sessionId}</span>
                          <span>{new Date(rep.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="font-semibold text-rose-300">{rep.reasonLabel}</p>
                        <p className="text-[11px] text-slate-300">{rep.notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Action Controls */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Admin Actions</h4>

                <div>
                  <input
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Reason for ban / suspension / warning..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 mb-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {inspectingUser.status !== 'banned' ? (
                    <button
                      onClick={() => {
                        banUser(inspectingUser.id, actionReason || 'Banned by admin', 'Admin Master');
                        setInspectUser({ ...inspectingUser, status: 'banned', banReason: actionReason || 'Banned by admin' });
                        setActionReason('');
                      }}
                      className="py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center justify-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" /> Ban Permanently
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        unbanUser(inspectingUser.id, 'Admin Master');
                        setInspectUser({ ...inspectingUser, status: 'active', banReason: null });
                      }}
                      className="py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Unban Account
                    </button>
                  )}

                  <button
                    onClick={() => {
                      suspendUser(inspectingUser.id, suspendHours, actionReason || 'Suspended by admin', 'Admin Master');
                      setInspectUser({ ...inspectingUser, status: 'suspended', banReason: actionReason || 'Suspended by admin' });
                      setActionReason('');
                    }}
                    className="py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-bold border border-orange-500/30 flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" /> Suspend 24h
                  </button>
                </div>

                {/* Grant Coins Action */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <input
                      type="number"
                      value={grantCoinsAmount}
                      onChange={(e) => setGrantCoinsAmount(Number(e.target.value))}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-bold text-center"
                    />
                    <span className="text-xs text-slate-400">Coins</span>
                  </div>
                  <button
                    onClick={() => {
                      adminGrantCoins(inspectingUser.id, grantCoinsAmount, 'Admin Balance Adjustment');
                      setInspectUser({ ...inspectingUser, coins: (inspectingUser.coins || 0) + grantCoinsAmount });
                      alert(`Granted ${grantCoinsAmount} coins to ${inspectingUser.name}`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                  >
                    Grant Coins
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ADD SUBSCRIPTION PACKAGE MODAL                  */}
      {/* ═══════════════════════════════════════════════ */}
      {showAddPackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-amber-500/20 shadow-2xl relative">
            
            <button
              onClick={() => setShowAddPackModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              Create Subscription / Coin Package
            </h3>
            <p className="text-xs text-slate-400 mb-4">Define pack details for live landing page & wallet showcase</p>

            <form onSubmit={handleAddPackSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Package Name</label>
                <input
                  type="text"
                  value={packForm.name}
                  onChange={(e) => setPackForm({ ...packForm, name: e.target.value })}
                  placeholder="e.g. VIP Mega Pack"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Coin Amount</label>
                  <input
                    type="number"
                    value={packForm.amount}
                    onChange={(e) => setPackForm({ ...packForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={packForm.price}
                    onChange={(e) => setPackForm({ ...packForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Badge Text (Optional)</label>
                <input
                  type="text"
                  value={packForm.badge}
                  onChange={(e) => setPackForm({ ...packForm, badge: e.target.value })}
                  placeholder="e.g. Best Value, VIP Bonus"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPackModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Create Package
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
