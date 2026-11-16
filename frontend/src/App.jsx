import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import GuestLayout from './layouts/GuestLayout.jsx';
import UserLayout from './layouts/UserLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

import GuestLandingPage from './pages/GuestLandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';

import GachaPage from './pages/GachaPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import BossPage from './pages/BossPage.jsx';

import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import './App.css';

const App = () => {
  return (
    <Routes>
      {/* 1. GÓC NHÌN KHÁCH CHƯA ĐĂNG NHẬP (GUEST / NON-USER) */}
      <Route element={<ProtectedRoute requireAuth={false} />}>
        <Route element={<GuestLayout />}>
          <Route path="/" element={<GuestLandingPage />} />
          <Route path="/login" element={<AuthPage />} />
        </Route>
      </Route>

      {/* 2. GÓC NHÌN NGƯỜI CHƠI (USER) */}
      <Route element={<ProtectedRoute requireAuth={true} allowedRoles={['user']} />}>
        <Route element={<UserLayout />}>
          <Route path="/gacha" element={<GachaPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/bosses" element={<BossPage />} />
          <Route path="/bosses/:floorNumber" element={<BossPage />} />
        </Route>
      </Route>

      {/* 3. GÓC NHÌN QUẢN TRỊ VIÊN (ADMIN) */}
      <Route element={<ProtectedRoute requireAuth={true} allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminDashboardPage />} />
          <Route path="/admin/cards" element={<AdminDashboardPage />} />
        </Route>
      </Route>

      {/* Trang 404 đón lõng mọi đường dẫn sai */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;