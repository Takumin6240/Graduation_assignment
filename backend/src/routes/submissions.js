const express = require('express');
const router = express.Router();
const multer = require('multer');
const { submitSolution, getSubmissionHistory } = require('../controllers/submissionController');
const { authMiddleware } = require('../middleware/auth');

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/x-zip-compressed' ||
        file.originalname.endsWith('.sb3')) {
      cb(null, true);
    } else {
      cb(new Error('SB3ファイルのみアップロード可能です'));
    }
  }
});

// All submission routes require authentication
router.use(authMiddleware);

router.post('/problems/:problemId/submit', upload.single('sb3File'), submitSolution);
router.get('/history', getSubmissionHistory);

module.exports = router;
