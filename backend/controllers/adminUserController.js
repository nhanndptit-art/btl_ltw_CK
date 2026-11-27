import pool from '../config/db.js';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const parseUserId = (value) => {
  const userId = Number(value);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
};

const sendDatabaseError = (res, error, operation) => {
  console.error(`${operation} Error:`, error);
  return res.status(500).json({ message: 'Không thể hoàn tất thao tác quản lý tài khoản.' });
};

const writeAuditLog = async (connection, {
  actorUserId,
  targetUserId,
  action,
  oldRole = null,
  newRole = null,
  details = null,
}) => {
  await connection.execute(
    `INSERT INTO user_audit_logs
       (actor_user_id, target_user_id, action, old_role, new_role, details)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      actorUserId,
      targetUserId,
      action,
      oldRole,
      newRole,
      details === null ? null : JSON.stringify(details),
    ]
  );
};

export const getAdminUsers = async (req, res) => {
  const requestedPage = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const requestedPageSize = Number.parseInt(req.query.pageSize, 10) || 25;
  const pageSize = PAGE_SIZE_OPTIONS.includes(requestedPageSize) ? requestedPageSize : 25;
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const role = req.query.role || 'all';
  const status = req.query.status || 'all';
  const lockState = req.query.lockState || 'all';

  if (!['all', 'user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Bộ lọc role không hợp lệ.' });
  }
  if (!['all', 'active', 'disabled'].includes(status)) {
    return res.status(400).json({ message: 'Bộ lọc trạng thái không hợp lệ.' });
  }
  if (!['all', 'locked', 'unlocked'].includes(lockState)) {
    return res.status(400).json({ message: 'Bộ lọc khóa đăng nhập không hợp lệ.' });
  }

  const conditions = [];
  const parameters = [];

  if (search) {
    conditions.push('(username LIKE ? OR email LIKE ?)');
    parameters.push(`%${search}%`, `%${search}%`);
  }
  if (role !== 'all') {
    conditions.push('role = ?');
    parameters.push(role);
  }
  if (status !== 'all') {
    conditions.push('status = ?');
    parameters.push(status);
  }
  if (lockState === 'locked') {
    conditions.push('locked_until IS NOT NULL AND locked_until > CURRENT_TIMESTAMP');
  } else if (lockState === 'unlocked') {
    conditions.push('(locked_until IS NULL OR locked_until <= CURRENT_TIMESTAMP)');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      parameters
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;
    const [users] = await pool.execute(
      `SELECT id, username, email, role, status, gems, pity_count,
              stamina, created_at, last_login_at, failed_login_attempts, locked_until,
              (locked_until IS NOT NULL AND locked_until > CURRENT_TIMESTAMP) AS is_locked
       FROM users
       ${whereClause}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...parameters, pageSize, offset]
    );

    return res.status(200).json({
      users,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (error) {
    return sendDatabaseError(res, error, 'Get Admin Users');
  }
};

export const getAdminUserDetails = async (req, res) => {
  const userId = parseUserId(req.params.userId);
  if (!userId) return res.status(400).json({ message: 'ID tài khoản không hợp lệ.' });

  try {
    const [rows] = await pool.execute(
      `SELECT id, username, email, role, status, gems, pity_count,
              highest_boss_floor, stamina, created_at, updated_at, last_login_at,
              password_changed_at, failed_login_attempts, locked_until,
              (locked_until IS NOT NULL AND locked_until > CURRENT_TIMESTAMP) AS is_locked
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    return res.status(200).json({ user: rows[0] });
  } catch (error) {
    return sendDatabaseError(res, error, 'Get Admin User Details');
  }
};

const lockActiveAdmins = async (connection) => {
  const [admins] = await connection.execute(
    `SELECT id
     FROM users
     WHERE role = 'admin' AND status = 'active'
     ORDER BY id
     FOR UPDATE`
  );
  return admins;
};

const ensureActorIsActiveAdmin = (admins, actorUserId) => {
  if (!admins.some((admin) => Number(admin.id) === Number(actorUserId))) {
    const error = new Error('Tài khoản không còn quyền quản trị hoạt động.');
    error.statusCode = 403;
    throw error;
  }
};

const findTargetUser = async (connection, userId) => {
  const [rows] = await connection.execute(
    'SELECT id, username, role, status FROM users WHERE id = ? FOR UPDATE',
    [userId]
  );
  return rows[0] || null;
};

const ensureAnotherActiveAdmin = (admins, targetUserId) => {
  const activeAdminIds = admins.map((admin) => Number(admin.id));
  if (activeAdminIds.includes(Number(targetUserId))
      && activeAdminIds.filter((adminId) => adminId !== Number(targetUserId)).length === 0) {
    const error = new Error('Không thể hạ quyền hoặc vô hiệu hóa admin cuối cùng đang hoạt động.');
    error.statusCode = 409;
    throw error;
  }
};

const handleMutationError = async (res, connection, error, operation) => {
  try {
    await connection.rollback();
  } catch (rollbackError) {
    console.error(`${operation} Rollback Error:`, rollbackError);
  }
  if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
  return sendDatabaseError(res, error, operation);
};

export const updateAdminUserRole = async (req, res) => {
  const userId = parseUserId(req.params.userId);
  const role = req.body?.role;
  if (!userId) return res.status(400).json({ message: 'ID tài khoản không hợp lệ.' });
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Role chỉ được là user hoặc admin.' });
  }
  if (userId === Number(req.user.id) && role !== 'admin') {
    return res.status(409).json({ message: 'Bạn không thể tự hạ quyền admin của mình.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const activeAdmins = await lockActiveAdmins(connection);
    ensureActorIsActiveAdmin(activeAdmins, req.user.id);
    const target = await findTargetUser(connection, userId);
    if (!target) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }
    if (target.role === role) {
      await connection.commit();
      return res.status(200).json({ message: 'Role tài khoản không thay đổi.' });
    }
    if (target.role === 'admin' && target.status === 'active' && role !== 'admin') {
      ensureAnotherActiveAdmin(activeAdmins, target.id);
    }

    await connection.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    await writeAuditLog(connection, {
      actorUserId: req.user.id,
      targetUserId: userId,
      action: 'ROLE_CHANGED',
      oldRole: target.role,
      newRole: role,
      details: { username: target.username },
    });
    await connection.commit();
    return res.status(200).json({ message: `Đã đổi role tài khoản thành ${role}.` });
  } catch (error) {
    if (!connection) return sendDatabaseError(res, error, 'Update Admin User Role');
    return handleMutationError(res, connection, error, 'Update Admin User Role');
  } finally {
    if (connection) connection.release();
  }
};

export const updateAdminUserStatus = async (req, res) => {
  const userId = parseUserId(req.params.userId);
  const status = req.body?.status;
  if (!userId) return res.status(400).json({ message: 'ID tài khoản không hợp lệ.' });
  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ message: 'Trạng thái chỉ được là active hoặc disabled.' });
  }
  if (userId === Number(req.user.id) && status !== 'active') {
    return res.status(409).json({ message: 'Bạn không thể tự vô hiệu hóa tài khoản admin của mình.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const activeAdmins = await lockActiveAdmins(connection);
    ensureActorIsActiveAdmin(activeAdmins, req.user.id);
    const target = await findTargetUser(connection, userId);
    if (!target) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }
    if (target.status === status) {
      await connection.commit();
      return res.status(200).json({ message: 'Trạng thái tài khoản không thay đổi.' });
    }
    if (target.role === 'admin' && target.status === 'active' && status !== 'active') {
      ensureAnotherActiveAdmin(activeAdmins, target.id);
    }

    await connection.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    await writeAuditLog(connection, {
      actorUserId: req.user.id,
      targetUserId: userId,
      action: 'STATUS_CHANGED',
      oldRole: target.role,
      newRole: target.role,
      details: { username: target.username, old_status: target.status, new_status: status },
    });
    await connection.commit();
    return res.status(200).json({
      message: status === 'active' ? 'Đã kích hoạt tài khoản.' : 'Đã vô hiệu hóa tài khoản.',
    });
  } catch (error) {
    if (!connection) return sendDatabaseError(res, error, 'Update Admin User Status');
    return handleMutationError(res, connection, error, 'Update Admin User Status');
  } finally {
    if (connection) connection.release();
  }
};

export const updateAdminUserResources = async (req, res) => {
  const userId = parseUserId(req.params.userId);
  const gems = req.body?.gems;
  const stamina = req.body?.stamina;

  if (!userId) return res.status(400).json({ message: 'ID tài khoản không hợp lệ.' });
  if (!Number.isInteger(gems) || gems < 0 || gems > 2147483647) {
    return res.status(400).json({ message: 'Gems phải là số nguyên từ 0 đến 2.147.483.647.' });
  }
  if (!Number.isInteger(stamina) || stamina < 0 || stamina > 100) {
    return res.status(400).json({ message: 'Stamina phải là số nguyên từ 0 đến 100.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const activeAdmins = await lockActiveAdmins(connection);
    ensureActorIsActiveAdmin(activeAdmins, req.user.id);
    const [rows] = await connection.execute(
      'SELECT id, username, role, status, gems, stamina FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );
    const target = rows[0];
    if (!target) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    if (Number(target.gems) === gems && Number(target.stamina) === stamina) {
      await connection.commit();
      return res.status(200).json({ message: 'Gems và Stamina không thay đổi.' });
    }

    await connection.execute(
      'UPDATE users SET gems = ?, stamina = ? WHERE id = ?',
      [gems, stamina, userId]
    );
    await writeAuditLog(connection, {
      actorUserId: req.user.id,
      targetUserId: userId,
      action: 'RESOURCES_UPDATED',
      oldRole: target.role,
      newRole: target.role,
      details: {
        username: target.username,
        old_gems: target.gems,
        new_gems: gems,
        old_stamina: target.stamina,
        new_stamina: stamina,
      },
    });
    await connection.commit();
    return res.status(200).json({ message: 'Đã cập nhật Gems và Stamina.' });
  } catch (error) {
    if (!connection) return sendDatabaseError(res, error, 'Update Admin User Resources');
    return handleMutationError(res, connection, error, 'Update Admin User Resources');
  } finally {
    if (connection) connection.release();
  }
};

export const clearAdminUserLoginLock = async (req, res) => {
  const userId = parseUserId(req.params.userId);
  if (!userId) return res.status(400).json({ message: 'ID tài khoản không hợp lệ.' });

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const activeAdmins = await lockActiveAdmins(connection);
    ensureActorIsActiveAdmin(activeAdmins, req.user.id);
    const target = await findTargetUser(connection, userId);
    if (!target) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    await connection.execute(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      [userId]
    );
    await writeAuditLog(connection, {
      actorUserId: req.user.id,
      targetUserId: userId,
      action: 'LOGIN_LOCK_CLEARED',
      oldRole: target.role,
      newRole: target.role,
      details: { username: target.username },
    });
    await connection.commit();
    return res.status(200).json({ message: 'Đã gỡ khóa đăng nhập và đặt lại số lần đăng nhập sai.' });
  } catch (error) {
    if (!connection) return sendDatabaseError(res, error, 'Clear Admin User Login Lock');
    return handleMutationError(res, connection, error, 'Clear Admin User Login Lock');
  } finally {
    if (connection) connection.release();
  }
};

export const getAdminAuditLogs = async (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
  const limit = Math.min(50, Math.max(1, requestedLimit));

  try {
    const [logs] = await pool.execute(
      `SELECT log.id, log.action, log.old_role, log.new_role, log.details, log.created_at,
              actor.username AS actor_username,
              target.username AS target_username,
              log.target_user_id
       FROM user_audit_logs log
       LEFT JOIN users actor ON actor.id = log.actor_user_id
       LEFT JOIN users target ON target.id = log.target_user_id
       ORDER BY log.created_at DESC, log.id DESC
       LIMIT ?`,
      [limit]
    );

    return res.status(200).json({ logs });
  } catch (error) {
    return sendDatabaseError(res, error, 'Get Admin Audit Logs');
  }
};
