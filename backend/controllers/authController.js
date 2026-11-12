import crypto from 'crypto';
import pool from '../config/db.js';

const hashPassword = (password) =>
  crypto.createHash('sha256').update(password).digest('hex');

export const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password || username.trim().length < 3) {
      return res.status(400).json({
        message: 'Tên đăng nhập phải từ 3 ký tự trở lên và không được để trống mật khẩu.',
      });
    }

    const cleanUsername = username.trim();
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [cleanUsername]
    );

    if (existingUsers.length > 0) {
      return res.status(201).json({
        user: {
          id: result.insertId,
          username: cleanUsername,
          gems: initialGems,
          pity_count: 0,
          highest_boss_floor: 0,
          stamina: 100,
        },
      });
    }

    const passwordHash = hashPassword(password);
    const initialGems = 4800; // Tặng 30 lần quay khi tạo tài khoản mới

    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash, gems, pity_count) VALUES (?, ?, ?, 0)',
      [cleanUsername, passwordHash, initialGems]
    );

    return res.status(201).json({
      user: {
        id: result.insertId,
        username: cleanUsername,
        gems: initialGems,
        pity_count: 0,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi đăng ký tài khoản.' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ định danh và mật khẩu.',
      });
    }

    const passwordHash = hashPassword(password);
    const [rows] = await pool.execute(
      'SELECT id, username, gems, pity_count, highest_boss_floor, stamina FROM users WHERE username = ? AND password_hash = ?',
      [username.trim(), passwordHash]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Sai tên đăng nhập hoặc mật khẩu truy cập.',
      });
    }

    return res.status(200).json({ user: rows[0] });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Lỗi kết nối cơ sở dữ liệu khi đăng nhập.' });
  }
};
