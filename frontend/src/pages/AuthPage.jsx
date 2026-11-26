import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUserSession } from '../store/authSlice.js';
import './AuthPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const AuthPage = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('cyber_runner');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Xác thực thất bại.');
      }

      const userPayload = data.user || data;
      const role = userPayload.role || 'user';

      dispatch(setUserSession({ user: { ...userPayload, role }, token: data.token || null }));
      navigate(role === 'admin' ? '/admin' : '/gacha', { replace: true });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleQuickDemoLogin = (demoRole) => {
    const demoUser =
      demoRole === 'admin'
        ? { id: 4, username: 'admin_tuananh', role: 'admin', gems: 999999, pity_count: 0, stamina: 100 }
        : { id: 1, username: 'cyber_runner', role: 'user', gems: 11185, pity_count: 85, stamina: 100 };

    dispatch(setUserSession({ user: demoUser, token: 'demo-jwt-token' }));
    navigate(demoRole === 'admin' ? '/admin' : '/gacha', { replace: true });
  };

  return (
    <section className="auth-stage">
      <div className="auth-terminal-box">
        <div className="terminal-status-line">
          <span>SYS.AUTH // TERMINAL_09</span>
          <span>STATUS: READY</span>
        </div>

        <h1 className="auth-heading">
          {isLoginMode ? 'ĐĂNG NHẬP HỆ THỐNG' : 'KHỞI TẠO ĐỊNH DANH MỚI'}
        </h1>
        <p className="auth-subtext">
          Tài khoản mẫu có sẵn Pity 85/90: <strong>cyber_runner</strong> / MK: <strong>123456</strong>
        </p>

        {errorMsg && <div className="auth-alert">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label htmlFor="username">MÃ ĐỊNH DANH (USERNAME)</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đặc vụ..."
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">MẬT MÃ TRUY CẬP (PASSWORD)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? 'ĐANG ĐỒNG BỘ...'
              : isLoginMode
              ? 'TRUY CẬP TRẠM GACHA'
              : 'ĐĂNG KÝ (+4,800 GEMS)'}
          </button>
        </form>

        {/* Khu vực test nhanh 2 POV User & Admin khi chưa nối API Backend */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-dim)' }}>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            // UI PREVIEW (TEST NHANH 2 VAI TRÒ KHI CHƯA BẬT SERVER):
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('user')}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: 'var(--bg-surface)',
                color: 'var(--accent-cyber)',
                border: '1px solid var(--accent-cyber)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              DEMO: USER POV
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: 'var(--bg-surface)',
                color: 'var(--accent-secondary)',
                border: '1px solid var(--accent-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              DEMO: ADMIN POV
            </button>
          </div>
        </div>

        <button
          type="button"
          className="auth-switch-btn"
          onClick={() => {
            setIsLoginMode(!isLoginMode);
            setErrorMsg('');
          }}
        >
          {isLoginMode
            ? 'Chưa có tài khoản? Chuyển sang Đăng ký mới'
            : 'Đã có định danh? Quay lại Đăng nhập'}
        </button>
      </div>
    </section>
  );
};

export default AuthPage;