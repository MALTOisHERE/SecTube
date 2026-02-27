import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { fileTypeFromFile } from 'file-type';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const videoDir = path.join(__dirname, '../../videos');
const thumbnailDir = path.join(__dirname, '../../thumbnails');

[uploadDir, videoDir, thumbnailDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, uploadDir);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, thumbnailDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter for video uploads
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    const videoTypes = /mp4|avi|mov|mkv|webm|flv/;
    const extname = videoTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = videoTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed (mp4, avi, mov, mkv, webm, flv)'));
    }
  } else if (file.fieldname === 'thumbnail') {
    const imageTypes = /jpeg|jpg|png|gif|webp/;
    const extname = imageTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = imageTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for thumbnails (jpeg, jpg, png, gif, webp)'));
    }
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB default
  },
  fileFilter: fileFilter
});

// Middleware for video upload
export const uploadMiddleware = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

/**
 * Middleware to verify file signature (magic bytes)
 * This prevents file upload bypass using fake extensions
 */
export const verifyUploadSignature = async (req, res, next) => {
  if (!req.files) return next();

  const filesToCheck = [];
  if (req.files.video) filesToCheck.push(...req.files.video);
  if (req.files.thumbnail) filesToCheck.push(...req.files.thumbnail);

  // Allowed MIME types map
  const ALLOWED_MIME_TYPES = {
    // Video types
    'video/mp4': true,
    'video/x-matroska': true, // mkv
    'video/quicktime': true, // mov
    'video/x-msvideo': true, // avi
    'video/webm': true,
    'video/x-flv': true,

    // Image types
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true
  };

  try {
    for (const file of filesToCheck) {
      const type = await fileTypeFromFile(file.path);

      // If file-type cannot determine the type, or it's not in our allowlist
      if (!type || !ALLOWED_MIME_TYPES[type.mime]) {
        // Delete ALL uploaded files for this request to be safe
        filesToCheck.forEach(f => {
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });

        return res.status(400).json({
          message: 'Invalid file content detected. Upload rejected.',
          error: `File ${file.originalname} has invalid content type: ${type ? type.mime : 'unknown'}`
        });
      }
    }
    next();
  } catch (error) {
    console.error('File verification error:', error);
    // Cleanup on error
    filesToCheck.forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
    });
    res.status(500).json({ message: 'Error verifying file upload' });
  }
};
