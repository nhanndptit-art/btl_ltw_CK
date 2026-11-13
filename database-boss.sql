USE anime_cyber_gacha;

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
)
SELECT *
FROM (
    SELECT 1, 'BOSS', 'SCRAP HOUND // MK-I', 'Perimeter Patrol Drone', 'KINETIC', 250, 220, 'NONE', NULL, 'Không có cơ chế đặc biệt. Phù hợp thử nghiệm đội hình tân thủ.', 160, 15, 0
    UNION ALL SELECT 2, 'BOSS', 'RIOT ENFORCER // V2', 'Sector 4 Suppression Unit', 'THERMAL', 650, 550, 'NONE', NULL, 'Giáp cơ bản. Khuyên dùng từ 2 thẻ bài trở lên.', 200, 15, 0
    UNION ALL SELECT 3, 'BOSS', 'SUBNET SENTINEL', 'Blackwall Gatekeeper', 'CYBER', 1100, 950, 'NONE', NULL, 'Hỏa lực tầm trung. Cần đội hình 3-4 thẻ bài ổn định.', 250, 20, 0
    UNION ALL SELECT 4, 'BOSS', 'VOLT CONDUCTOR', 'High-Voltage Relay Core', 'VOLT', 1550, 1250, 'ELEMENT_SHIELD', 'KINETIC', 'Cần ít nhất 1 thẻ hệ KINETIC để phá khiên.', 320, 20, 0
    UNION ALL SELECT 5, 'BOSS', 'SONIC BANSHEE', 'Acoustic Distortion Engine', 'SONIC', 1950, 1550, 'ELEMENT_SHIELD', 'CYBER', 'Cần ít nhất 1 thẻ hệ CYBER để giải mã sóng âm.', 400, 25, 0
    UNION ALL SELECT 6, 'BOSS', 'PYRO JUGGERNAUT', 'Thermal Reactor Titan', 'THERMAL', 2350, 1850, 'ELEMENT_SHIELD', 'SONIC', 'Cần ít nhất 1 thẻ hệ SONIC để triệt tiêu lõi nhiệt.', 500, 25, 0
    UNION ALL SELECT 7, 'BOSS', 'BLACKWALL WARDEN', 'Neural Firewall Avatar', 'CYBER', 2750, 2150, 'ELEMENT_SHIELD', 'VOLT', 'Cần ít nhất 1 thẻ hệ VOLT để làm quá tải tường lửa.', 640, 30, 0
    UNION ALL SELECT 8, 'BOSS', 'AETHER SERAPH // ECHO', 'Orbital Defense Construct', 'AETHER', 3250, 2450, 'DUAL_CORE_SHIELD', 'PLASMA', 'Cần tối thiểu 2 thẻ hệ PLASMA để phá lõi.', 800, 35, 0
    UNION ALL SELECT 9, 'BOSS', 'PLASMA OVERLORD', 'Reactor Core Sovereign', 'PLASMA', 3750, 2750, 'DUAL_CORE_SHIELD', 'AETHER', 'Cần tối thiểu 2 thẻ hệ AETHER để trung hòa trường plasma.', 1000, 40, 0
    UNION ALL SELECT 10, 'BOSS', 'OMEGA // ARCHITECT', 'Apex Neural Overdrive', 'PLASMA', 4300, 3100, 'DUAL_CORE_SHIELD', 'AETHER', 'Cần tối thiểu 2 thẻ hệ AETHER và đội hình chỉ số cực đại.', 1600, 50, 0
) AS seed (
    floor_number, stage_type, name, title, element,
    req_atk, req_def, mech_type, mech_element, mech_description,
    first_clear_gems, repeat_gems, stamina_cost
)
WHERE NOT EXISTS (
    SELECT 1 FROM bosses b WHERE b.floor_number = seed.floor_number
);
