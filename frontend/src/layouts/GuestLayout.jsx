import React from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { useThemeContext } from '../context/ThemeContext.jsx';
import '../components/Navbar.css';

const GuestLayout = () => {
  const { theme, toggleTheme } = useThemeContext();

  return (
    <div className="cyber-app-shell">
      <header className="cyber-navbar">
        <div className="cyber-navbar-inner">
          <Link to="/" className="cyber-brand">
            <span className="brand-bracket">//</span> X_GACHA{' '}
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyber)' }}>
              [GUEST_ACCESS]
            </span>
          </Link>

          <nav className="cyber-nav-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? 'cyber-nav-item active' : 'cyber-nav-item'
              }
            >
              CỔNG THÔNG TIN & TỶ LỆ
            </NavLink>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? 'cyber-nav-item active' : 'cyber-nav-item'
              }
            >
              ĐĂNG NHẬP / ĐĂNG KÝ
            </NavLink>
          </nav>

          <div className="cyber-navbar-actions">
            <button
              type="button"
              onClick={toggleTheme}
              className="cyber-icon-btn"
            >
              {theme === 'dark' ? 'MODE: NIGHT' : 'MODE: LAB'}
            </button>
          </div>
        </div>
      </header>

      <main className="cyber-main-container">
        <Outlet />
      </main>
    </div>
  );
};

export default GuestLayout;