import React from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice.js';
import { useThemeContext } from '../context/ThemeContext.jsx';
import '../components/Navbar.css';

const AdminLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useThemeContext();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <div className="cyber-app-shell">
      <header
        className="cyber-navbar"
        style={{ borderBottom: '2px solid var(--accent-secondary)' }}
      >
        <div className="cyber-navbar-inner">
          <Link to="/admin" className="cyber-brand">
            <span className="brand-bracket" style={{ color: 'var(--accent-secondary)' }}>
              //
            </span>{' '}
            X_GACHA{' '}
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                background: 'var(--accent-secondary)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                marginLeft: '6px',
              }}
            >
              SYS_ADMIN
            </span>
          </Link>

          <nav className="cyber-nav-links">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                isActive ? 'cyber-nav-item active' : 'cyber-nav-item'
              }
            >
              TRUNG TÂM ĐIỀU HÀNH
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                isActive ? 'cyber-nav-item active' : 'cyber-nav-item'
              }
            >
              QUẢN LÝ ĐẶC VỤ
            </NavLink>
            <NavLink
              to="/admin/cards"
              className={({ isActive }) =>
                isActive ? 'cyber-nav-item active' : 'cyber-nav-item'
              }
            >
              KHO DỮ LIỆU THẺ
            </NavLink>
          </nav>

          <div className="cyber-navbar-actions">
            {user && (
              <div className="user-telemetry-bar">
                <div className="telemetry-chip">
                  <span className="telemetry-label">ROLE:</span>
                  <span
                    className="telemetry-value"
                    style={{ color: 'var(--accent-secondary)' }}
                  >
                    ROOT_ADMIN
                  </span>
                </div>
                <span className="operator-name">@{user.username}</span>
              </div>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="cyber-icon-btn"
            >
              {theme === 'dark' ? 'MODE: NIGHT' : 'MODE: LAB'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="cyber-logout-btn"
            >
              THOÁT QUẢN TRỊ
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

export default AdminLayout;