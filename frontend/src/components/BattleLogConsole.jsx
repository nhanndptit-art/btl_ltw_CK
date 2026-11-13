import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

const BattleLogConsole = () => {
  const { lastBattleResult, isBattling } = useSelector(state => state.boss);
  const terminalRef = useRef(null);

  // Hook tự động cuộn terminal xuống dưới cùng khi có log mới
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lastBattleResult]);

  // Nếu đang gọi API thì hiện loading
  if (isBattling) {
    return (
      <div className="battle-log-container">
        <h3 className="panel-title">// NHẬT KÝ TÁC CHIẾN</h3>
        <div className="terminal-window" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ color: '#00f0ff', animation: 'pulse 1.5s infinite' }}>
            ĐANG KẾT NỐI NEURAL LINK... KHỞI CHẠY MÔ PHỎNG CHIẾN ĐẤU...
          </span>
        </div>
      </div>
    );
  }

  // Nếu chưa đánh trận nào thì ẩn Component này đi
  if (!lastBattleResult) return null;

  return (
    <div className="battle-log-container">
      <h3 className="panel-title">// NHẬT KÝ TÁC CHIẾN</h3>
      
      <div className="terminal-window" ref={terminalRef}>
        {lastBattleResult.battleLogs.map((log, index) => {
          // Tô màu log tùy theo từ khóa
          let lineClass = "log-line combat";
          if (log.includes("[INIT]") || log.includes("[CHECK")) lineClass = "log-line system";
          if (log.includes("BỊ KHẮC") || log.includes("FAILED")) lineClass = "log-line warning";
          if (log.includes("DEFEAT") || log.includes("CRITICAL")) lineClass = "log-line critical";
          if (log.includes("VICTORY") || log.includes("BROKEN") || log.includes("OVERDRIVE")) lineClass = "log-line success";

          return (
            <div key={index} className={lineClass}>
              <span style={{ opacity: 0.5, marginRight: '8px' }}>{">_"}</span>
              {log}
            </div>
          );
        })}
      </div>

      <div className={`log-result-banner ${lastBattleResult.victory ? 'banner-victory' : 'banner-defeat'}`}>
        {lastBattleResult.victory 
          ? `NHIỆM VỤ HOÀN THÀNH // NHẬN +${lastBattleResult.gemsEarned} GEMS` 
          : `NHIỆM VỤ THẤT BẠI // ĐỘI HÌNH ĐÃ RÚT LUI`}
      </div>
    </div>
  );
};

export default BattleLogConsole;