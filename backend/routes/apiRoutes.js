// File: backend/routes/apiRoutes.js
import express from 'express';
import { loginUser, registerUser } from '../controllers/authController.js';
import { getGachaHistory, rollGacha } from '../controllers/gachaController.js';
import { getUserInventory } from '../controllers/inventoryController.js';

const router = express.Router();

router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.post('/gacha/roll', rollGacha);
router.get('/gacha/history/:userId', getGachaHistory);
router.get('/inventory/:userId', getUserInventory);

export default router;
