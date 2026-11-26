import express from 'express';
import { loginUser, registerUser } from '../controllers/authController.js';
import { getGachaHistory, rollGacha } from '../controllers/gachaController.js';
import { getUserInventory } from '../controllers/inventoryController.js';
import { battleBoss, getBossFloors } from '../controllers/bossController.js';
import { getAdminDashboard } from '../controllers/adminController.js';
import { verifyToken, authorizeRoles, verifySelfOrAdmin } from '../middleware/authMiddleware.js';
import pool from '../config/db.js';

const router = express.Router();

// 1. Public Routes
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);

// 2. Player Routes (Bắt buộc đăng nhập & đúng chủ tài khoản)
router.post('/gacha/roll', verifyToken, verifySelfOrAdmin, rollGacha);
router.get('/gacha/history/:userId', verifyToken, verifySelfOrAdmin, getGachaHistory);
router.get('/inventory/:userId', verifyToken, verifySelfOrAdmin, getUserInventory);
router.get('/bosses/:userId', verifyToken, verifySelfOrAdmin, getBossFloors);
router.post('/bosses/:floorNumber/battle', verifyToken, verifySelfOrAdmin, battleBoss);

// 3. Admin Routes
router.get('/admin/dashboard', verifyToken, authorizeRoles('admin'), getAdminDashboard);

router.post('/admin/grant-gems', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { targetUserId, amount } = req.body;
    await pool.execute('UPDATE users SET gems = gems + ? WHERE id = ?', [amount, targetUserId]);
    return res.status(200).json({ message: `Đã cộng ${amount} Gems cho user #${targetUserId}` });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi cấp phát Gems.' });
  }
});

export default router;