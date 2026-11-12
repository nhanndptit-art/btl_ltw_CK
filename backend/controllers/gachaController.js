import pool from '../config/db.js';

const COST_PER_PULL = 160;
const HARD_PITY_LIMIT = 90;

// Bảng trọng số độ hiếm (Tổng = 1000 -> Tương ứng 1.5%, 8.5%, 30%, 60%)
const RARITY_WEIGHTS = [
  { rarity: 'Legendary', weight: 15 },
  { rarity: 'Epic', weight: 85 },
  { rarity: 'Rare', weight: 300 },
  { rarity: 'Common', weight: 600 },
];

/**
- Hàm chọn độ hiếm dựa trên thuật toán Weighted Random
 */
const rollRarityByWeight = () => {
  const totalWeight = RARITY_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let randomValue = Math.random() * totalWeight;

  for (const item of RARITY_WEIGHTS) {
    if (randomValue < item.weight) {
      return item.rarity;
    }
    randomValue -= item.weight;
  }
  return 'Common';
};

/**
- Hàm chọn 1 thẻ bài cụ thể trong danh sách thẻ cùng độ hiếm dựa trên trọng số (weight) của thẻ
 */
const pickCardFromPool = (cardsOfRarity) => {
  const totalCardWeight = cardsOfRarity.reduce((sum, card) => sum + card.weight, 0);
  let randomValue = Math.random() * totalCardWeight;

  for (const card of cardsOfRarity) {
    if (randomValue < card.weight) {
      return card;
    }
    randomValue -= card.weight;
  }
  return cardsOfRarity[0];
};

export const rollGacha = async (req, res) => {
  const { userId, pullCount } = req.body;
  const count = Number(pullCount);

  if (!userId || (count !== 1 && count !== 10)) {
    return res.status(400).json({
      message: 'Yêu cầu quay không hợp lệ (Chỉ hỗ trợ quay x1 hoặc x10).',
    });
  }

  const totalCost = count * COST_PER_PULL;
  const connection = await pool.getConnection();

  try {
    // BẮT ĐẦU SQL TRANSACTION
    await connection.beginTransaction();

    // 1. Khóa dòng user (FOR UPDATE) để tránh gian lận bấm nhiều tab cùng lúc
    const [userRows] = await connection.execute(
      'SELECT id, username, gems, pity_count FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );

    if (userRows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const user = userRows[0];

    if (user.gems < totalCost) {
      throw new Error('INSUFFICIENT_GEMS');
    }

    // 2. Lấy toàn bộ danh sách thẻ bài từ DB và gom nhóm theo Rarity
    const [allCards] = await connection.execute(
      'SELECT id, name, title, rarity, element, weight, base_atk, base_def, image_url FROM cards'
    );

    const cardPools = {
      Legendary: allCards.filter((c) => c.rarity === 'Legendary'),
      Epic: allCards.filter((c) => c.rarity === 'Epic'),
      Rare: allCards.filter((c) => c.rarity === 'Rare'),
      Common: allCards.filter((c) => c.rarity === 'Common'),
    };

    // 3. Thực hiện vòng lặp quay thẻ (x1 hoặc x10) kết hợp kiểm tra Pity
    let currentPity = user.pity_count;
    const pulledCards = [];

    for (let i = 0; i < count; i += 1) {
      currentPity += 1;
      let selectedRarity = '';
      let isPityTriggered = false;

      // LOGIC BẢO HIỂM (PITY SYSTEM):
      // Nếu đã quay 89 lần chưa ra Legendary, lần thứ 90 chắc chắn 100% nổ Legendary
      if (currentPity >= HARD_PITY_LIMIT) {
        selectedRarity = 'Legendary';
        isPityTriggered = true;
      } else {
        selectedRarity = rollRarityByWeight();
      }

      // Nếu kết quả ra Legendary (dù do Pity hay trúng tự nhiên), reset Pity về 0
      const pityAtPull = currentPity;
      if (selectedRarity === 'Legendary') {
        currentPity = 0;
      }

      const selectedCard = pickCardFromPool(cardPools[selectedRarity]);

      pulledCards.push({
        ...selectedCard,
        pity_at_pull: pityAtPull,
        is_pity_triggered: isPityTriggered,
      });
    }

    // 4. Trừ Gems và cập nhật bộ đếm Pity mới cho User
    const updatedGems = user.gems - totalCost;
    await connection.execute(
      'UPDATE users SET gems = ?, pity_count = ? WHERE id = ?',
      [updatedGems, currentPity, userId]
    );

    // 5. Cập nhật Kho đồ (user_inventory) và ghi 1 log cho toàn bộ lượt quay
    for (const pulled of pulledCards) {
      await connection.execute(
        `INSERT INTO user_inventory (user_id, card_id, quantity)
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
        [userId, pulled.id]
      );
    }

    await connection.execute(
      `INSERT INTO gacha_logs (user_id, roll_results)
       VALUES (?, ?)`,
      [
        userId,
        JSON.stringify(
          pulledCards.map((pulled) => ({
            item_id: pulled.id,
            rarity: pulled.rarity,
            pity_at_pull: pulled.pity_at_pull,
            is_pity_triggered: pulled.is_pity_triggered,
          }))
        ),
      ]
    );

    // 6. Lấy lại toàn bộ Inventory mới nhất của User sau khi thêm thẻ
    const [updatedInventory] = await connection.execute(
      `SELECT c.id, c.name, c.title, c.rarity, c.element, c.base_atk, c.base_def, c.image_url, ui.quantity, ui.star_level
      FROM user_inventory ui
      INNER JOIN cards c ON ui.card_id = c.id
      WHERE ui.user_id = ?
      ORDER BY FIELD(c.rarity, 'Legendary', 'Epic', 'Rare', 'Common'), ui.quantity DESC`,
      [userId]
    );

    // HOÀN TẤT TRANSACTION
    await connection.commit();

    return res.status(200).json({
      message: `Triệu hồi x${count} thành công!`,
      results: pulledCards,
      userState: {
        gems: updatedGems,
        pity_count: currentPity,
      },
      inventory: updatedInventory,
    });
  } catch (error) {
    // ROLLBACK NẾU CÓ BẤT KỲ LỖI NÀO XẢY RA
    await connection.rollback();

    if (error.message === 'INSUFFICIENT_GEMS') {
      return res.status(400).json({
        message: `Không đủ Gems! Cần ${totalCost} Gems để thực hiện triệu hồi x${count}.`,
      });
    }
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản người dùng.' });
    }

    console.error('Gacha Transaction Error:', error);
    return res.status(500).json({
      message: 'Giao dịch Gacha thất bại, dữ liệu đã được Rollback an toàn.',
    });
  } finally {
    connection.release();
  }
};

export const getGachaHistory = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = 10;

    if (!userId) {
      return res.status(400).json({ message: 'Tài khoản người dùng không hợp lệ.' });
    }

    const [rows] = await pool.execute(
      `SELECT
         COALESCE(gl.roll_batch_id, CONCAT('legacy-', gl.id)) AS batch_id,
         DATE_FORMAT(
           CONVERT_TZ(gl.pulled_at, '+00:00', '+07:00'),
           '%Y-%m-%dT%H:%i:%s+07:00'
         ) AS pulled_at,
         gl.roll_results
       FROM gacha_logs gl
       WHERE gl.user_id = ?
       ORDER BY gl.pulled_at DESC, gl.id DESC`,
      [userId]
    );

    const [cards] = await pool.execute(
      `SELECT id, name, title, rarity, element, base_atk, base_def, image_url
       FROM cards`
    );
    const cardsById = new Map(cards.map((card) => [card.id, card]));

    const batches = [];
    const batchMap = new Map();

    for (const row of rows) {
      const results = typeof row.roll_results === 'string'
        ? JSON.parse(row.roll_results)
        : row.roll_results;
      const pulledCards = Array.isArray(results) ? results : [];

      const batch = {
        id: row.batch_id,
        pulled_at: row.pulled_at,
        pull_count: pulledCards.length,
        cards: pulledCards.map((result) => ({
          ...(cardsById.get(result.item_id) || {
            id: result.item_id,
            name: `CARD #${result.item_id}`,
            title: 'Unknown card',
            rarity: result.rarity,
          }),
          pity_at_pull: result.pity_at_pull,
          is_pity_triggered: Boolean(result.is_pity_triggered),
        })),
      };

      batchMap.set(row.batch_id, batch);
      batches.push(batch);
    }

    const total = batches.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;

    return res.status(200).json({
      history: batches.slice(start, start + pageSize),
      pagination: { page: currentPage, pageSize, total, totalPages },
    });
  } catch (error) {
    console.error('Get Gacha History Error:', error);
    return res.status(500).json({ message: 'Lỗi khi tải lịch sử triệu hồi.' });
  }
};
