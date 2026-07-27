import React, { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

const INITIAL_TRANSACTIONS = [
  { id: 'tx-101', type: 'purchase', amount: 500, balanceAfter: 500, description: 'Welcome Starter Pack Purchase', timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: 'tx-102', type: 'debit', amount: 50, balanceAfter: 450, description: 'Unlocked Gender Filter (Female/Male)', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() }
];

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(450);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [unlockedFilters, setUnlockedFilters] = useState({
    gender: true,
    location: true
  });

  // Feature & Match prices in coins
  const FILTER_PRICES = {
    match: 80,
    gender: 50,
    location: 100,
    extendCall: 20
  };

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
    const cost = FILTER_PRICES[featureKey] || 50;
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

  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        unlockedFilters,
        FILTER_PRICES,
        purchaseCoins,
        spendCoins,
        refundCoins
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
