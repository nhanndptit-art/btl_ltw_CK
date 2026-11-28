import express from 'express';
import { getLoginLockStatus, loginUser, registerUser } from '../controllers/authController.js';
import { getGachaHistory, rollGacha } from '../controllers/gachaController.js';
import { getUserInventory } from '../controllers/inventoryController.js';
import { battleBoss, getBossFloors } from '../controllers/bossController.js';
import { getAdminDashboard } from '../controllers/adminController.js';
import {
  createAdminCard,
  getAdminCards,
  updateAdminCard,
  updateAdminCardStatus,
} from '../controllers/adminCardController.js';
import {
  clearAdminUserLoginLock,
  getAdminAuditLogs,
  getAdminUserDetails,
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserResources,
  updateAdminUserStatus,
} from '../controllers/adminUserController.js';
import { verifyToken, authorizeRoles, verifySelfOrAdmin } from '../middleware/authMiddleware.js';
import { uploadCardImage } from '../middleware/cardUpload.js';
import pool from '../config/db.js';

const router = express.Router();

// 1. Public Routes
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.get('/auth/login-lock-status', getLoginLockStatus);

// 2. Player Routes (Bắt buộc đăng nhập & đúng chủ tài khoản)
router.post('/gacha/roll', verifyToken, verifySelfOrAdmin, rollGacha);
router.get('/gacha/history/:userId', verifyToken, verifySelfOrAdmin, getGachaHistory);
router.get('/inventory/:userId', verifyToken, verifySelfOrAdmin, getUserInventory);
router.get('/bosses/:userId', verifyToken, verifySelfOrAdmin, getBossFloors);
router.post('/bosses/:floorNumber/battle', verifyToken, verifySelfOrAdmin, battleBoss);

// 3. Admin Routes
router.get('/admin/dashboard', verifyToken, authorizeRoles('admin'), getAdminDashboard);
router.get('/admin/cards', verifyToken, authorizeRoles('admin'), getAdminCards);
router.post(
  '/admin/cards',
  verifyToken,
  authorizeRoles('admin'),
  uploadCardImage,
  createAdminCard
);
router.patch(
  '/admin/cards/:cardId',
  verifyToken,
  authorizeRoles('admin'),
  uploadCardImage,
  updateAdminCard
);
router.patch(
  '/admin/cards/:cardId/status',
  verifyToken,
  authorizeRoles('admin'),
  updateAdminCardStatus
);
router.get('/admin/users', verifyToken, authorizeRoles('admin'), getAdminUsers);
router.get('/admin/users/:userId', verifyToken, authorizeRoles('admin'), getAdminUserDetails);
router.patch('/admin/users/:userId/role', verifyToken, authorizeRoles('admin'), updateAdminUserRole);
router.patch('/admin/users/:userId/status', verifyToken, authorizeRoles('admin'), updateAdminUserStatus);
router.patch('/admin/users/:userId/resources', verifyToken, authorizeRoles('admin'), updateAdminUserResources);
router.post('/admin/users/:userId/clear-login-lock', verifyToken, authorizeRoles('admin'), clearAdminUserLoginLock);
router.get('/admin/audit-logs', verifyToken, authorizeRoles('admin'), getAdminAuditLogs);

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