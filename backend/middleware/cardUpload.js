import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import multer from 'multer';
import { fileURLToPath } from 'node:url';

export const cardUploadDirectory = fileURLToPath(new URL('../uploads/cards/', import.meta.url));

const imageExtensions = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    mkdir(cardUploadDirectory, { recursive: true })
      .then(() => callback(null, cardUploadDirectory))
      .catch(callback);
  },
  filename: (_req, file, callback) => {
    callback(null, `${randomUUID()}${imageExtensions.get(file.mimetype)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!imageExtensions.has(file.mimetype)) {
      const error = new Error('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.');
      error.code = 'UNSUPPORTED_CARD_IMAGE';
      callback(error);
      return;
    }

    callback(null, true);
  },
});

export const uploadCardImage = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({
        message: error.code === 'LIMIT_FILE_SIZE'
          ? 'Ảnh tải lên không được vượt quá 5 MB.'
          : 'Tệp tải lên không hợp lệ.',
      });
      return;
    }

    if (error.code === 'UNSUPPORTED_CARD_IMAGE') {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error('Card Image Upload Error:', error);
    res.status(500).json({ message: 'Không thể lưu ảnh thẻ lên máy chủ.' });
  });
};
