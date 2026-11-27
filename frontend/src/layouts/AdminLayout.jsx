import React from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice.js';
import { useThemeContext } from '../context/ThemeContext.jsx';
import OperatorName from '../components/OperatorName.jsx';
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
      <header className="cyber-navbar admin-navbar">
        <div className="cyber-navbar-inner">
          <Link to="/admin" className="cyber-brand">
            <span className="brand-bracket" style={{ color: 'var(--accent-secondary)' }}>
              //
            </span>{' '}
            X_GACHA
          </Link>

          <nav className="cyber-nav-links">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                isActive ? 'cyber-nav-item active' : 'cyber-nav-item'
              }
            >
              TỔNG QUAN
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                isActive ? 'cyber-nav-item active' : 'cyber-nav-item'
              }
            >
              TÀI KHOẢN
            </NavLink>
            <NavLink
              to="/admin/cards"
              className={({ isActive }) =>
                isActive ? 'cyber-nav-item active' : 'cyber-nav-item'
              }
            >
              THẺ BÀI
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
                    {user.role.toUpperCase()}
                  </span>
                </div>
                <OperatorName username={user.username} />
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
              NGẮT KẾT NỐI
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