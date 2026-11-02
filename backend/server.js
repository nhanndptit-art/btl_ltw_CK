// File: backend/server.js
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`[NEURAL SERVER] Hệ thống Backend Gacha đang chạy tại http://localhost:${PORT}`);
});
