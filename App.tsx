import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Feed from './pages/Feed';
import Visualize from './pages/Visualize';
// import Scanner from './pages/Scanner'; // COMMENTED OUT - Non-functional feature
import Intelligence from './pages/Intelligence';
import FraudShield from './pages/FraudShield';
import { Incident } from './types';
import { generateMockIncidents } from './services/mockData';

// --- Contexts ---
interface AppContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  incidents: Incident[];
  refreshData: () => void;
}

export const AppContext = createContext<AppContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  incidents: [],
  refreshData: () => {},
});

export const useAppContext = () => useContext(AppContext);

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const fetchLiveIncidents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/incidents');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setIncidents(data);
          return;
        }
      }
      // If API responds with an empty array or failed, use some mock data as fallback
      setIncidents(generateMockIncidents(100));
    } catch (err) {
      console.error('Failed to fetch from live backend, falling back to mock data', err);
      setIncidents(generateMockIncidents(100));
    }
  };

  useEffect(() => {
    fetchLiveIncidents();
    // Poll for live data every 3 minutes
    const intervalId = setInterval(fetchLiveIncidents, 3 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const refreshData = () => {
    // We can also trigger a manual force-fetch from the backend to fetch new RSS items
    fetch('http://localhost:5000/api/fetch-live', { method: 'POST' })
      .then(() => fetchLiveIncidents())
      .catch(() => fetchLiveIncidents()); 
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <AppContext.Provider value={{ theme, toggleTheme, incidents, refreshData }}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/visualize" element={<Visualize />} />
            {/* <Route path="/scanner" element={<Scanner />} /> */} {/* COMMENTED OUT - Non-functional */}
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/fraud-shield" element={<FraudShield />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;