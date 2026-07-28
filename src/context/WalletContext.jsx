import React, { createContext, useContext, useState } from 'react';

const WalletContext = createContext();

const INITIAL_COIN_PACKS = [
  { id: 'pack-100', name: 'Starter Pack', amount: 100, price: 0.99, label: 'Starter', badge: null, popular: false, active: true },
  { id: 'pack-500', name: 'Popular Pack', amount: 500, price: 3.99, label: 'Popular', badge: 'Best Value', popular: true, active: true },
  { id: 'pack-1000', name: 'Premium Pack', amount: 1000, price: 6.99, label: 'Premium', badge: 'Most Popular', popular: false, active: true },
  { id: 'pack-5000', name: 'VIP Bundle', amount: 5000, price: 24.99, label: 'VIP', badge: 'VIP Bonus', popular: false, active: true }
];

const INITIAL_FILTER_PRICES = {
  match: 80,
  gender: 50,
  location: 100,
  extendCall: 20
};

const INITIAL_TRANSACTIONS = [
  { id: 'tx-101', type: 'purchase', amount: 500, balanceAfter: 500, description: 'Welcome Starter Pack Purchase', timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: 'tx-102', type: 'debit', amount: 50, balanceAfter: 450, description: 'Unlocked Gender Filter (Female/Male)', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() }
];

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(450);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [coinPacks, setCoinPacks] = useState(INITIAL_COIN_PACKS);
  const [filterPrices, setFilterPrices] = useState(INITIAL_FILTER_PRICES);
  const [unlockedFilters, setUnlockedFilters] = useState({
    gender: true,
    location: true
  });

  const purchaseCoins = (packAmount, priceUSD, gateway = 'Stripe') => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newBalance = balance + packAmount;
        const newTx = {
          id: `tx-${Date.now()}`,
          type: 'purchase',
          amount: packAmount,
          balanceAfter: newBalance,
          description: `Purchased ${packAmount} coins via ${gateway} ($${priceUSD})`,
          timestamp: new Date().toISOString()
        };
        setBalance(newBalance);
        setTransactions((prev) => [newTx, ...prev]);
        resolve({ success: true, balance: newBalance });
      }, 800);
    });
  };

  const spendCoins = (featureKey, description) => {
    const cost = filterPrices[featureKey] || 50;
    if (balance < cost) {
      return { success: false, reason: 'INSUFFICIENT_FUNDS', costRequired: cost };
    }

    const newBalance = balance - cost;
    const newTx = {
      id: `tx-${Date.now()}`,
      type: 'debit',
      amount: cost,
      balanceAfter: newBalance,
      description: description || `Unlocked feature: ${featureKey}`,
      timestamp: new Date().toISOString()
    };

    setBalance(newBalance);
    setTransactions((prev) => [newTx, ...prev]);
    
    if (featureKey === 'gender' || featureKey === 'location') {
      setUnlockedFilters((prev) => ({ ...prev, [featureKey]: true }));
    }

    return { success: true, balance: newBalance };
  };

  const deductCoins = (amount, description) => {
    const cost = Number(amount) || 0;
    if (balance < cost) {
      return { success: false, reason: 'INSUFFICIENT_FUNDS', costRequired: cost };
    }

    const newBalance = balance - cost;
    const newTx = {
      id: `tx-${Date.now()}`,
      type: 'debit',
      amount: cost,
      balanceAfter: newBalance,
      description: description || `Spent ${cost} coins`,
      timestamp: new Date().toISOString()
    };

    setBalance(newBalance);
    setTransactions((prev) => [newTx, ...prev]);
    return { success: true, balance: newBalance };
  };

  const refundCoins = (userId, amount, reason) => {
    const newBalance = balance + amount;
    const newTx = {
      id: `tx-${Date.now()}`,
      type: 'refund',
      amount,
      balanceAfter: newBalance,
      description: `Refund: ${reason}`,
      timestamp: new Date().toISOString()
    };
    setBalance(newBalance);
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Admin Subscription & Package Management
  const addCoinPack = (newPack) => {
    const packObj = {
      id: `pack-${Date.now()}`,
      name: newPack.name || `${newPack.amount} Coins Pack`,
      amount: Number(newPack.amount),
      price: Number(newPack.price),
      label: newPack.label || 'Special',
      badge: newPack.badge || null,
      popular: Boolean(newPack.popular),
      active: true
    };
    setCoinPacks((prev) => [...prev, packObj]);
  };

  const updateCoinPack = (packId, updatedFields) => {
    setCoinPacks((prev) =>
      prev.map((p) => (p.id === packId ? { ...p, ...updatedFields } : p))
    );
  };

  const deleteCoinPack = (packId) => {
    setCoinPacks((prev) => prev.filter((p) => p.id !== packId));
  };

  const toggleCoinPackActive = (packId) => {
    setCoinPacks((prev) =>
      prev.map((p) => (p.id === packId ? { ...p, active: !p.active } : p))
    );
  };

  const updateFilterPrices = (key, newCost) => {
    setFilterPrices((prev) => ({ ...prev, [key]: Number(newCost) }));
  };

  const adminGrantCoins = (userId, amount, reason = 'Admin Adjustment') => {
    const newBalance = balance + Number(amount);
    const newTx = {
      id: `tx-admin-${Date.now()}`,
      type: amount >= 0 ? 'purchase' : 'debit',
      amount: Math.abs(Number(amount)),
      balanceAfter: newBalance,
      description: `Admin Grant to ${userId}: ${reason}`,
      timestamp: new Date().toISOString()
    };
    setBalance(newBalance);
    setTransactions((prev) => [newTx, ...prev]);
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        unlockedFilters,
        coinPacks,
        filterPrices,
        FILTER_PRICES: filterPrices,
        purchaseCoins,
        spendCoins,
        deductCoins,
        refundCoins,
        addCoinPack,
        updateCoinPack,
        deleteCoinPack,
        toggleCoinPackActive,
        updateFilterPrices,
        adminGrantCoins
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
