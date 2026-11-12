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
    highest_boss_floor INT NOT NULL DEFAULT 0,
    stamina INT NOT NULL DEFAULT 100,
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
    star_level INT NOT NULL DEFAULT 1,
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
    roll_batch_id CHAR(36) NULL,
    roll_results JSON NOT NULL,
    pulled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Nếu database đã được tạo trước khi có lịch sử theo batch, chạy:
-- ALTER TABLE gacha_logs ADD COLUMN roll_batch_id CHAR(36) NULL AFTER user_id;

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

CREATE TABLE IF NOT EXISTS bosses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    floor_number INT NOT NULL UNIQUE,
    stage_type VARCHAR(20) NOT NULL DEFAULT 'BOSS',
    name VARCHAR(100) NOT NULL,
    title VARCHAR(120) NOT NULL,
    element VARCHAR(30) NOT NULL,
    req_atk INT NOT NULL,
    req_def INT NOT NULL,
    mech_type ENUM('NONE', 'ELEMENT_SHIELD', 'DUAL_CORE_SHIELD') NOT NULL DEFAULT 'NONE',
    mech_element VARCHAR(30) NULL,
    mech_description VARCHAR(255) NULL,
    first_clear_gems INT NOT NULL,
    repeat_gems INT NOT NULL,
    stamina_cost INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255) NULL
);

INSERT INTO bosses (
  floor_number, stage_type, name, title, element,
  req_atk, req_def, mech_type, mech_element, mech_description,
  first_clear_gems, repeat_gems, stamina_cost
) VALUES
(1, 'BOSS', 'SCRAP HOUND // MK-I', 'Perimeter Patrol Drone', 'KINETIC', 250, 220, 'NONE', NULL, 'Không có cơ chế đặc biệt. Phù hợp thử nghiệm đội hình tân thủ.', 160, 15, 0),
(2, 'BOSS', 'RIOT ENFORCER // V2', 'Sector 4 Suppression Unit', 'THERMAL', 650, 550, 'NONE', NULL, 'Giáp cơ bản. Khuyên dùng từ 2 thẻ bài trở lên.', 200, 15, 0),
(3, 'BOSS', 'SUBNET SENTINEL', 'Blackwall Gatekeeper', 'CYBER', 1100, 950, 'NONE', NULL, 'Hỏa lực tầm trung. Cần đội hình 3-4 thẻ bài ổn định.', 250, 20, 0),
(4, 'BOSS', 'VOLT CONDUCTOR', 'High-Voltage Relay Core', 'VOLT', 1550, 1250, 'ELEMENT_SHIELD', 'KINETIC', 'KHIÊN NGUYÊN TỐ: Cần ít nhất 1 thẻ hệ KINETIC để phá khiên (nếu không bị giảm 40% ATK).', 320, 20, 0),
(5, 'BOSS', 'SONIC BANSHEE', 'Acoustic Distortion Engine', 'SONIC', 1950, 1550, 'ELEMENT_SHIELD', 'CYBER', 'KHIÊN NGUYÊN TỐ: Cần ít nhất 1 thẻ hệ CYBER để giải mã sóng âm.', 400, 25, 0),
(6, 'BOSS', 'PYRO JUGGERNAUT', 'Thermal Reactor Titan', 'THERMAL', 2350, 1850, 'ELEMENT_SHIELD', 'SONIC', 'KHIÊN NGUYÊN TỐ: Cần ít nhất 1 thẻ hệ SONIC để triệt tiêu lõi nhiệt.', 500, 25, 0),
(7, 'BOSS', 'BLACKWALL WARDEN', 'Neural Firewall Avatar', 'CYBER', 2750, 2150, 'ELEMENT_SHIELD', 'VOLT', 'KHIÊN NGUYÊN TỐ: Cần ít nhất 1 thẻ hệ VOLT để làm quá tải tường lửa.', 640, 30, 0),
(8, 'BOSS', 'AETHER SERAPH // ECHO', 'Orbital Defense Construct', 'AETHER', 3250, 2450, 'DUAL_CORE_SHIELD', 'PLASMA', 'LÕI KÉP: Cần tối thiểu 2 thẻ hệ PLASMA để phá lõi (nếu không giảm 50% ATK & tăng 20% DEF Boss).', 800, 35, 0),
(9, 'BOSS', 'PLASMA OVERLORD', 'Reactor Core Sovereign', 'PLASMA', 3750, 2750, 'DUAL_CORE_SHIELD', 'AETHER', 'LÕI KÉP: Cần tối thiểu 2 thẻ hệ AETHER để trung hòa trường plasma.', 1000, 40, 0),
(10, 'BOSS', 'OMEGA // ARCHITECT', 'Apex Neural Overdrive', 'PLASMA', 4300, 3100, 'DUAL_CORE_SHIELD', 'AETHER', 'TRÙM CUỐI: Cần tối thiểu 2 thẻ hệ AETHER và đội hình chỉ số cực đại.', 1600, 50, 0);