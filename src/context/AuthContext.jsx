import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const DEFAULT_USER = {
  id: 'usr-88329',
  name: 'Alex Vance',
  phone: '+1 (555) 382-9910',
  dob: '1998-05-14',
  gender: 'non-binary',
  country: 'United States',
  age: 28,
  isAgeVerified: true,
  acceptedGuidelines: true,
  status: 'active', // active, suspended, banned
  role: 'user', // 'user' or 'admin'
  isAdmin: false,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_USER);
  const [isOnboarded, setIsOnboarded] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Strict age gate validation per Rules.md §1.1
  const validateAge = (dobString, minAgeRequired = 18) => {
    if (!dobString) return false;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= minAgeRequired;
  };

  const completeOnboarding = (userData) => {
    const isAdult = validateAge(userData.dob, 18);
    if (!isAdult) {
      setAuthError('Access Denied: You must be at least 18 years old to use BETADRIX stranger video chat per community safety rules.');
      return false;
    }

    if (!userData.acceptedGuidelines) {
      setAuthError('You must accept the Community Guidelines and Terms of Service to proceed.');
      return false;
    }

    setUser({
      ...userData,
      id: `usr-${Math.floor(10000 + Math.random() * 90000)}`,
      isAgeVerified: true,
      status: 'active',
      role: userData.role || 'user',
      isAdmin: userData.role === 'admin' || false,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });
    setIsOnboarded(true);
    setAuthError(null);
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsOnboarded(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isOnboarded,
        setIsOnboarded,
        authError,
        setAuthError,
        validateAge,
        completeOnboarding,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
