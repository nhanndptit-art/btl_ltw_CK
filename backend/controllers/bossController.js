import pool from '../config/db.js';

// Quy tắc khắc chế 7 nguyên tố:
// Vòng 5 hệ: THERMAL -> KINETIC -> VOLT -> CYBER -> SONIC -> THERMAL
// Cặp đối nghịch: PLASMA <-> AETHER
const ELEMENT_ADVANTAGE = {
  THERMAL: 'KINETIC',
  KINETIC: 'VOLT',
  VOLT: 'CYBER',
  CYBER: 'SONIC',
  SONIC: 'THERMAL',
  PLASMA: 'AETHER',
  AETHER: 'PLASMA',
};

const getElementMultiplier = (attackerElement, defenderElement) => {
  if (ELEMENT_ADVANTAGE[attackerElement] === defenderElement) return 1.5; // Khắc hệ
  if (ELEMENT_ADVANTAGE[defenderElement] === attackerElement) return 0.75; // Bị khắc
  return 1.0; // Trung tính
};

// ============================================================================
// API 1: LẤY DANH SÁCH 10 TẦNG BOSS VÀ TRẠNG THÁI MỞ KHÓA
// ============================================================================
export const getBossFloors = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ message: 'Định danh người dùng không hợp lệ.' });
    }

    const [userRows] = await pool.execute(
      'SELECT highest_boss_floor, stamina FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    const user = userRows[0];
    const [bosses] = await pool.execute('SELECT * FROM bosses ORDER BY floor_number ASC');

    const formattedBosses = bosses.map((boss) => {
      let status = 'LOCKED';
      let rewardGems = boss.first_clear_gems;

      if (boss.floor_number <= user.highest_boss_floor) {
        status = 'CLEARED';
        rewardGems = boss.repeat_gems;
      } else if (boss.floor_number === user.highest_boss_floor + 1) {
        status = 'AVAILABLE';
        rewardGems = boss.first_clear_gems;
      }

      return {
        ...boss,
        status,
        next_reward_gems: rewardGems,
      };
    });

    return res.status(200).json({
      highest_boss_floor: user.highest_boss_floor,
      stamina: user.stamina,
      bosses: formattedBosses,
    });
  } catch (error) {
    console.error('Lỗi Get Boss Floors:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi tải Tháp Boss.' });
  }
};

// ============================================================================
// API 2: XỬ LÝ KHIÊU CHIẾN BOSS VÀ TÍNH TOÁN SÁT THƯƠNG
// ============================================================================
export const battleBoss = async (req, res) => {
  const floorNumber = Number(req.params.floorNumber);
  const { userId, cardIds } = req.body;

  if (!userId || !floorNumber) {
    return res.status(400).json({ message: 'Thiếu thông tin người dùng hoặc tầng Boss.' });
  }

  // Validate đội hình: 1-4 thẻ, KHÔNG trùng lặp
  if (!Array.isArray(cardIds) || cardIds.length < 1 || cardIds.length > 4) {
    return res.status(400).json({ message: 'Đội hình xuất trận phải từ 1 đến 4 thẻ bài.' });
  }

  const numericCardIds = cardIds.map(Number);
  if (new Set(numericCardIds).size !== numericCardIds.length) {
    return res.status(400).json({ message: 'Mỗi thẻ bài chỉ được xuất hiện 1 lần trong đội hình.' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Khóa dòng user (FOR UPDATE) để an toàn giao dịch cộng Gem
    const [userRows] = await connection.execute(
      'SELECT id, gems, highest_boss_floor, stamina FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );

    if (userRows.length === 0) throw new Error('USER_NOT_FOUND');
    const user = userRows[0];

    // 2. Lấy thông tin Boss & Kiểm tra mở khóa tuần tự
    const [bossRows] = await connection.execute(
      'SELECT * FROM bosses WHERE floor_number = ?',
      [floorNumber]
    );

    if (bossRows.length === 0) throw new Error('BOSS_NOT_FOUND');
    const boss = bossRows[0];

    if (boss.floor_number > user.highest_boss_floor + 1) {
      throw new Error('FLOOR_LOCKED');
    }

    // 3. Lấy chỉ số gốc của các thẻ đang sở hữu từ DB (chống gian lận sửa tham số)
    const placeholders = numericCardIds.map(() => '?').join(', ');
    const [ownedCards] = await connection.execute(
      `SELECT c.id, c.name, c.element, c.base_atk, c.base_def, ui.star_level
       FROM user_inventory ui
       INNER JOIN cards c ON ui.card_id = c.id
       WHERE ui.user_id = ? AND ui.card_id IN (${placeholders})`,
      [userId, ...numericCardIds]
    );

    if (ownedCards.length !== numericCardIds.length) {
      throw new Error('CARD_NOT_OWNED');
    }

    // 4. BƯỚC TÍNH TOÁN (A): Tổng hợp chỉ số và hệ số nguyên tố
    const battleLogs = [`[INIT] KHỞI TẠO TẦNG ${String(boss.floor_number).padStart(2, '0')}: ${boss.name} [${boss.element}]`];
    let rawTeamAtk = 0;
    let totalTeamDef = 0;

    const unitBreakdowns = ownedCards.map((card) => {
      const starLevel = card.star_level || 1;
      const starMult = 1 + (starLevel - 1) * 0.2; // +20% mỗi cấp sao
      const elemMult = getElementMultiplier(card.element, boss.element);

      const finalAtk = Math.round(card.base_atk * starMult * elemMult);
      const finalDef = Math.round(card.base_def * starMult);

      rawTeamAtk += finalAtk;
      totalTeamDef += finalDef;

      let tag = 'TRUNG TÍNH (1.0x)';
      if (elemMult > 1) tag = 'KHẮC CHẾ (1.5x)';
      if (elemMult < 1) tag = 'BỊ KHẮC (0.75x)';

      battleLogs.push(`[UNIT] ${card.name} (${card.element}|★${starLevel}) -> ATK: ${finalAtk} [${tag}] | DEF: ${finalDef}`);
      
      return { id: card.id, name: card.name, element: card.element, finalAtk, finalDef };
    });

    // 5. BƯỚC TÍNH TOÁN (B): Cơ chế phá Mech
    let mechBroken = true;
    let effectiveTeamAtk = rawTeamAtk;
    let effectiveReqDef = boss.req_def;

    if (boss.mech_type === 'ELEMENT_SHIELD') {
      const counters = ownedCards.filter((c) => c.element === boss.mech_element).length;
      if (counters >= 1) {
        effectiveTeamAtk = Math.round(rawTeamAtk * 1.15);
        battleLogs.push(`[MECH // BROKEN] Phá khiên bằng hệ ${boss.mech_element}! Tổng ATK tăng +15% -> ${effectiveTeamAtk}.`);
      } else {
        mechBroken = false;
        effectiveTeamAtk = Math.round(rawTeamAtk * 0.6);
        battleLogs.push(`[MECH // FAILED] Thiếu hệ ${boss.mech_element} phá khiên. ATK giảm 40% -> ${effectiveTeamAtk}.`);
      }
    } else if (boss.mech_type === 'DUAL_CORE_SHIELD') {
      const counters = ownedCards.filter((c) => c.element === boss.mech_element).length;
      if (counters >= 2) {
        effectiveTeamAtk = Math.round(rawTeamAtk * 1.2);
        battleLogs.push(`[MECH // OVERDRIVE] Phá lõi kép bằng ${counters} thẻ hệ ${boss.mech_element}! ATK tăng +20% -> ${effectiveTeamAtk}.`);
      } else {
        mechBroken = false;
        effectiveTeamAtk = Math.round(rawTeamAtk * 0.5);
        effectiveReqDef = Math.round(boss.req_def * 1.2);
        battleLogs.push(`[MECH // CRITICAL] Cần 2 thẻ hệ ${boss.mech_element}. ATK giảm 50% (${effectiveTeamAtk}), DEF yêu cầu tăng (${effectiveReqDef}).`);
      }
    }

    // 6. BƯỚC TÍNH TOÁN (C): Phán quyết Thắng/Thua
    const isDefPassed = totalTeamDef >= effectiveReqDef;
    const isAtkPassed = effectiveTeamAtk >= boss.req_atk;
    const isVictory = isDefPassed && isAtkPassed;

    battleLogs.push(`[CHECK // DEF] Giáp đội hình: ${totalTeamDef} / Yêu cầu: ${effectiveReqDef} -> ${isDefPassed ? 'ĐẠT' : 'KHÔNG ĐỦ GIÁP'}`);
    battleLogs.push(`[CHECK // ATK] Hỏa lực đội hình: ${effectiveTeamAtk} / Yêu cầu: ${boss.req_atk} -> ${isAtkPassed ? 'ĐẠT' : 'THIẾU SÁT THƯƠNG'}`);

    let gemsEarned = 0;
    let isFirstClear = false;
    let updatedGems = user.gems;
    let updatedHighestFloor = user.highest_boss_floor;

    if (isVictory) {
      isFirstClear = boss.floor_number > user.highest_boss_floor;
      gemsEarned = isFirstClear ? boss.first_clear_gems : boss.repeat_gems;
      updatedGems = user.gems + gemsEarned;
      updatedHighestFloor = Math.max(user.highest_boss_floor, boss.floor_number);

      // Lưu giao dịch cộng Gem
      await connection.execute(
        'UPDATE users SET gems = ?, highest_boss_floor = ? WHERE id = ?',
        [updatedGems, updatedHighestFloor, userId]
      );
      battleLogs.push(`[RESULT // VICTORY] Tiêu diệt thành công! Nhận +${gemsEarned} GEMS.`);
    } else {
      battleLogs.push(`[RESULT // DEFEAT] Đội hình rút lui. Không tiêu hao tài nguyên.`);
    }

    await connection.commit();

    return res.status(200).json({
      victory: isVictory,
      isFirstClear,
      gemsEarned,
      summary: {
        rawTeamAtk, effectiveTeamAtk, reqAtk: boss.req_atk,
        totalTeamDef, effectiveReqDef,
        mechBroken, isAtkPassed, isDefPassed
      },
      battleLogs,
      unitBreakdowns,
      userState: { gems: updatedGems, highest_boss_floor: updatedHighestFloor }
    });

  } catch (error) {
    await connection.rollback();

    // Map lỗi đúng chuẩn HTTP Codes của giáo viên yêu cầu
    const errMap = {
      USER_NOT_FOUND: [404, 'Không tìm thấy tài khoản.'],
      BOSS_NOT_FOUND: [404, 'Tầng Boss không tồn tại.'],
      FLOOR_LOCKED: [403, 'Tầng bị khóa. Vui lòng vượt tầng trước đó.'],
      CARD_NOT_OWNED: [400, 'Đội hình chứa thẻ bài bạn chưa sở hữu.']
    };

    if (errMap[error.message]) {
      const [status, msg] = errMap[error.message];
      return res.status(status).json({ message: msg });
    }

    console.error('Lỗi Battle Boss:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi mô phỏng trận đánh.' });
  } finally {
    connection.release();
  }
};