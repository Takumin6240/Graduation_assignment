const pool = require('../config/database');
const { log } = require('../utils/logger');

// Get all chapters
const getChapters = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chapters ORDER BY order_number'
    );
    res.json({ chapters: result.rows });
  } catch (error) {
    log(`Get chapters error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get problems by chapter
const getProblemsByChapter = async (req, res) => {
  const { chapterId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, chapter_id, problem_type, title, learning_objective, description,
              max_score, difficulty_level, order_number, created_at
       FROM problems
       WHERE chapter_id = $1
       ORDER BY order_number`,
      [chapterId]
    );
    res.json({ problems: result.rows });
  } catch (error) {
    log(`Get problems error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get problem details
const getProblemDetails = async (req, res) => {
  const { problemId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, chapter_id, problem_type, title, learning_objective, description,
              initial_sb3_data, scratch_editor_url, max_score, difficulty_level, order_number
       FROM problems
       WHERE id = $1`,
      [problemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '問題が見つかりません' });
    }

    res.json({ problem: result.rows[0] });
  } catch (error) {
    log(`Get problem details error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get hints for problem (filtered by user's grade)
const getHints = async (req, res) => {
  const { problemId } = req.params;
  const userId = req.user.userId;

  try {
    // Get user's grade
    const userResult = await pool.query(
      'SELECT grade FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    const userGrade = userResult.rows[0].grade;

    // Get hints for user's grade
    const hintsResult = await pool.query(
      `SELECT id, hint_text, hint_order
       FROM hints
       WHERE problem_id = $1 AND grade = $2
       ORDER BY hint_order`,
      [problemId, userGrade]
    );

    res.json({ hints: hintsResult.rows });
  } catch (error) {
    log(`Get hints error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get user's progress for a chapter
const getUserProgress = async (req, res) => {
  const { chapterId } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.problem_type, s.is_correct, s.score, s.completed_at
       FROM problems p
       LEFT JOIN submissions s ON p.id = s.problem_id AND s.user_id = $1
       WHERE p.chapter_id = $2
       ORDER BY p.order_number`,
      [userId, chapterId]
    );

    res.json({ progress: result.rows });
  } catch (error) {
    log(`Get user progress error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

module.exports = {
  getChapters,
  getProblemsByChapter,
  getProblemDetails,
  getHints,
  getUserProgress
};
