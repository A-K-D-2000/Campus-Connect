const multer = require('multer');

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ATTACHMENT_TYPES = [...IMAGE_TYPES, 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB per file

const startsWith = (buf, bytes) => bytes.every((b, i) => buf[i] === b);

// Check the file's first bytes, because the declared type can be faked
const looksLikeRealFile = (file) => {
  const b = file.buffer;
  switch (file.mimetype) {
    case 'image/jpeg': return startsWith(b, [0xff, 0xd8, 0xff]);
    case 'image/png': return startsWith(b, [0x89, 0x50, 0x4e, 0x47]);
    case 'image/gif': return startsWith(b, [0x47, 0x49, 0x46, 0x38]);
    case 'image/webp':
      return startsWith(b, [0x52, 0x49, 0x46, 0x46]) && b.slice(8, 12).toString() === 'WEBP';
    case 'application/pdf': return startsWith(b, [0x25, 0x50, 0x44, 0x46]);
    default: return false;
  }
};

const makeUploader = (allowedTypes, maxCount, typeMessage) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) return cb(null, true);
      cb(new Error('INVALID_TYPE'));
    },
  }).array('files', maxCount);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        if (err.message === 'INVALID_TYPE') {
          return res.status(400).json({ message: typeMessage });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'Each file must be 5 MB or smaller' });
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ message: `You can attach at most ${maxCount} files` });
        }
        console.error(err);
        return res.status(400).json({ message: 'Could not read the uploaded files' });
      }

      if (req.files && !req.files.every(looksLikeRealFile)) {
        return res.status(400).json({ message: 'One of the files is not a valid file of its type' });
      }

      next();
    });
  };
};

// Posts: images only
const uploadImages = makeUploader(IMAGE_TYPES, 4, 'Only image files (JPG, PNG, WEBP, GIF) are allowed on posts');

// Announcements and FAQs: images and PDFs
const uploadAttachments = makeUploader(ATTACHMENT_TYPES, 5, 'Only images and PDF files are allowed');

module.exports = { uploadImages, uploadAttachments };