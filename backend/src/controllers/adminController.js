const pool = require('../config/database');
const { log } = require('../utils/logger');
const JSZip = require('jszip');
const bcrypt = require('bcrypt');

// Create a student account by admin
const createStudent = async (req, res) => {
  const { username, password, nickname, grade } = req.body;
  const adminId = req.admin.adminId;

  try {
    // Validation
    if (!username || !password || !nickname || !grade) {
      return res.status(400).json({ error: '全ての項目を入力してください' });
    }

    if (grade < 1 || grade > 6) {
      return res.status(400).json({ error: '学年は1〜6の間で指定してください' });
    }

    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'このユーザー名は既に使用されています' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user with admin_id
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, nickname, grade, admin_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, nickname, grade, level, exp, created_at`,
      [username, passwordHash, nickname, grade, adminId]
    );

    const user = result.rows[0];

    log(`Admin ${adminId} created student: ${username} (Grade: ${grade})`);

    res.status(201).json({
      message: '学生アカウントが作成されました',
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        grade: user.grade,
        level: user.level,
        exp: user.exp
      }
    });
  } catch (error) {
    log(`Create student error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get all users with statistics (filtered by admin)
const getAllUsers = async (req, res) => {
  const adminId = req.admin.adminId;

  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.nickname,
        u.grade,
        u.level,
        u.exp,
        u.created_at,
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN s.is_correct THEN s.id END) as correct_submissions
      FROM users u
      LEFT JOIN submissions s ON u.id = s.user_id
      WHERE u.admin_id = $1
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `, [adminId]);

    res.json({ users: result.rows });
  } catch (error) {
    log(`Get all users error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get user details with full history
const getUserDetails = async (req, res) => {
  const { userId } = req.params;
  const adminId = req.admin.adminId;

  try {
    // Get user info (verify it belongs to this admin)
    const userResult = await pool.query(
      'SELECT id, username, nickname, grade, level, exp, created_at FROM users WHERE id = $1 AND admin_id = $2',
      [userId, adminId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Get submission history
    const submissionsResult = await pool.query(
      `SELECT s.*, p.title, p.problem_type
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.completed_at DESC`,
      [userId]
    );

    // Get all attempts
    const attemptsResult = await pool.query(
      `SELECT sa.*, p.title
       FROM submission_attempts sa
       JOIN problems p ON sa.problem_id = p.id
       WHERE sa.user_id = $1
       ORDER BY sa.timestamp DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      user: userResult.rows[0],
      submissions: submissionsResult.rows,
      recentAttempts: attemptsResult.rows
    });
  } catch (error) {
    log(`Get user details error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get overall statistics
const getStatistics = async (req, res) => {
  const adminId = req.admin.adminId;

  try {
    // Total users (for this admin)
    const usersResult = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE admin_id = $1',
      [adminId]
    );

    // Total submissions (for this admin's students)
    const submissionsResult = await pool.query(
      `SELECT COUNT(*) as total FROM submissions s
       JOIN users u ON s.user_id = u.id
       WHERE u.admin_id = $1`,
      [adminId]
    );

    // Correct submissions (for this admin's students)
    const correctResult = await pool.query(
      `SELECT COUNT(*) as total FROM submissions s
       JOIN users u ON s.user_id = u.id
       WHERE u.admin_id = $1 AND s.is_correct = true`,
      [adminId]
    );

    // Average score (for this admin's students)
    const avgScoreResult = await pool.query(
      `SELECT AVG(s.score) as avg FROM submissions s
       JOIN users u ON s.user_id = u.id
       WHERE u.admin_id = $1`,
      [adminId]
    );

    // Problems by type
    const problemTypesResult = await pool.query(`
      SELECT problem_type, COUNT(*) as count
      FROM problems
      GROUP BY problem_type
    `);

    // User distribution by grade (for this admin)
    const gradeDistResult = await pool.query(`
      SELECT grade, COUNT(*) as count
      FROM users
      WHERE admin_id = $1
      GROUP BY grade
      ORDER BY grade
    `, [adminId]);

    // Recent activity (last 7 days, for this admin's students)
    const recentActivityResult = await pool.query(`
      SELECT DATE(s.completed_at) as date, COUNT(*) as submissions
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE u.admin_id = $1 AND s.completed_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(s.completed_at)
      ORDER BY date DESC
    `, [adminId]);

    res.json({
      totalUsers: parseInt(usersResult.rows[0].total),
      totalSubmissions: parseInt(submissionsResult.rows[0].total),
      correctSubmissions: parseInt(correctResult.rows[0].total),
      averageScore: parseFloat(avgScoreResult.rows[0].avg || 0).toFixed(2),
      problemTypes: problemTypesResult.rows,
      gradeDistribution: gradeDistResult.rows,
      recentActivity: recentActivityResult.rows
    });
  } catch (error) {
    log(`Get statistics error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get problem analytics
const getProblemAnalytics = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.title,
        p.problem_type,
        p.difficulty_level,
        c.title as chapter_title,
        COUNT(DISTINCT s.user_id) as total_attempts,
        COUNT(DISTINCT CASE WHEN s.is_correct THEN s.user_id END) as correct_attempts,
        AVG(s.score) as avg_score,
        AVG(s.time_spent) as avg_time_spent,
        AVG(s.total_attempts) as avg_attempts_to_solve
      FROM problems p
      JOIN chapters c ON p.chapter_id = c.id
      LEFT JOIN submissions s ON p.id = s.problem_id
      GROUP BY p.id, p.title, p.problem_type, p.difficulty_level, c.title
      ORDER BY c.order_number, p.order_number
    `);

    res.json({ analytics: result.rows });
  } catch (error) {
    log(`Get problem analytics error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get all problems for admin management
const getAllProblems = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.chapter_id,
        p.problem_type,
        p.title,
        p.description,
        p.max_score,
        p.difficulty_level,
        p.order_number,
        p.scratch_editor_url,
        c.title as chapter_title,
        p.created_at,
        p.updated_at
      FROM problems p
      JOIN chapters c ON p.chapter_id = c.id
      ORDER BY c.order_number, p.order_number
    `);

    res.json({ problems: result.rows });
  } catch (error) {
    log(`Get all problems error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Upload SB3 file and update correct answer data
const uploadCorrectSB3 = async (req, res) => {
  const { problemId } = req.params;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'SB3ファイルが選択されていません' });
    }

    // Parse SB3 file (ZIP format)
    const zip = await JSZip.loadAsync(req.file.buffer);
    const projectJsonFile = zip.file('project.json');

    if (!projectJsonFile) {
      return res.status(400).json({ error: '無効なSB3ファイル: project.jsonが見つかりません' });
    }

    const projectJson = await projectJsonFile.async('string');
    const scratchData = JSON.parse(projectJson);

    // Update correct_sb3_data in database
    const result = await pool.query(
      `UPDATE problems
       SET correct_sb3_data = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, title`,
      [JSON.stringify(scratchData), problemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '問題が見つかりません' });
    }

    log(`Admin uploaded correct SB3 for problem ${problemId}: ${result.rows[0].title}`);
    res.json({
      message: '正解データが正常に更新されました',
      problem: result.rows[0]
    });
  } catch (error) {
    log(`Upload correct SB3 error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'SB3ファイルのアップロードに失敗しました' });
  }
};

// Update Scratch editor URL for a problem
const updateScratchEditorUrl = async (req, res) => {
  const { problemId } = req.params;
  const { scratchEditorUrl } = req.body;

  try {
    if (!scratchEditorUrl) {
      return res.status(400).json({ error: 'Scratch エディタ URL が指定されていません' });
    }

    const result = await pool.query(
      `UPDATE problems
       SET scratch_editor_url = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, title, scratch_editor_url`,
      [scratchEditorUrl, problemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '問題が見つかりません' });
    }

    log(`Admin updated Scratch editor URL for problem ${problemId}: ${result.rows[0].title}`);
    res.json({
      message: 'Scratch エディタ URL が正常に更新されました',
      problem: result.rows[0]
    });
  } catch (error) {
    log(`Update Scratch editor URL error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'URL の更新に失敗しました' });
  }
};

// Update correct answer for predict problems
const updateCorrectAnswer = async (req, res) => {
  const { problemId } = req.params;
  const { correctAnswerX, correctAnswerY } = req.body;

  try {
    if (correctAnswerX === undefined || correctAnswerY === undefined) {
      return res.status(400).json({ error: '正解の座標が指定されていません' });
    }

    const result = await pool.query(
      `UPDATE problems
       SET correct_answer_x = $1, correct_answer_y = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, title, correct_answer_x, correct_answer_y`,
      [correctAnswerX, correctAnswerY, problemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '問題が見つかりません' });
    }

    log(`Admin updated correct answer for problem ${problemId}: ${result.rows[0].title}`);
    res.json({
      message: '正解の座標が正常に更新されました',
      problem: result.rows[0]
    });
  } catch (error) {
    log(`Update correct answer error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: '正解の座標の更新に失敗しました' });
  }
};

module.exports = {
  createStudent,
  getAllUsers,
  getUserDetails,
  getStatistics,
  getProblemAnalytics,
  getAllProblems,
  uploadCorrectSB3,
  updateScratchEditorUrl,
  updateCorrectAnswer
};
