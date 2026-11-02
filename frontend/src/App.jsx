import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar.jsx';
import AuthPage from './pages/AuthPage.jsx';
import GachaPage from './pages/GachaPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import './App.css';

const App = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="cyber-app-shell">
      <Navbar />
      <main className="cyber-main-container">
        <Routes>
          <Route
            path="/auth"
            element={user ? <Navigate to="/gacha" replace /> : <AuthPage />}
          />
          <Route
            path="/gacha"
            element={user ? <GachaPage /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/inventory"
            element={user ? <InventoryPage /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="*"
            element={<Navigate to={user ? '/gacha' : '/auth'} replace />}
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;
