import React from 'react';
import './CardItem.css';

const CardItem = ({ card, showQuantity = false }) => {
  const rarityClass = `rarity-${card.rarity.toLowerCase()}`;

  // Fallback SVG data URI nếu bạn chưa kịp chép ảnh thật vào thư mục public/assets/cards
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = `https://placehold.co/600x800/11131A/00F0FF?text=${encodeURIComponent(
      card.name
    )}`;
  };

  return (
    <article className={`cyber-card ${rarityClass}`}>
      <div className="cyber-card-header">
        <span className="card-rarity-badge">{card.rarity.toUpperCase()}</span>
        <span className="card-element-tag">{card.element}</span>
      </div>

      <div className="cyber-card-visual">
        <img
          src={card.image_url}
          alt={card.name}
          onError={handleImageError}
          loading="lazy"
        />
        {card.is_pity_triggered && (
          <span className="pity-guaranteed-stamp">PITY 90 // GUARANTEED</span>
        )}
        {showQuantity && card.quantity > 1 && (
          <span className="card-duplicate-count">x{card.quantity}</span>
        )}
      </div>

      <div className="cyber-card-body">
        <h3 className="card-character-name">{card.name}</h3>
        <p className="card-character-title">{card.title}</p>

        <div className="card-stats-row">
          <div className="stat-box">
            <span className="stat-label">ATK</span>
            <span className="stat-val">{card.base_atk}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">DEF</span>
            <span className="stat-val">{card.base_def}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default CardItem;
