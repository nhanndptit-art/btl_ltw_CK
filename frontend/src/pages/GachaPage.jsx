import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { performGachaRollThunk } from '../store/gachaSlice.js';
import { useThemeContext } from '../context/ThemeContext.jsx';
import CardItem from '../components/CardItem.jsx';
import './GachaPage.css';

const GachaPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { lastPullResults, isRolling, error } = useSelector((state) => state.gacha);
  const { bannerConfig } = useThemeContext();

  const pityPercentage = Math.min(
    100,
    Math.round(((user?.pity_count || 0) / bannerConfig.hardPity) * 100)
  );
  const pullsRemainingForGuaranteed = bannerConfig.hardPity - (user?.pity_count || 0);

  const handleRoll = (pullCount) => {
    if (!user || isRolling) return;
    dispatch(performGachaRollThunk({ userId: user.id, pullCount }));
  };

  return (
    <div className="gacha-page-layout">
      {/* KHU VỰC BANNER & BỘ ĐẾM BẢO HIỂM PITY */}
      <section className="gacha-hero-grid">
        <div className="banner-showcase">
          <div className="banner-meta-line">
            <span>{bannerConfig.bannerCode}</span>
            <span className="rate-up-pill">HARD PITY: 90 PULLS</span>
          </div>

          <h1 className="banner-main-title">{bannerConfig.bannerTitle}</h1>
          <p className="banner-featured-unit">
            NHÂN VẬT TÂM ĐIỂM: <strong>{bannerConfig.featuredUnit}</strong>
          </p>

          <div className="probability-strip">
            {bannerConfig.rates.map((item) => (
              <div key={item.rarity} className="prob-chip">
                <span className="prob-dot" style={{ backgroundColor: item.color }} />
                <span>{item.rarity}:</span>
                <strong>{item.rate}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="gacha-control-console">
          <div className="pity-telemetry-box">
            <div className="pity-header">
              <span>BỘ ĐẾM BẢO HIỂM (PITY TELEMETRY)</span>
              <span className="pity-counter-num">
                {user.pity_count} / {bannerConfig.hardPity}
              </span>
            </div>

            <div className="pity-progress-track">
              <div
                className="pity-progress-fill"
                style={{ width: `${pityPercentage}%` }}
              />
            </div>

            <p className="pity-guarantee-note">
              Chắc chắn 100% nhận thẻ <strong>LEGENDARY</strong> sau tối đa{' '}
              <span className="highlight-count">{pullsRemainingForGuaranteed}</span> lần
              triệu hồi nữa.
            </p>
          </div>

          {error && <div className="gacha-error-banner">{error}</div>}

          <div className="roll-buttons-group">
            <button
              type="button"
              className="roll-btn roll-single"
              disabled={isRolling}
              onClick={() => handleRoll(1)}
            >
              <span className="roll-title">TRIỆU HỒI x1</span>
              <span className="roll-cost">160 GEMS</span>
            </button>

            <button
              type="button"
              className="roll-btn roll-multi"
              disabled={isRolling}
              onClick={() => handleRoll(10)}
            >
              <span className="roll-title">TRIỆU HỒI x10</span>
              <span className="roll-cost">1,600 GEMS</span>
            </button>
          </div>
        </div>
      </section>

      {/* KHU VỰC HIỂN THỊ KẾT QUẢ QUAY */}
      <section className="gacha-results-section">
        <div className="results-section-header">
          <h2>KẾT QUẢ TÍN HIỆU TRIỆU HỒI</h2>
          <span>
            {lastPullResults.length > 0
              ? `ĐÃ NHẬN ${lastPullResults.length} THẺ BÀI`
              : 'CHỜ LỆNH KÍCH HOẠT'}
          </span>
        </div>

        {lastPullResults.length === 0 ? (
          <div className="empty-roll-stage">
            <p>Chọn [TRIỆU HỒI x1] hoặc [TRIỆU HỒI x10] để giải mã thẻ bài nhân vật.</p>
          </div>
        ) : (
          <div className="pulled-cards-grid">
            {lastPullResults.map((card, idx) => (
              <CardItem key={`${card.id}-${idx}`} card={card} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default GachaPage;
