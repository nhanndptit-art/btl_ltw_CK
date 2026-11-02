CREATE DATABASE IF NOT EXISTS anime_cyber_gacha
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE anime_cyber_gacha;

-- 1. Bảng người dùng (Quản lý Auth, Số dư Gem và Bộ đếm Pity)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    gems INT NOT NULL DEFAULT 3200,
    pity_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng danh mục Thẻ bài Nhân vật
CREATE TABLE IF NOT EXISTS cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(120) NOT NULL,
    rarity ENUM('Common', 'Rare', 'Epic', 'Legendary') NOT NULL,
    element VARCHAR(30) NOT NULL,
    weight INT NOT NULL DEFAULT 100,
    base_atk INT NOT NULL DEFAULT 100,
    base_def INT NOT NULL DEFAULT 100,
    image_url VARCHAR(255) NOT NULL
);

-- 3. Bảng Kho đồ người dùng (Cộng dồn quantity nếu quay trùng thẻ)
CREATE TABLE IF NOT EXISTS user_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    card_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    first_obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_card (user_id, card_id),
    CONSTRAINT fk_inventory_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- 4. Bảng Lịch sử quay Gacha
CREATE TABLE IF NOT EXISTS gacha_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    card_id INT NOT NULL,
    rarity_pulled ENUM('Common', 'Rare', 'Epic', 'Legendary') NOT NULL,
    pity_at_pull INT NOT NULL,
    is_pity_triggered TINYINT(1) NOT NULL DEFAULT 0,
    pulled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_logs_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- ============================================================================
-- INSERT DỮ LIỆU MẪU: THẺ BÀI NHÂN VẬT (Đầy đủ 4 độ hiếm)
-- Lưu ý: Bạn có thể thay đường dẫn ở cột image_url bằng ảnh trong /assets/cards/
-- ============================================================================
INSERT INTO cards (name, title, rarity, element, weight, base_atk, base_def, image_url) VALUES
-- LEGENDARY (1.5% tổng tỉ lệ rơi)
('AKIRA // ZERO', 'Phantom Blade of Sector 9', 'Legendary', 'PLASMA', 50, 980, 740, '/assets/cards/akira_zero.webp'),
('SERAPHINA VEX', 'Neural Valkyrie', 'Legendary', 'AETHER', 50, 940, 810, '/assets/cards/seraphina_vex.webp'),

-- EPIC (8.5% tổng tỉ lệ rơi)
('KAITO RYU', 'Overclock Ronin', 'Epic', 'VOLT', 100, 760, 590, '/assets/cards/kaito_ryu.webp'),
('NYX CHROME', 'Blackwall Netrunner', 'Epic', 'CYBER', 100, 810, 520, '/assets/cards/nyx_chrome.webp'),
('VALERIA KROWN', 'Heavy Ordinance Enforcer', 'Epic', 'THERMAL', 100, 720, 680, '/assets/cards/valeria_krown.webp'),

-- RARE (30.0% tổng tỉ lệ rơi)
('SHINJI PULSE', 'Street Samurai Recon', 'Rare', 'VOLT', 100, 540, 430, '/assets/cards/shinji_pulse.webp'),
('LYRA SYNTH', 'Acoustic Hacker', 'Rare', 'SONIC', 100, 510, 460, '/assets/cards/lyra_synth.webp'),
('DANTE IRON', 'Riot Shield Vanguard', 'Rare', 'KINETIC', 100, 480, 590, '/assets/cards/dante_iron.webp'),
('MIRA GLITCH', 'Sub- Grid Courier', 'Rare', 'CYBER', 100, 560, 410, '/assets/cards/mira_glitch.webp'),

-- COMMON (60.0% tổng tỉ lệ rơi)
('DRONE UNIT-01', 'Automated Patrol Core', 'Common', 'KINETIC', 100, 310, 280, '/assets/cards/drone_01.webp'),
('SECTOR GUARD', 'Militech Grunt', 'Common', 'KINETIC', 100, 340, 310, '/assets/cards/sector_guard.webp'),
('SCAV RUNNER', 'Alleyway Scavenger', 'Common', 'THERMAL', 100, 360, 250, '/assets/cards/scav_runner.webp'),
('DATA COURIER', 'Low-Level Proxy', 'Common', 'CYBER', 100, 290, 300, '/assets/cards/data_courier.webp'),
('MEDIC BOT-X', 'Field Repair Android', 'Common', 'AETHER', 100, 270, 350, '/assets/cards/medic_bot.webp');

-- ============================================================================
-- INSERT USER MẪU
-- Username: cyber_runner | Password gốc: 123456
-- SHA-256 của '123456' là: 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
-- pity_count được đặt sẵn = 85 để bạn quay 5 lần nữa là test được mốc Pity 90!
-- ============================================================================
INSERT INTO users (username, password_hash, gems, pity_count) VALUES
('cyber_runner', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 16000, 85);
