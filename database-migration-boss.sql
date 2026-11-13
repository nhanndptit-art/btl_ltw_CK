USE anime_cyber_gacha;

SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'highest_boss_floor'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE users ADD COLUMN highest_boss_floor INT NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'user_inventory'
    AND column_name = 'star_level'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE user_inventory ADD COLUMN star_level INT NOT NULL DEFAULT 1',
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
    AND column_name = 'stamina'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE users ADD COLUMN stamina INT NOT NULL DEFAULT 100',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
