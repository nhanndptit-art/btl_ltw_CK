import React from 'react';
import { Link } from 'react-router-dom';

const GuestLandingPage = () => {
  const dropRates = [
    { rarity: 'LEGENDARY (5★)', rate: '1.5%', color: '#FFB800', desc: 'Đặc vụ cấp S - Hiệu ứng Overdrive tối thượng' },
    { rarity: 'EPIC (4★)', rate: '8.5%', color: '#D900FF', desc: 'Đặc vụ tinh nhuệ - Kỹ năng chiến thuật cao' },
    { rarity: 'RARE (3★)', rate: '30.0%', color: '#00F0FF', desc: 'Đặc vụ trinh sát - Trang bị công nghệ chuẩn' },
    { rarity: 'COMMON (2★)', rate: '60.0%', color: '#7F8C9A', desc: 'Lính đánh thuê cơ bản tại Night City' },
  ];

  return (
    <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Khung giới thiệu Banner */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-dim)',
          borderLeft: '4px solid var(--accent-primary)',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--accent-cyber)',
            marginBottom: '0.5rem',
          }}
        >
          PUBLIC_GATEWAY // ACCESS_LEVEL: GUEST
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.2rem',
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            letterSpacing: '1px',
          }}
        >
          NEURAL OVERDRIVE // CỔNG TRIỆU HỒI ĐẶC VỤ
        </h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Chào mừng đến với hệ thống mô phỏng Gacha Cyberpunk. Bạn đang truy cập dưới chế độ{' '}
          <strong style={{ color: 'var(--text-primary)' }}>Khách (Non-User)</strong>. Vui lòng đăng nhập
          hoặc khởi tạo định danh mới để nhận <strong style={{ color: 'var(--accent-primary)' }}>4,800 Gems</strong>,
          tham gia triệu hồi thẻ bài và khiêu chiến Tháp Boss.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            to="/login"
            style={{
              background: 'var(--accent-primary)',
              color: '#08090C',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              padding: '0.85rem 1.75rem',
              textDecoration: 'none',
              letterSpacing: '1px',
            }}
          >
            ĐĂNG NHẬP / ĐĂNG KÝ NGAY &rarr;
          </Link>
        </div>
      </div>

      {/* Bảng công khai tỷ lệ Gacha */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-dim)',
          padding: '1.5rem',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            color: 'var(--text-primary)',
            marginBottom: '1rem',
          }}
        >
          // THÔNG SỐ TỶ LỆ TRIỆU HỒI CÔNG KHAI (TELEMETRY RATES)
        </h2>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {dropRates.map((item) => (
            <div
              key={item.rarity}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.9rem 1.2rem',
                background: 'var(--bg-surface)',
                borderLeft: `4px solid ${item.color}`,
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: item.color }}>
                  {item.rarity}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {item.rate}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GuestLandingPage;