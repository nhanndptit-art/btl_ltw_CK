import cron from 'node-cron';
import pool from '../config/db.js';

const RETENTION_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const deleteExpiredGachaLogs = async () => {
  const [result] = await pool.execute(
    `DELETE FROM gacha_logs
     WHERE pulled_at < CURRENT_TIMESTAMP - INTERVAL 31 DAY`
  );

  console.log(`[GACHA LOG CLEANUP] Đã xóa ${result.affectedRows} log quá 31 ngày.`);
};

export const startGachaLogCleanupJob = () => {
  cron.schedule(
    '0 4 * * *',
    () => {
      deleteExpiredGachaLogs().catch((error) => {
        console.error('[GACHA LOG CLEANUP] Không thể xóa log hết hạn:', error);
      });
    },
    { timezone: RETENTION_TIMEZONE }
  );

  console.log(
    `[GACHA LOG CLEANUP] Đã lập lịch xóa log lúc 04:00 (${RETENTION_TIMEZONE}).`
  );
};
