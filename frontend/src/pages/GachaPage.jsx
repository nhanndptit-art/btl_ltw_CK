import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGachaHistoryThunk, performGachaRollThunk } from '../store/gachaSlice.js';
import { useThemeContext } from '../context/ThemeContext.jsx';
import CardItem from '../components/CardItem.jsx';
import './GachaPage.css';

const GachaPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    lastPullResults,
    isRolling,
    error,
    history,
    historyPagination,
    isHistoryLoading,
    historyError,
  } = useSelector((state) => state.gacha);
  const { bannerConfig } = useThemeContext();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (!isHistoryOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsHistoryOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isHistoryOpen]);

  const pityPercentage = Math.min(
    100,
    Math.round(((user?.pity_count || 0) / bannerConfig.hardPity) * 100)
  );
  const pullsRemainingForGuaranteed = bannerConfig.hardPity - (user?.pity_count || 0);

  const handleRoll = (pullCount) => {
    if (!user || isRolling) return;
    dispatch(performGachaRollThunk({ userId: user.id, pullCount }));
  };

  const toggleHistory = () => {
    const shouldOpen = !isHistoryOpen;
    setIsHistoryOpen(shouldOpen);
    if (shouldOpen && user) {
      dispatch(fetchGachaHistoryThunk({ userId: user.id, page: 1 }));
    }
  };

  const changeHistoryPage = (page) => {
    if (!user || isHistoryLoading || page < 1 || page > historyPagination.totalPages) return;
    dispatch(fetchGachaHistoryThunk({ userId: user.id, page }));
  };

  const formatPulledAt = (value) =>
    new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));

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
          <div className="results-title-group">
            <h2>KẾT QUẢ TÍN HIỆU TRIỆU HỒI</h2>
            <button type="button" className="history-toggle-btn" onClick={toggleHistory}>
              [{isHistoryOpen ? 'ĐÓNG' : 'LỊCH SỬ'}]
            </button>
          </div>
          <span className="results-count">
            {lastPullResults.length > 0 ? `ĐÃ NHẬN ${lastPullResults.length} THẺ BÀI` : 'CHỜ LỆNH KÍCH HOẠT'}
          </span>
        </div>

        {isHistoryOpen && (
          <div className="gacha-history-overlay" onMouseDown={() => setIsHistoryOpen(false)}>
            <section
              className="gacha-history-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="history-dialog-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="history-panel-header">
                <span id="history-dialog-title">ROLL HISTORY // BATCH TELEMETRY</span>
                <button
                  type="button"
                  className="history-close-btn"
                  onClick={() => setIsHistoryOpen(false)}
                  aria-label="Đóng lịch sử triệu hồi"
                >
                  [ĐÓNG]
                </button>
              </div>

              <div className="history-total">{historyPagination.total} LƯỢT ĐÃ GHI</div>

              {isHistoryLoading && <p className="history-status">ĐANG GIẢI MÃ LOG...</p>}
              {historyError && <p className="history-status history-error">{historyError}</p>}
              {!isHistoryLoading && !historyError && history.length === 0 && (
                <p className="history-status">CHƯA CÓ DỮ LIỆU TRIỆU HỒI.</p>
              )}

              {!isHistoryLoading && !historyError && history.length > 0 && (
                <div className="history-list">
                  {history.map((batch) => (
                    <article className="history-entry" key={batch.id}>
                      <div className="history-entry-meta">
                        <strong>{formatPulledAt(batch.pulled_at)}</strong>
                        <span>ROLL x{batch.pull_count}</span>
                      </div>
                      <div className="history-card-list">
                        {batch.cards.map((card, index) => (
                          <div className={`history-card rarity-${card.rarity.toLowerCase()}`} key={`${batch.id}-${card.id}-${index}`}>
                            <span className="history-card-rarity">{card.rarity}</span>
                            <span className="history-card-name">{card.name}</span>
                            <span className="history-card-pity">PITY {card.pity_at_pull}</span>
                            {card.is_pity_triggered && <span className="history-pity-flag">GUARANTEED</span>}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {historyPagination.totalPages > 1 && (
                <div className="history-pagination">
                  <button
                    type="button"
                    onClick={() => changeHistoryPage(historyPagination.page - 1)}
                    disabled={historyPagination.page === 1 || isHistoryLoading}
                  >
                    &lt; TRƯỚC
                  </button>
                  <span>TRANG {historyPagination.page} / {historyPagination.totalPages}</span>
                  <button
                    type="button"
                    onClick={() => changeHistoryPage(historyPagination.page + 1)}
                    disabled={historyPagination.page === historyPagination.totalPages || isHistoryLoading}
                  >
                    SAU &gt;
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

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
