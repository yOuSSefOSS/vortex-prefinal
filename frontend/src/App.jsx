import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import { checkBackendStatus } from './services/apiService';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { AppProvider } from './context/AppContext';

function App() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        await checkBackendStatus();
        if (isMounted) setIsConnected(true);
      } catch (error) {
        if (isMounted) setIsConnected(false);
      }
    };

    fetchStatus();
    
    // Polling every 30s for connection robust check
    const interval = setInterval(fetchStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <AppProvider>
      <BrowserRouter>
        <DashboardLayout isBackendConnected={isConnected}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
