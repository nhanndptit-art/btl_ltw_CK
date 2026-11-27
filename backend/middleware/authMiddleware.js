import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'btl_ltw_game_secret_key_2026';

// Kiểm tra token và đồng bộ quyền/trạng thái tài khoản từ database.
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này.' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return res.status(403).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0 || rows[0].status !== 'active') {
      return res.status(403).json({ message: 'Tài khoản không còn hoạt động.' });
    }

    req.user = { ...decoded, ...rows[0] };
    return next();
  } catch (error) {
    console.error('Verify Token Account Error:', error);
    return res.status(500).json({ message: 'Không thể xác minh tài khoản đăng nhập.' });
  }
};

// Kiểm tra quyền hạn (player, vip, admin)
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Truy cập bị từ chối. Yêu cầu quyền: ${allowedRoles.join(' hoặc ')}.`,
      });
    }
    next();
  };
};

// Chống xem/sửa trộm dữ liệu của người chơi khác
export const verifySelfOrAdmin = (req, res, next) => {
  const targetUserId = Number(req.params.userId || req.body.userId);
  if (req.user.role === 'admin' || req.user.id === targetUserId) {
    return next();
  }
  return res.status(403).json({
    message: 'Bạn không có quyền truy cập dữ liệu của người chơi khác.',
  });
};
