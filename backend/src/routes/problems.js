const express = require('express');
const router = express.Router();
const {
  getChapters,
  getProblemsByChapter,
  getProblemDetails,
  getHints,
  getUserProgress
} = require('../controllers/problemController');
const { authMiddleware } = require('../middleware/auth');

// All problem routes require authentication
router.use(authMiddleware);

router.get('/chapters', getChapters);
router.get('/chapters/:chapterId/problems', getProblemsByChapter);
router.get('/chapters/:chapterId/progress', getUserProgress);
router.get('/problems/:problemId', getProblemDetails);
router.get('/problems/:problemId/hints', getHints);

module.exports = router;
