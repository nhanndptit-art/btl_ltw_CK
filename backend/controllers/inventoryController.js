import pool from '../config/db.js';

export const getUserInventory = async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.execute(
      `SELECT c.id, c.name, c.title, c.rarity, c.element, c.base_atk, c.base_def, c.image_url, ui.quantity
       FROM user_inventory ui
       INNER JOIN cards c ON ui.card_id = c.id
       WHERE ui.user_id = ?
       ORDER BY FIELD(c.rarity, 'Legendary', 'Epic', 'Rare', 'Common'), ui.quantity DESC`,
      [userId]
    );

    return res.status(200).json({ inventory: rows });
  } catch (error) {
    console.error('Get Inventory Error:', error);
    return res.status(500).json({ message: 'Lỗi khi tải kho thẻ bài.' });
  }
};
