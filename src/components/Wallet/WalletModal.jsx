import React, { useState } from 'react';
import { Coins, X, ShoppingCart, ArrowUpRight, ArrowDownLeft, RefreshCw, CheckCircle2, CreditCard, Wallet, History } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export const WalletModal = ({ isOpen, onClose }) => {
  const { balance, transactions, purchaseCoins, spendCoins, unlockedFilters, FILTER_PRICES, coinPacks } = useWallet();
  const [tab, setTab] = useState('buy'); // buy | history | filters
  const [purchasing, setPurchasing] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  if (!isOpen) return null;

  const handlePurchase = async (pack) => {
    setPurchasing(pack.id);
    await purchaseCoins(pack.amount, pack.price, 'Stripe');
    setPurchasing(null);
    setPurchaseSuccess(pack.amount);
    setTimeout(() => setPurchaseSuccess(null), 2500);
  };

  const handleUnlockFilter = (filterKey) => {
    const result = spendCoins(filterKey, `Unlocked ${filterKey} filter for matchmaking`);
    if (!result.success) {
      alert(`Insufficient coins! You need ${result.costRequired} coins but have ${balance}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl overflow-y-auto max-h-[90vh] border border-amber-500/15 shadow-2xl no-scrollbar">
        
        {/* Ambient glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800/60">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/60 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Wallet className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Coin Wallet</h3>
              <p className="text-xs text-slate-400">Server-authoritative balance ledger</p>
            </div>
          </div>

          {/* Balance Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-amber-400/70 uppercase tracking-wider font-semibold">Current Balance</p>
                <p className="text-3xl font-extrabold text-amber-400 mt-0.5 flex items-center gap-2">
                  <Coins className="w-7 h-7" />
                  {balance.toLocaleString()}
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <p>{transactions.length} transactions</p>
                <p className="text-emerald-400 font-medium">✓ Verified</p>
              </div>
            </div>
          </div>

          {/* Success toast */}
          {purchaseSuccess && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              +{purchaseSuccess} coins added to your wallet!
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4 bg-slate-900/80 p-1 rounded-full border border-slate-800">
            {[
              { key: 'buy', label: 'Buy Coins', icon: ShoppingCart },
              { key: 'filters', label: 'Unlock Filters', icon: CreditCard },
              { key: 'history', label: 'History', icon: History }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  tab === key
                    ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 py-4 max-h-[380px] overflow-y-auto">

          {/* BUY COINS TAB */}
          {tab === 'buy' && (
            <div className="grid grid-cols-2 gap-3">
              {(coinPacks || []).filter((p) => p.active).map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => handlePurchase(pack)}
                  disabled={purchasing === pack.id}
                  className="relative glass-panel-interactive rounded-2xl p-4 border border-slate-800/60 text-left group"
                >
                  {pack.badge && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {pack.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <span className="text-lg font-bold text-white">{pack.amount.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">{pack.name || pack.label}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-400">${pack.price}</span>
                    {purchasing === pack.id ? (
                      <span className="text-[10px] text-violet-400 animate-pulse">Processing…</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 group-hover:text-violet-400 transition-all">Buy →</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* UNLOCK FILTERS TAB */}
          {tab === 'filters' && (
            <div className="space-y-3">
              {/* Gender Filter */}
              <div className={`glass-panel rounded-2xl p-4 border flex items-center justify-between ${
                unlockedFilters.gender ? 'border-emerald-500/30' : 'border-slate-800/60'
              }`}>
                <div>
                  <p className="text-sm font-semibold text-white">Gender Filter</p>
                  <p className="text-[11px] text-slate-400">Match only female, male, or non-binary strangers</p>
                  <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    {FILTER_PRICES.gender} coins
                  </p>
                </div>
                {unlockedFilters.gender ? (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30">
                    ✓ Unlocked
                  </span>
                ) : (
                  <button
                    onClick={() => handleUnlockFilter('gender')}
                    className="px-4 py-2 rounded-xl btn-glow-purple text-white text-xs font-semibold"
                  >
                    Unlock
                  </button>
                )}
              </div>

              {/* Location Filter */}
              <div className={`glass-panel rounded-2xl p-4 border flex items-center justify-between ${
                unlockedFilters.location ? 'border-emerald-500/30' : 'border-slate-800/60'
              }`}>
                <div>
                  <p className="text-sm font-semibold text-white">Location / Region Filter</p>
                  <p className="text-[11px] text-slate-400">Match strangers from specific countries</p>
                  <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    {FILTER_PRICES.location} coins
                  </p>
                </div>
                {unlockedFilters.location ? (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30">
                    ✓ Unlocked
                  </span>
                ) : (
                  <button
                    onClick={() => handleUnlockFilter('location')}
                    className="px-4 py-2 rounded-xl btn-glow-purple text-white text-xs font-semibold"
                  >
                    Unlock
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TRANSACTION HISTORY TAB */}
          {tab === 'history' && (
            <div className="space-y-2">
              {transactions.length === 0 && (
                <p className="text-center text-xs text-slate-500 py-8">No transactions yet.</p>
              )}
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/40"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'purchase'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : tx.type === 'refund'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {tx.type === 'purchase' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : tx.type === 'refund' ? (
                      <RefreshCw className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{tx.description}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(tx.timestamp).toLocaleString()} • Bal: {tx.balanceAfter}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${
                    tx.type === 'debit' ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {tx.type === 'debit' ? '-' : '+'}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
