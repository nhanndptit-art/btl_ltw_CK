import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import pool from '../config/db.js';
import { cardUploadDirectory } from '../middleware/cardUpload.js';

const rarities = new Set(['Common', 'Rare', 'Epic', 'Legendary']);
const cardFields = `id, name, title, rarity, element, weight, base_atk, base_def,
  image_url, is_active`;

const parseInteger = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return Number.NaN;
  const normalized = String(value).trim();
  if (!/^\d+$/.test(normalized)) return Number.NaN;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : Number.NaN;
};

const parseCardInput = (body) => {
  const source = body || {};
  const name = typeof source.name === 'string' ? source.name.trim() : '';
  const title = typeof source.title === 'string' ? source.title.trim() : '';
  const rarity = typeof source.rarity === 'string' ? source.rarity : '';
  const element = typeof source.element === 'string' ? source.element.trim() : '';
  const weight = parseInteger(source.weight);
  const baseAtk = parseInteger(source.base_atk);
  const baseDef = parseInteger(source.base_def);

  if (!name || name.length > 100) {
    return { error: 'Tên thẻ là bắt buộc và không được vượt quá 100 ký tự.' };
  }
  if (!title || title.length > 120) {
    return { error: 'Tiêu đề là bắt buộc và không được vượt quá 120 ký tự.' };
  }
  if (!rarities.has(rarity)) {
    return { error: 'Độ hiếm thẻ không hợp lệ.' };
  }
  if (!element || element.length > 30) {
    return { error: 'Hệ thẻ là bắt buộc và không được vượt quá 30 ký tự.' };
  }
  if (!Number.isSafeInteger(weight) || weight < 1 || weight > 2147483647) {
    return { error: 'Trọng số phải là số nguyên từ 1 đến 2.147.483.647.' };
  }
  if (![baseAtk, baseDef].every(
    (value) => Number.isSafeInteger(value) && value >= 0 && value <= 2147483647
  )) {
    return { error: 'ATK và DEF phải là số nguyên từ 0 đến 2.147.483.647.' };
  }

  return {
    value: {
      name,
      title,
      rarity,
      element: element.toUpperCase(),
      weight,
      base_atk: baseAtk,
      base_def: baseDef,
    },
  };
};

const getImageMimeType = async (file) => {
  const contents = await readFile(file.path);

  if (
    contents.length >= 8
    && contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (contents.length >= 3 && contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    contents.length >= 12
    && contents.toString('ascii', 0, 4) === 'RIFF'
    && contents.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return '';
};

const isValidImage = async (file) => (await getImageMimeType(file)) === file.mimetype;

const removeUploadedFile = async (file) => {
  if (!file) return;
  try {
    await unlink(file.path);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Remove Uploaded Card Image Error:', error);
    }
  }
};

const removeManagedImage = async (imageUrl) => {
  const prefix = '/uploads/cards/';
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith(prefix)) return;

  const fileName = imageUrl.slice(prefix.length);
  if (!fileName || path.basename(fileName) !== fileName) return;

  try {
    await unlink(path.join(cardUploadDirectory, fileName));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Remove Replaced Card Image Error:', error);
    }
  }
};

const isDuplicateName = async (executor, name, excludedId = null) => {
  const query = excludedId
    ? 'SELECT id FROM cards WHERE name = ? AND id <> ? LIMIT 1'
    : 'SELECT id FROM cards WHERE name = ? LIMIT 1';
  const values = excludedId ? [name, excludedId] : [name];
  const [rows] = await executor.execute(query, values);
  return rows.length > 0;
};

const isDuplicateKeyError = (error) => error.code === 'ER_DUP_ENTRY';

export const getAdminCards = async (_req, res) => {
  try {
    const [cards] = await pool.execute(
      `SELECT ${cardFields}
       FROM cards
       ORDER BY FIELD(rarity, 'Legendary', 'Epic', 'Rare', 'Common'), name`
    );
    return res.status(200).json({ cards });
  } catch (error) {
    console.error('Get Admin Cards Error:', error);
    return res.status(500).json({ message: 'Không thể tải danh sách thẻ bài.' });
  }
};

export const createAdminCard = async (req, res) => {
  let savedUpload = false;

  try {
    const parsed = parseCardInput(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn ảnh cho thẻ bài.' });
    }
    if (!(await isValidImage(req.file))) {
      return res.status(400).json({ message: 'Nội dung tệp không khớp định dạng ảnh đã chọn.' });
    }
    if (await isDuplicateName(pool, parsed.value.name)) {
      return res.status(409).json({ message: 'Tên thẻ đã tồn tại. Vui lòng chọn tên khác.' });
    }

    const imageUrl = `/uploads/cards/${req.file.filename}`;
    const [result] = await pool.execute(
      `INSERT INTO cards
       (name, title, rarity, element, weight, base_atk, base_def, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        parsed.value.name,
        parsed.value.title,
        parsed.value.rarity,
        parsed.value.element,
        parsed.value.weight,
        parsed.value.base_atk,
        parsed.value.base_def,
        imageUrl,
      ]
    );

    savedUpload = true;
    const [rows] = await pool.execute(`SELECT ${cardFields} FROM cards WHERE id = ?`, [result.insertId]);
    return res.status(201).json({ message: 'Đã thêm thẻ bài.', card: rows[0] });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: 'Tên thẻ đã tồn tại. Vui lòng chọn tên khác.' });
    }
    console.error('Create Admin Card Error:', error);
    return res.status(500).json({ message: 'Không thể thêm thẻ bài.' });
  } finally {
    if (!savedUpload) await removeUploadedFile(req.file);
  }
};

export const updateAdminCard = async (req, res) => {
  const cardId = Number(req.params.cardId);
  if (!Number.isSafeInteger(cardId) || cardId < 1) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: 'Mã thẻ bài không hợp lệ.' });
  }

  let savedUpload = false;
  let replacedImageUrl = null;
  const connection = await pool.getConnection();

  try {
    const parsed = parseCardInput(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    if (req.file && !(await isValidImage(req.file))) {
      return res.status(400).json({ message: 'Nội dung tệp không khớp định dạng ảnh đã chọn.' });
    }

    await connection.beginTransaction();
    const [cardRows] = await connection.execute(
      `SELECT id, rarity, is_active, image_url FROM cards WHERE id = ? FOR UPDATE`,
      [cardId]
    );
    if (cardRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy thẻ bài.' });
    }

    const currentCard = cardRows[0];
    if (await isDuplicateName(connection, parsed.value.name, cardId)) {
      await connection.rollback();
      return res.status(409).json({ message: 'Tên thẻ đã tồn tại. Vui lòng chọn tên khác.' });
    }

    if (currentCard.is_active && currentCard.rarity !== parsed.value.rarity) {
      const [remainingCards] = await connection.execute(
        `SELECT id FROM cards
         WHERE rarity = ? AND is_active = 1 AND id <> ?
         FOR UPDATE`,
        [currentCard.rarity, cardId]
      );
      if (remainingCards.length === 0) {
        await connection.rollback();
        return res.status(409).json({
          message: `Không thể đổi độ hiếm: cần ít nhất một thẻ ${currentCard.rarity} đang phát hành.`,
        });
      }
    }

    const imageUrl = req.file
      ? `/uploads/cards/${req.file.filename}`
      : currentCard.image_url;
    await connection.execute(
      `UPDATE cards
       SET name = ?, title = ?, rarity = ?, element = ?, weight = ?,
           base_atk = ?, base_def = ?, image_url = ?
       WHERE id = ?`,
      [
        parsed.value.name,
        parsed.value.title,
        parsed.value.rarity,
        parsed.value.element,
        parsed.value.weight,
        parsed.value.base_atk,
        parsed.value.base_def,
        imageUrl,
        cardId,
      ]
    );
    await connection.commit();
    savedUpload = Boolean(req.file);
    if (req.file) replacedImageUrl = currentCard.image_url;

    const [rows] = await pool.execute(`SELECT ${cardFields} FROM cards WHERE id = ?`, [cardId]);
    await removeManagedImage(replacedImageUrl);
    return res.status(200).json({ message: 'Đã cập nhật thẻ bài.', card: rows[0] });
  } catch (error) {
    await connection.rollback();
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: 'Tên thẻ đã tồn tại. Vui lòng chọn tên khác.' });
    }
    console.error('Update Admin Card Error:', error);
    return res.status(500).json({ message: 'Không thể cập nhật thẻ bài.' });
  } finally {
    connection.release();
    if (!savedUpload) await removeUploadedFile(req.file);
  }
};

export const updateAdminCardStatus = async (req, res) => {
  const cardId = Number(req.params.cardId);
  const { is_active: isActive } = req.body;

  if (!Number.isSafeInteger(cardId) || cardId < 1) {
    return res.status(400).json({ message: 'Mã thẻ bài không hợp lệ.' });
  }
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'Trạng thái phát hành không hợp lệ.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [cardRows] = await connection.execute(
      `SELECT id, rarity, is_active FROM cards WHERE id = ? FOR UPDATE`,
      [cardId]
    );
    if (cardRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy thẻ bài.' });
    }

    const card = cardRows[0];
    if (Boolean(card.is_active) === isActive) {
      await connection.commit();
      return res.status(200).json({
        message: isActive ? 'Thẻ bài đang được phát hành.' : 'Thẻ bài đã ngừng phát hành.',
      });
    }

    if (!isActive) {
      const [activeCards] = await connection.execute(
        `SELECT id FROM cards WHERE rarity = ? AND is_active = 1 FOR UPDATE`,
        [card.rarity]
      );
      if (activeCards.length <= 1) {
        await connection.rollback();
        return res.status(409).json({
          message: `Không thể ngừng phát hành thẻ cuối cùng của độ hiếm ${card.rarity}.`,
        });
      }
    }

    await connection.execute(
      'UPDATE cards SET is_active = ? WHERE id = ?',
      [isActive ? 1 : 0, cardId]
    );
    await connection.commit();
    return res.status(200).json({
      message: isActive ? 'Đã phát hành lại thẻ bài.' : 'Đã ngừng phát hành thẻ bài.',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update Admin Card Status Error:', error);
    return res.status(500).json({ message: 'Không thể cập nhật trạng thái thẻ bài.' });
  } finally {
    connection.release();
  }
};
