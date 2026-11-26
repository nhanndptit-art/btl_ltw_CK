import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { authFetch } from '../utils/apiClient.js';

const AdminDashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { pathname } = useLocation();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const data = await authFetch('/admin/dashboard');
        if (isMounted) setDashboard(data);
      } catch (error) {
        if (isMounted) setErrorMessage(error.message || 'Không thể tải dữ liệu quản trị.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = dashboard?.summary;
  const users = dashboard?.users || [];

  return (
    <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header khu vực Admin */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-dim)',
          borderLeft: '4px solid var(--accent-secondary)',
          padding: '1.5rem 2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-secondary)',
              marginBottom: '0.3rem',
            }}
          >
            ROOT_TERMINAL // PATH: {pathname}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-primary)' }}>
            BẢNG ĐIỀU KHIỂN QUẢN TRỊ HỆ THỐNG
          </h1>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          OPERATOR: <strong style={{ color: 'var(--accent-secondary)' }}>@{user?.username}</strong>
        </div>
      </div>

      {/* 3 thẻ thống kê nhanh */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            TỔNG TÀI KHOẢN
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyber)' }}>
            {loading ? '...' : Number(summary?.total_users || 0).toLocaleString()}
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            TÀI KHOẢN ADMIN
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', marginTop: '0.4rem' }}>
            {loading ? '...' : Number(summary?.admin_count || 0).toLocaleString()}
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            TÀI KHOẢN ĐANG HOẠT ĐỘNG
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {loading ? '...' : Number(summary?.active_users || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Bảng danh sách tài khoản phân quyền */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)', padding: '1.5rem', overflowX: 'auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          // DANH SÁCH TÀI KHOẢN & PHÂN QUYỀN
        </h2>
        {errorMessage && (
          <p role="alert" style={{ color: 'var(--accent-secondary)', marginBottom: '1rem' }}>
            {errorMessage}
          </p>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-dim)', color: 'var(--text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>ID</th>
              <th style={{ padding: '0.75rem' }}>USERNAME</th>
              <th style={{ padding: '0.75rem' }}>EMAIL</th>
              <th style={{ padding: '0.75rem' }}>ROLE</th>
              <th style={{ padding: '0.75rem' }}>TRẠNG THÁI</th>
              <th style={{ padding: '0.75rem' }}>GEMS</th>
              <th style={{ padding: '0.75rem' }}>PITY</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="7" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                  ĐANG TẢI DỮ LIỆU TÀI KHOẢN...
                </td>
              </tr>
            )}
            {!loading && !errorMessage && users.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                  CHƯA CÓ TÀI KHOẢN NÀO.
                </td>
              </tr>
            )}
            {!loading && users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-dim)', color: 'var(--text-primary)' }}>
                <td style={{ padding: '0.75rem' }}>#{u.id}</td>
                <td style={{ padding: '0.75rem' }}>@{u.username}</td>
                <td style={{ padding: '0.75rem' }}>{u.email || '—'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      background: u.role === 'admin' ? 'var(--accent-secondary)' : 'var(--bg-surface)',
                      color: u.role === 'admin' ? '#fff' : 'var(--accent-cyber)',
                      border: '1px solid var(--border-dim)',
                    }}
                  >
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>{u.status.toUpperCase()}</td>
                <td style={{ padding: '0.75rem', color: 'var(--accent-primary)' }}>{u.gems.toLocaleString()}</td>
                <td style={{ padding: '0.75rem' }}>{u.pity_count}/90</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminDashboardPage;