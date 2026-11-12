import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar.jsx';
import AuthPage from './pages/AuthPage.jsx';
import GachaPage from './pages/GachaPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import './App.css';
import BossPage from './pages/BossPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="cyber-app-shell">
      <Navbar />
      <main className="cyber-main-container">
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/gacha" element={<GachaPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          
          {/* Đăng ký Route cho Tháp Boss */}
          <Route path="/bosses" element={<BossPage />} />
          <Route path="/bosses/:floorNumber" element={<BossPage />} />
          
          {/* Trang 404 đón lõng mọi đường dẫn sai */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
