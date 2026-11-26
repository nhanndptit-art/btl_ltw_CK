import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'btl_ltw_game_secret_key_2026';

const hashPassword = (password) =>
  crypto.createHash('sha256').update(password).digest('hex');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

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
      return res.status(409).json({
        message: 'Tên đăng nhập đã tồn tại.',
      });
    }

    const passwordHash = hashPassword(password);
    const initialGems = 4800;
    const defaultRole = 'user';

    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash, gems, pity_count, role) VALUES (?, ?, ?, 0, ?)',
      [cleanUsername, passwordHash, initialGems, defaultRole]
    );

    const newUser = {
      id: result.insertId,
      username: cleanUsername,
      gems: initialGems,
      pity_count: 0,
      highest_boss_floor: 1,
      stamina: 100,
      role: defaultRole,
    };

    const token = generateToken(newUser);

    return res.status(201).json({ user: newUser, token });
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
      'SELECT id, username, gems, pity_count, highest_boss_floor, stamina, role FROM users WHERE username = ? AND password_hash = ?',
      [username.trim(), passwordHash]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Sai tên đăng nhập hoặc mật khẩu truy cập.',
      });
    }

    const user = rows[0];
    const token = generateToken(user);

    return res.status(200).json({ user, token });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Lỗi kết nối cơ sở dữ liệu khi đăng nhập.' });
  }
};