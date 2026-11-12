import React from 'react';

const BossIntelPanel = ({ boss }) => {
  if (!boss) return null;

  return (
    <div className="cyber-panel">
      <h3 className="panel-title">// HỒ SƠ KẺ ĐỊCH - TẦNG {boss.floor_number}</h3>
      <div className="intel-grid">
        <div className="intel-stat">
          <span className="intel-label">MÃ ĐỊNH DANH</span>
          <span className="intel-value">{boss.name}</span>
        </div>
        <div className="intel-stat">
          <span className="intel-label">HỆ NGUYÊN TỐ</span>
          <span className="intel-value" style={{ color: '#ffea00' }}>{boss.element}</span>
        </div>
        <div className="intel-stat">
          <span className="intel-label">HỎA LỰC YÊU CẦU (ATK)</span>
          <span className="intel-value req-atk">{boss.req_atk}</span>
        </div>
        <div className="intel-stat">
          <span className="intel-label">CHỈ SỐ PHÒNG NGỰ (DEF)</span>
          <span className="intel-value req-def">{boss.req_def}</span>
        </div>
      </div>
      
      <div className="mech-warning">
        <span className="mech-label">CẢNH BÁO CƠ CHẾ: </span>
        <span className="mech-desc">{boss.mech_description}</span>
      </div>
    </div>
  );
};

export default BossIntelPanel;