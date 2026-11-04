// File: backend/server.js
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes.js';
import { startGachaLogCleanupJob } from './jobs/gachaLogCleanup.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json());

// Route kiểm tra nhanh trạng thái kết nối
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ONLINE', message: 'Backend đã kết nối thành công!' });
});

app.use('/api', apiRoutes);

startGachaLogCleanupJob();

app.listen(PORT, () => {
  console.log(`[NEURAL SERVER] Đang chạy tại http://localhost:${PORT}`);
});