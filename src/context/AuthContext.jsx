import React, { createContext, useContext, useState } from 'react';
import { HARDCODED_ACCOUNTS } from '../data/hardcodedAccounts';

export { HARDCODED_ACCOUNTS };

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Strict 18+ age validation
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

  // Sign In with email & password against hardcoded list
  const loginWithCredentials = (email, password) => {
    setAuthError(null);

    const match = HARDCODED_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === email.trim().toLowerCase() && acc.password === password
    );

    if (match) {
      const userObj = { status: 'active', ...match };
      setUser(userObj);
      setIsOnboarded(true);
      return { success: true, user: userObj };
    }

    // Fallback login for any non-demo valid email if password provided
    if (email.trim() && password.length >= 4) {
      const customUser = {
        id: `usr-${Math.floor(10000 + Math.random() * 90000)}`,
        email: email.trim(),
        name: email.split('@')[0].replace('.', ' '),
        dob: '1999-01-01',
        age: 27,
        gender: 'any',
        country: 'United States',
        status: 'active',
        role: 'user',
        isAdmin: false,
        isAgeVerified: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };
      setUser(customUser);
      setIsOnboarded(true);
      return { success: true, user: customUser };
    }

    setAuthError('Invalid credentials! Please check your email and password, or use a hardcoded demo account.');
    return { success: false, error: 'Invalid email or password' };
  };

  // Sign Up / Register new user
  const registerUser = (userData) => {
    setAuthError(null);

    const isAdult = validateAge(userData.dob, 18);
    if (!isAdult) {
      setAuthError('Access Denied: You must be at least 18 years old to use BETADRIX per strict safety regulations.');
      return { success: false, error: 'Under 18 years old' };
    }

    if (!userData.acceptedGuidelines) {
      setAuthError('You must accept the Community Safety Guidelines to register.');
      return { success: false, error: 'Guidelines not accepted' };
    }

    const newUser = {
      id: `usr-${Math.floor(10000 + Math.random() * 90000)}`,
      email: userData.email,
      name: userData.name || 'New Member',
      dob: userData.dob,
      gender: userData.gender || 'non-binary',
      country: userData.country || 'United States',
      age: 22,
      role: 'user',
      isAdmin: false,
      isAgeVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };

    setUser(newUser);
    setIsOnboarded(true);
    return { success: true, user: newUser };
  };

  const completeOnboarding = (userData) => {
    return registerUser(userData).success;
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
        loginWithCredentials,
        registerUser,
        completeOnboarding,
        logout,
        hardcodedAccounts: HARDCODED_ACCOUNTS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
