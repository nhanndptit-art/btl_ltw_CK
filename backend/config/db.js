import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ override: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: Number(process.env.DB_PORT),
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false,
  },
  timezone: 'Z',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test kết nối ngay khi bật server
pool.getConnection()
  .then((conn) => {
    console.log('[DB CONNECTED] Kết nối Aiven MySQL thành công!');
    conn.release();
  })
  .catch((err) => {
    console.error('[DB ERROR]', err.code, err.message);
  });

export default pool;