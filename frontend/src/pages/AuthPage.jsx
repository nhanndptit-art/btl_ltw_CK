import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUserSession } from '../store/authSlice.js';
import './AuthPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const AuthPage = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('cyber_runner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotPasswordHelp, setShowForgotPasswordHelp] = useState(false);
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
        body: JSON.stringify({
          username,
          password,
          ...(!isLoginMode ? { email: email.trim() || null } : {}),
        }),
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

          {!isLoginMode && (
            <div className="field-group">
              <label htmlFor="email">EMAIL (KHÔNG BẮT BUỘC)</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>
          )}

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

          {isLoginMode && (
            <div className="auth-forgot-row">
              <button
                type="button"
                className="auth-forgot-btn"
                onClick={() => setShowForgotPasswordHelp((visible) => !visible)}
              >
                Quên mật khẩu?
              </button>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? 'ĐANG ĐỒNG BỘ...'
              : isLoginMode
              ? 'TRUY CẬP TRẠM GACHA'
              : 'ĐĂNG KÝ (+4,800 GEMS)'}
          </button>
        </form>

        {isLoginMode && showForgotPasswordHelp && (
          <p className="auth-info" role="status">
            Vui lòng liên hệ quản trị viên để được hỗ trợ đặt lại mật khẩu.
          </p>
        )}

        <button
          type="button"
          className="auth-switch-btn"
          onClick={() => {
            setIsLoginMode(!isLoginMode);
            setErrorMsg('');
            setShowForgotPasswordHelp(false);
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