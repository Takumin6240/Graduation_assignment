const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllUsers,
  getUserDetails,
  getStatistics,
  getProblemAnalytics,
  getAllProblems,
  uploadCorrectSB3,
  updateScratchEditorUrl,
  updateCorrectAnswer
} = require('../controllers/adminController');
const { adminAuthMiddleware } = require('../middleware/auth');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/x.scratch.sb3' || file.originalname.endsWith('.sb3')) {
      cb(null, true);
    } else {
      cb(new Error('SB3ファイルのみアップロード可能です'));
    }
  }
});

// All admin routes require admin authentication
router.use(adminAuthMiddleware);

router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.get('/statistics', getStatistics);
router.get('/analytics/problems', getProblemAnalytics);
router.get('/problems', getAllProblems);
router.post('/problems/:problemId/upload-correct', upload.single('sb3File'), uploadCorrectSB3);
router.patch('/problems/:problemId/scratch-url', updateScratchEditorUrl);
router.patch('/problems/:problemId/correct-answer', updateCorrectAnswer);

module.exports = router;
