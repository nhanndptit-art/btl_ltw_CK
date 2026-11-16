-- Migration: bổ sung nền tảng phân quyền và bảo vệ tài khoản
-- Chạy sau database.sql trên MySQL 8+.
-- Migration này không tạo tài khoản admin mẫu và không lưu khách ẩn danh.

USE anime_cyber_gacha;

-- Tất cả tài khoản hiện có được giữ ở quyền user.
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'role'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE users ADD COLUMN role ENUM(''user'', ''admin'') NOT NULL DEFAULT ''user'' AFTER password_hash',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'email'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL AFTER username',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND index_name = 'uq_users_email'
);
SET @sql = IF(
    @index_exists = 0,
    'ALTER TABLE users ADD UNIQUE KEY uq_users_email (email)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'status'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE users ADD COLUMN status ENUM(''active'', ''disabled'') NOT NULL DEFAULT ''active'' AFTER role',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'last_login_at'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL AFTER status',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'password_changed_at'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP NULL AFTER last_login_at',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backend dùng các cột này để khóa tạm thời theo cấp độ sau nhiều lần sai.
-- Ví dụ chính sách có thể là: 5 lần -> 5 phút, 10 lần -> 30 phút,
-- 15 lần -> 24 giờ. Giá trị thời gian cụ thể thuộc về backend.
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'failed_login_attempts'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE users ADD COLUMN failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0 AFTER password_changed_at',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'locked_until'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL AFTER failed_login_attempts',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'updated_at'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Nhật ký thay đổi tài khoản/quyền. actor_user_id có thể NULL cho thao tác
-- tự động bởi hệ thống hoặc khi tài khoản thực hiện thao tác đã bị xóa.
CREATE TABLE IF NOT EXISTS user_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_user_id INT NULL,
    target_user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    old_role ENUM('user', 'admin') NULL,
    new_role ENUM('user', 'admin') NULL,
    details JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_audit_target_created (target_user_id, created_at),
    KEY idx_audit_actor_created (actor_user_id, created_at),
    CONSTRAINT fk_audit_actor
        FOREIGN KEY (actor_user_id) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_audit_target
        FOREIGN KEY (target_user_id) REFERENCES users(id)
        ON DELETE SET NULL
);

-- Dữ liệu cũ không có thời điểm đổi mật khẩu; lấy thời điểm tạo tài khoản
-- làm mốc ban đầu để các chức năng bảo mật có dữ liệu nhất quán.
UPDATE users
SET password_changed_at = created_at
WHERE password_changed_at IS NULL;
