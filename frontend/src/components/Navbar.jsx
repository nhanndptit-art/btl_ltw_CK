import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice.js';
import { clearPullResults } from '../store/gachaSlice.js';
import { useThemeContext } from '../context/ThemeContext.jsx';
import './Navbar.css';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useThemeContext();

  const handleLogout = () => {
    dispatch(clearPullResults());
    dispatch(logoutUser());
  };

  return (
    <header className="cyber-navbar">
      <div className="cyber-navbar-inner">
        <Link to="/" className="cyber-brand">
          <span className="brand-bracket">//</span> X_GACHA
        </Link>

        {user && (
          <nav className="cyber-nav-links">
            <NavLink
              to="/gacha"
              className={({ isActive }) =>
                isActive ? 'cyber-nav-item active' : 'cyber-nav-item'
              }
            >
              TRẠM TRIỆU HỒI
            </NavLink>
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                isActive ? 'cyber-nav-item active' : 'cyber-nav-item'
              }
            >
              KHO THẺ BÀI
            </NavLink>
          </nav>
        )}

        <div className="cyber-navbar-actions">
          {user && (
            <div className="user-telemetry-bar">
              <div className="telemetry-chip">
                <span className="telemetry-label">PITY:</span>
                <span className="telemetry-value pity-highlight">
                  {user.pity_count}/90
                </span>
              </div>
              <div className="telemetry-chip">
                <span className="telemetry-label">GEMS:</span>
                <span className="telemetry-value gem-highlight">
                  {user.gems.toLocaleString()}
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

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="cyber-logout-btn"
            >
              NGẮT KẾT NỐI
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
