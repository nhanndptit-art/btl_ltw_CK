import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSquadProjection } from '../hooks/useSquadProjection';
import { battleBossThunk } from '../store/bossSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const SquadBuilder = ({ activeBoss }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { isBattling } = useSelector(state => state.boss);
  
  const [ownedCards, setOwnedCards] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState([]);

  // Fetch kho đồ của người dùng
  useEffect(() => {
    if (user?.id) {
      fetch(`${API_BASE_URL}/inventory/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setOwnedCards(data); // Trường hợp Backend trả thẳng Mảng
          } else if (data && Array.isArray(data.inventory)) {
            setOwnedCards(data.inventory); // Trường hợp trả Object { inventory: [...] }
          } else if (data && Array.isArray(data.data)) {
            setOwnedCards(data.data); // Trường hợp trả Object { data: [...] }
          } else {
            setOwnedCards([]); // Trả về mảng rỗng nếu dữ liệu bị lỗi
          }
        })
        .catch(err => {
          console.error("Lỗi tải kho đồ:", err);
          setOwnedCards([]);
        });
    }
  }, [user]);

  // Tự động xóa đội hình khi chuyển sang tầng Boss khác
  useEffect(() => {
    setSelectedCardIds([]);
  }, [activeBoss]);

  // TÍNH TOÁN BẰNG CUSTOM HOOK (useMemo)
  const safeOwnedCards = Array.isArray(ownedCards) ? ownedCards : [];
  const selectedCards = safeOwnedCards.filter(c => selectedCardIds.includes(c.id));
  const projection = useSquadProjection(selectedCards, activeBoss);

  // Logic Chọn / Bỏ chọn thẻ
  const toggleCard = (card) => {
    if (selectedCardIds.includes(card.id)) {
      setSelectedCardIds(prev => prev.filter(id => id !== card.id));
    } else {
      if (selectedCardIds.length < 4) {
        setSelectedCardIds(prev => [...prev, card.id]);
      }
    }
  };

  const handleBattle = () => {
    dispatch(battleBossThunk({
      userId: user.id,
      floorNumber: activeBoss.floor_number,
      cardIds: selectedCardIds
    }));
  };

  if (activeBoss.status === 'LOCKED') return null;

  return (
    <div className="squad-builder-container">
      <h3 className="panel-title">// THIẾT LẬP ĐỘI HÌNH (TỐI ĐA 4)</h3>
      
      {/* 4 Ô Đội Hình */}
      <div className="squad-slots">
        {[0, 1, 2, 3].map(index => {
          const card = selectedCards[index];
          return (
            <div 
              key={index} 
              className={`slot-item ${card ? 'filled' : ''}`}
              onClick={() => card && toggleCard(card)}
            >
              {card ? (
                <>
                  <span style={{ color: '#ffea00', fontSize: '0.8rem' }}>{card.element}</span>
                  <span className="slot-name">{card.name}</span>
                  <span style={{ fontSize: '0.75rem', marginTop: '5px' }}>Lv.{card.star_level}</span>
                </>
              ) : (
                <span style={{ color: '#555' }}>[ TRỐNG ]</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Danh sách thẻ trong kho đồ */}
      <div className="roster-list">
        {safeOwnedCards.map(card => {
          const isSelected = selectedCardIds.includes(card.id);
          return (
            <div 
              key={card.id} 
              className={`roster-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleCard(card)}
            >
              <div style={{ fontSize: '0.7rem', color: '#888' }}>{card.element}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{card.name}</div>
            </div>
          );
        })}
      </div>

      {/* Bảng Dự Toán Sức Mạnh & Nút Đánh */}
      <div className="projection-panel">
        <div>
          <div style={{ fontFamily: 'Chakra Petch' }}>
            <span style={{ color: '#aaa', fontSize: '0.8rem' }}>DỰ TOÁN HỎA LỰC (ATK): </span>
            <span style={{ color: projection.isAtkPassed ? '#00ffaa' : '#ff003c', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {projection.projectedAtk}
            </span>
            <span style={{ color: '#555' }}> / {projection.reqAtk}</span>
          </div>
          <div style={{ fontFamily: 'Chakra Petch' }}>
            <span style={{ color: '#aaa', fontSize: '0.8rem' }}>DỰ TOÁN PHÒNG NGỰ (DEF): </span>
            <span style={{ color: projection.isDefPassed ? '#00ffaa' : '#ff003c', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {projection.projectedDef}
            </span>
            <span style={{ color: '#555' }}> / {projection.reqDef}</span>
          </div>
        </div>

        <button 
          className="battle-btn"
          disabled={selectedCardIds.length === 0 || isBattling}
          onClick={handleBattle}
        >
          {isBattling 
            ? 'ĐANG KẾT NỐI...' 
            : (activeBoss.status === 'CLEARED' ? 'ĐÁNH LẠI' : 'KHIÊU CHIẾN')
          }
        </button>
      </div>
    </div>
  );
};

export default SquadBuilder;