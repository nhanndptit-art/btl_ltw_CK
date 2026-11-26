import pool from '../config/db.js';

export const getAdminDashboard = async (_req, res) => {
  try {
    const [summaryRows] = await pool.execute(
      `SELECT
         COUNT(*) AS total_users,
         COALESCE(SUM(role = 'admin'), 0) AS admin_count,
         COALESCE(SUM(status = 'active'), 0) AS active_users
       FROM users`
    );

    const [users] = await pool.execute(
      `SELECT id, username, email, role, status, gems, pity_count
       FROM users
       ORDER BY id DESC`
    );

    return res.status(200).json({
      summary: summaryRows[0],
      users,
    });
  } catch (error) {
    console.error('Get Admin Dashboard Error:', error);
    return res.status(500).json({ message: 'Không thể tải dữ liệu quản trị.' });
  }
};
