// File: backend/routes/apiRoutes.js
import express from 'express';
import { loginUser, registerUser } from '../controllers/authController.js';
import { getGachaHistory, rollGacha } from '../controllers/gachaController.js';
import { getUserInventory } from '../controllers/inventoryController.js';
import { battleBoss, getBossFloors } from '../controllers/bossController.js'; // Import Controller mới

const router = express.Router();

// Auth & Gacha Routes hiện có
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.post('/gacha/roll', rollGacha);
router.get('/gacha/history/:userId', getGachaHistory);
router.get('/inventory/:userId', getUserInventory);

// Routes mới cho Task 7: Tháp Boss
router.get('/bosses/:userId', getBossFloors);
router.post('/bosses/:floorNumber/battle', battleBoss);

export default router;