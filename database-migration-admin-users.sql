-- Bảng nhật ký cần cho các thao tác quản trị tài khoản.
-- Chạy sau database-migration-auth.sql; IF NOT EXISTS cho phép chạy lại an toàn.

USE anime_cyber_gacha;

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND index_name = 'idx_users_role_status'
);
SET @sql = IF(
    @index_exists = 0,
    'ALTER TABLE users ADD INDEX idx_users_role_status (role, status)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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
