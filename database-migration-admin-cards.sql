-- Migrate the card catalog for admin management.
-- Existing cards remain active; names are unique using the database collation.
USE anime_cyber_gacha;

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'cards'
      AND column_name = 'is_active'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE cards ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER image_url',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'cards'
      AND index_name = 'uq_cards_name'
);
SET @sql = IF(
    @index_exists = 0,
    'ALTER TABLE cards ADD UNIQUE KEY uq_cards_name (name)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
