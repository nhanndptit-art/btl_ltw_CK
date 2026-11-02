import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchInventoryThunk } from '../store/gachaSlice.js';
import CardItem from '../components/CardItem.jsx';
import './InventoryPage.css';

const RARITY_FILTERS = ['ALL', 'Legendary', 'Epic', 'Rare', 'Common'];

const InventoryPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { inventory } = useSelector((state) => state.gacha);
  const [selectedRarity, setSelectedRarity] = useState('ALL');

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchInventoryThunk(user.id));
    }
  }, [dispatch, user?.id]);

  const filteredCards =
    selectedRarity === 'ALL'
      ? inventory
      : inventory.filter((item) => item.rarity === selectedRarity);

  const totalOwnedCopies = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="inventory-page">
      <div className="inventory-top-bar">
        <div>
          <h1 className="inventory-title">KHO LƯU TRỮ THẺ BÀI NHÂN VẬT</h1>
          <p className="inventory-subtitle">
            Sở hữu <strong>{inventory.length}</strong> nhân vật độc bản // Tổng cộng{' '}
            <strong>{totalOwnedCopies}</strong> thẻ bài đã giải mã
          </p>
        </div>

        <div className="rarity-filter-group">
          {RARITY_FILTERS.map((rarity) => (
            <button
              key={rarity}
              type="button"
              onClick={() => setSelectedRarity(rarity)}
              className={
                selectedRarity === rarity ? 'filter-btn active' : 'filter-btn'
              }
            >
              {rarity.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <div className="inventory-empty-box">
          <p>Không tìm thấy thẻ bài nào trong phân vùng bộ nhớ này.</p>
          <Link to="/gacha" className="goto-gacha-link">
            DI CHUYỂN TỚI TRẠM TRIỆU HỒI
          </Link>
        </div>
      ) : (
        <div className="inventory-grid">
          {filteredCards.map((card) => (
            <CardItem key={card.id} card={card} showQuantity />
          ))}
        </div>
      )}
    </section>
  );
};

export default InventoryPage;
