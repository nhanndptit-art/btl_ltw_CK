import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'btl_ltw_game_secret_key_2026';

// Kiểm tra Token đăng nhập
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
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
