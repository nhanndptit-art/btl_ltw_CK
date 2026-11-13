import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';

const BossFloorList = () => {
  const { bosses } = useSelector(state => state.boss);
  const { floorNumber } = useParams();
  const currentFloor = Number(floorNumber);

  return (
    <div className="boss-floor-list">
      <h3 className="panel-title">// CHỌN MỤC TIÊU</h3>
      
      {bosses.map((boss) => {
        const isActive = currentFloor === boss.floor_number;
        let statusClass = 'floor-locked';
        let statusText = 'ĐÃ KHÓA';
        
        if (boss.status === 'CLEARED') {
          statusClass = 'floor-cleared'; statusText = 'ĐÃ QUA';
        } else if (boss.status === 'AVAILABLE') {
          statusClass = 'floor-available'; statusText = 'SẴN SÀNG';
        }

        return (
          <Link 
            key={boss.id} 
            to={boss.status !== 'LOCKED' ? `/bosses/${boss.floor_number}` : '#'}
            className={`floor-item ${statusClass} ${isActive ? 'active' : ''}`}
            onClick={(e) => boss.status === 'LOCKED' && e.preventDefault()}
          >
            <div style={{ fontFamily: 'Chakra Petch', fontSize: '1.2rem', fontWeight: 'bold' }}>
              TẦNG {boss.floor_number < 10 ? `0${boss.floor_number}` : boss.floor_number}
            </div>
            <div className="floor-details">
              <span className="floor-name" style={{ display: 'block' }}>{boss.name}</span>
              <span className="floor-reward" style={{ display: 'block' }}>Thưởng: {boss.next_reward_gems} GEMS</span>
            </div>
            <div className="floor-status-badge" style={{ color: statusClass === 'floor-available' ? '#ffea00' : '#fff' }}>
              {statusText}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default BossFloorList;