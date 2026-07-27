import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ModerationProvider } from './context/ModerationContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <WalletProvider>
        <ModerationProvider>
          <App />
        </ModerationProvider>
      </WalletProvider>
    </AuthProvider>
  </React.StrictMode>
);
