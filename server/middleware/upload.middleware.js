import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only jpeg, jpg, png, svg are allowed'), false);
  }
};

const uploadConfig = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_LOGO_SIZE_MB || 5) * 1024 * 1024 },
  fileFilter,
});

export const uploadLogo = uploadConfig.single('logo');
export const uploadSignature = uploadConfig.single('signature');
