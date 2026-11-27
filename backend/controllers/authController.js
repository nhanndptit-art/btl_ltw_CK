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
  const { username, password } = req.body;
  const cleanUsername = typeof username === 'string' ? username.trim() : '';

  if (!cleanUsername || typeof password !== 'string' || !password) {
    return res.status(400).json({
      message: 'Vui lòng nhập đầy đủ định danh và mật khẩu.',
    });
  }

  let connection;
  let transactionStarted = false;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [rows] = await connection.execute(
      `SELECT id, username, email, password_hash, gems, pity_count,
              highest_boss_floor, stamina, role, status, failed_login_attempts,
              locked_until,
              (locked_until IS NOT NULL AND locked_until > CURRENT_TIMESTAMP) AS is_locked
       FROM users
       WHERE username = ?
       FOR UPDATE`,
      [cleanUsername]
    );

    if (rows.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu truy cập.' });
    }

    const account = rows[0];
    if (account.status !== 'active') {
      await connection.rollback();
      transactionStarted = false;
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.' });
    }

    if (Boolean(account.is_locked)) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(423).json({ message: 'Tài khoản đang bị khóa đăng nhập tạm thời.' });
    }

    if (hashPassword(password) !== account.password_hash) {
      const failedAttempts = Number(account.failed_login_attempts) + 1;
      await connection.execute(
        `UPDATE users
         SET failed_login_attempts = ?,
             locked_until = CASE
               WHEN ? >= 15 THEN DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY)
               WHEN ? >= 10 THEN DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE)
               WHEN ? >= 5 THEN DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE)
               ELSE NULL
             END
         WHERE id = ?`,
        [failedAttempts, failedAttempts, failedAttempts, failedAttempts, account.id]
      );
      await connection.commit();
      transactionStarted = false;

      if (failedAttempts >= 5) {
        return res.status(423).json({ message: 'Tài khoản đã bị khóa đăng nhập tạm thời do nhập sai mật khẩu nhiều lần.' });
      }
      return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu truy cập.' });
    }

    await connection.execute(
      `UPDATE users
       SET failed_login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [account.id]
    );
    await connection.commit();
    transactionStarted = false;

    const user = {
      id: account.id,
      username: account.username,
      email: account.email,
      gems: account.gems,
      pity_count: account.pity_count,
      highest_boss_floor: account.highest_boss_floor,
      stamina: account.stamina,
      role: account.role,
    };
    const token = generateToken(user);

    return res.status(200).json({ user, token });
  } catch (error) {
    if (connection && transactionStarted) await connection.rollback();
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Lỗi kết nối cơ sở dữ liệu khi đăng nhập.' });
  } finally {
    if (connection) connection.release();
  }
};