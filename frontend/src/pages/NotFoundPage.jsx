import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <main style={{ padding: '120px 20px', textAlign: 'center', color: 'white', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '3rem', color: '#ff003c' }}>404 - MẤT KẾT NỐI NEURAL</h1>
      <p>Khu vực bạn truy cập không tồn tại trong hệ thống.</p>
      <Link to="/" style={{ color: '#00f0ff', textDecoration: 'underline', marginTop: '20px', display: 'inline-block' }}>
        QUAY VỀ CĂN CỨ
      </Link>
    </main>
  );
};

export default NotFoundPage;