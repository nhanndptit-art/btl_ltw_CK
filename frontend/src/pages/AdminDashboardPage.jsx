import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

const AdminDashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { pathname } = useLocation();

  const mockUsers = [
    { id: 1, username: 'cyber_runner', role: 'user', gems: 11185, pity: 85 },
    { id: 2, username: 'Tungdepzai', role: 'user', gems: 70785, pity: 12 },
    { id: 3, username: 'Nhandangcap', role: 'user', gems: 9998400, pity: 40 },
    { id: 4, username: 'admin_tuananh', role: 'admin', gems: 999999, pity: 0 },
  ];

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
            TỔNG ĐẶC VỤ ĐĂNG KÝ
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyber)' }}>
            {mockUsers.length}
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            TRẠNG THÁI PHÂN QUYỀN
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', marginTop: '0.4rem' }}>
            RBAC_ACTIVE (3 ROLES)
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            ĐỒNG BỘ API BACKEND
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            UI READY // WAITING API
          </div>
        </div>
      </div>

      {/* Bảng danh sách tài khoản phân quyền */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)', padding: '1.5rem', overflowX: 'auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          // DANH SÁCH TÀI KHOẢN & PHÂN QUYỀN (PREVIEW)
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-dim)', color: 'var(--text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>ID</th>
              <th style={{ padding: '0.75rem' }}>USERNAME</th>
              <th style={{ padding: '0.75rem' }}>ROLE</th>
              <th style={{ padding: '0.75rem' }}>GEMS</th>
              <th style={{ padding: '0.75rem' }}>PITY</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-dim)', color: 'var(--text-primary)' }}>
                <td style={{ padding: '0.75rem' }}>#{u.id}</td>
                <td style={{ padding: '0.75rem' }}>@{u.username}</td>
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
                <td style={{ padding: '0.75rem', color: 'var(--accent-primary)' }}>{u.gems.toLocaleString()}</td>
                <td style={{ padding: '0.75rem' }}>{u.pity}/90</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminDashboardPage;