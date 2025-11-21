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

    if (grade < 3 || grade > 6) {
      return res.status(400).json({ error: '学年は3〜6の間で指定してください' });
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
       RETURNING id, username, nickname, grade, rank, points, created_at`,
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
        rank: user.rank,
        points: user.points
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
        u.rank,
        u.points,
        u.created_at,
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN s.is_correct THEN s.id END) as correct_submissions,
        ROUND(AVG(s.score)::numeric, 2) as average_score
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
      'SELECT id, username, nickname, grade, rank, points, created_at FROM users WHERE id = $1 AND admin_id = $2',
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

    // Total submissions (all uploads from submission_attempts)
    const submissionsResult = await pool.query(
      `SELECT COUNT(*) as total FROM submission_attempts sa
       JOIN users u ON sa.user_id = u.id
       WHERE u.admin_id = $1`,
      [adminId]
    );

    // Problems attempted (unique problems tried)
    const problemsAttemptedResult = await pool.query(
      `SELECT COUNT(DISTINCT sa.problem_id) as total FROM submission_attempts sa
       JOIN users u ON sa.user_id = u.id
       WHERE u.admin_id = $1`,
      [adminId]
    );

    // Problems solved (unique problems with correct final submission)
    const problemsSolvedResult = await pool.query(
      `SELECT COUNT(*) as total FROM submissions s
       JOIN users u ON s.user_id = u.id
       WHERE u.admin_id = $1 AND s.is_correct = true`,
      [adminId]
    );

    // Correct attempts (from submission_attempts) - for correct submission rate
    const correctAttemptsResult = await pool.query(
      `SELECT COUNT(*) as total FROM submission_attempts sa
       JOIN users u ON sa.user_id = u.id
       WHERE u.admin_id = $1 AND sa.is_correct_attempt = true`,
      [adminId]
    );

    // Average attempts per problem (from final submissions)
    const avgAttemptsResult = await pool.query(
      `SELECT AVG(s.total_attempts) as avg FROM submissions s
       JOIN users u ON s.user_id = u.id
       WHERE u.admin_id = $1`,
      [adminId]
    );

    // Average score (from final submissions)
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

    // Recent activity (last 7 days, for this admin's students) - from submission_attempts
    const recentActivityResult = await pool.query(`
      SELECT DATE(sa.timestamp) as date, COUNT(*) as submissions
      FROM submission_attempts sa
      JOIN users u ON sa.user_id = u.id
      WHERE u.admin_id = $1 AND sa.timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(sa.timestamp)
      ORDER BY date DESC
    `, [adminId]);

    const totalSubmissions = parseInt(submissionsResult.rows[0].total);
    const correctAttempts = parseInt(correctAttemptsResult.rows[0].total);
    const correctRate = totalSubmissions > 0
      ? ((correctAttempts / totalSubmissions) * 100).toFixed(1)
      : 0;

    res.json({
      totalUsers: parseInt(usersResult.rows[0].total),
      totalSubmissions: totalSubmissions,
      problemsAttempted: parseInt(problemsAttemptedResult.rows[0].total),
      problemsSolved: parseInt(problemsSolvedResult.rows[0].total),
      averageAttempts: parseFloat(avgAttemptsResult.rows[0].avg || 0),
      correctRate: correctRate,
      averageScore: parseFloat(avgScoreResult.rows[0].avg || 0),
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

        -- Submission statistics (from submission_attempts)
        COUNT(sa.id) as total_submissions,
        COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) as correct_submissions,
        ROUND(
          CASE
            WHEN COUNT(sa.id) > 0
            THEN (COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END)::numeric / COUNT(sa.id)::numeric * 100)
            ELSE 0
          END,
          1
        ) as correct_rate,

        -- User statistics
        COUNT(DISTINCT sa.user_id) as unique_students,
        COUNT(DISTINCT CASE WHEN sa.is_correct_attempt THEN sa.user_id END) as students_solved,

        -- Final submission statistics (from submissions)
        AVG(s.score) as avg_score,
        AVG(s.time_spent) as avg_time_spent,
        AVG(s.total_attempts) as avg_attempts_to_solve

      FROM problems p
      JOIN chapters c ON p.chapter_id = c.id
      LEFT JOIN submission_attempts sa ON p.id = sa.problem_id
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

// Get detailed analytics for research
const getDetailedAnalytics = async (req, res) => {
  const adminId = req.admin.adminId;

  try {
    // 1. Problem-level detailed analytics
    const problemAnalytics = await pool.query(`
      SELECT
        p.id as problem_id,
        p.title as problem_title,
        p.problem_type,
        p.difficulty_level,
        p.order_number as problem_order,
        c.id as chapter_id,
        c.title as chapter_title,
        c.order_number as chapter_order,

        -- Submission statistics (from submission_attempts)
        COUNT(DISTINCT sa.user_id) as unique_students,
        COUNT(sa.id) as total_submissions,
        COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) as correct_submissions,
        ROUND(
          CASE
            WHEN COUNT(sa.id) > 0
            THEN (COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END)::numeric / COUNT(sa.id)::numeric * 100)
            ELSE 0
          END,
          1
        ) as correct_rate,

        -- Final submission statistics (from submissions)
        ROUND(AVG(s.score)::numeric, 2) as avg_score,
        ROUND(AVG(s.time_spent)::numeric, 2) as avg_time_spent_seconds,
        ROUND(AVG(s.total_attempts)::numeric, 2) as avg_attempts_to_solve,
        ROUND(AVG(s.hint_usage_count)::numeric, 2) as avg_hint_usage,

        -- First attempt success rate (critical for research)
        COUNT(CASE WHEN sa.attempt_number = 1 AND sa.is_correct_attempt THEN 1 END) as first_attempt_success,
        COUNT(CASE WHEN sa.attempt_number = 1 THEN 1 END) as first_attempt_total,

        -- Time analysis (from final submissions)
        MIN(s.time_spent) as min_time_spent,
        MAX(s.time_spent) as max_time_spent,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.time_spent) as median_time_spent

      FROM problems p
      JOIN chapters c ON p.chapter_id = c.id
      LEFT JOIN submission_attempts sa ON p.id = sa.problem_id
      LEFT JOIN users u1 ON sa.user_id = u1.id
      LEFT JOIN submissions s ON p.id = s.problem_id
      LEFT JOIN users u2 ON s.user_id = u2.id
      WHERE (u1.admin_id = $1 OR u2.admin_id = $1) OR (sa.id IS NULL AND s.id IS NULL)
      GROUP BY p.id, p.title, p.problem_type, p.difficulty_level, p.order_number,
               c.id, c.title, c.order_number
      ORDER BY c.order_number, p.order_number
    `, [adminId]);

    // 2. Error pattern analysis (improved)
    const errorPatterns = await pool.query(`
      SELECT
        p.id as problem_id,
        p.title as problem_title,
        p.problem_type,
        c.title as chapter_title,
        sa.error_message,
        COUNT(*) as error_count,
        COUNT(DISTINCT sa.user_id) as affected_students,
        ROUND(100.0 * COUNT(*) / NULLIF(
          (SELECT COUNT(*) FROM submission_attempts sa2
           JOIN users u2 ON sa2.user_id = u2.id
           WHERE sa2.problem_id = p.id AND u2.admin_id = $1), 0
        ), 2) as error_rate_percentage,
        MAX(sa.timestamp) as last_occurrence
      FROM submission_attempts sa
      JOIN problems p ON sa.problem_id = p.id
      JOIN chapters c ON p.chapter_id = c.id
      JOIN users u ON sa.user_id = u.id
      WHERE u.admin_id = $1
        AND sa.is_correct_attempt = false
        AND sa.error_message IS NOT NULL
        AND sa.error_message != ''
      GROUP BY p.id, p.title, p.problem_type, c.title, sa.error_message
      ORDER BY error_count DESC, error_rate_percentage DESC
      LIMIT 100
    `, [adminId]);

    // 3. Student-level analysis (individual struggling points)
    const studentAnalysis = await pool.query(`
      SELECT
        u.id as student_id,
        u.nickname,
        u.grade,
        u.created_at as registration_date,

        -- Overall performance (from submission_attempts)
        COUNT(DISTINCT sa.problem_id) as problems_attempted,
        COUNT(DISTINCT CASE WHEN s.is_correct THEN s.problem_id END) as problems_solved,
        COUNT(sa.id) as total_submissions,
        COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) as correct_submissions,
        ROUND(
          CASE
            WHEN COUNT(sa.id) > 0
            THEN (COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END)::numeric / COUNT(sa.id)::numeric * 100)
            ELSE 0
          END,
          1
        ) as correct_rate,
        ROUND(AVG(s.score)::numeric, 2) as avg_score,
        ROUND(AVG(s.total_attempts)::numeric, 2) as avg_attempts,
        SUM(s.time_spent) as total_time_spent,

        -- Problem type performance (from submission_attempts)
        COUNT(CASE WHEN p.problem_type = 'fill_blank' AND sa.is_correct_attempt THEN 1 END) as fill_blank_correct,
        COUNT(CASE WHEN p.problem_type = 'fill_blank' THEN sa.id END) as fill_blank_submissions,
        COUNT(CASE WHEN p.problem_type = 'predict' AND sa.is_correct_attempt THEN 1 END) as predict_correct,
        COUNT(CASE WHEN p.problem_type = 'predict' THEN sa.id END) as predict_submissions,
        COUNT(CASE WHEN p.problem_type = 'find_error' AND sa.is_correct_attempt THEN 1 END) as find_error_correct,
        COUNT(CASE WHEN p.problem_type = 'find_error' THEN sa.id END) as find_error_submissions,
        COUNT(CASE WHEN p.problem_type = 'mission' AND sa.is_correct_attempt THEN 1 END) as mission_correct,
        COUNT(CASE WHEN p.problem_type = 'mission' THEN sa.id END) as mission_submissions

      FROM users u
      LEFT JOIN submission_attempts sa ON u.id = sa.user_id
      LEFT JOIN problems p ON sa.problem_id = p.id
      LEFT JOIN submissions s ON u.id = s.user_id AND sa.problem_id = s.problem_id
      WHERE u.admin_id = $1
      GROUP BY u.id, u.nickname, u.grade, u.created_at
      ORDER BY u.created_at
    `, [adminId]);

    // 4. Problem type comparison
    const problemTypeAnalysis = await pool.query(`
      SELECT
        p.problem_type,
        COUNT(DISTINCT sa.user_id) as students_attempted,
        COUNT(sa.id) as total_submissions,
        COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) as correct_submissions,
        ROUND(
          CASE
            WHEN COUNT(sa.id) > 0
            THEN (COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END)::numeric / COUNT(sa.id)::numeric * 100)
            ELSE 0
          END,
          1
        ) as correct_rate,
        ROUND(AVG(s.score)::numeric, 2) as avg_score,
        ROUND(AVG(s.time_spent)::numeric, 2) as avg_time_spent,
        ROUND(AVG(s.total_attempts)::numeric, 2) as avg_attempts
      FROM problems p
      LEFT JOIN submission_attempts sa ON p.id = sa.problem_id
      LEFT JOIN users u1 ON sa.user_id = u1.id
      LEFT JOIN submissions s ON p.id = s.problem_id
      LEFT JOIN users u2 ON s.user_id = u2.id
      WHERE (u1.admin_id = $1 OR u2.admin_id = $1) OR (sa.id IS NULL AND s.id IS NULL)
      GROUP BY p.problem_type
      ORDER BY p.problem_type
    `, [adminId]);

    // 5. Time series data (daily) - from submission_attempts
    const timeSeriesDaily = await pool.query(`
      SELECT
        DATE(sa.timestamp) as date,
        COUNT(sa.id) as submissions,
        COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) as correct_submissions,
        COUNT(DISTINCT sa.user_id) as active_students,
        ROUND(
          CASE
            WHEN COUNT(sa.id) > 0
            THEN (COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END)::numeric / COUNT(sa.id)::numeric * 100)
            ELSE 0
          END,
          1
        ) as correct_rate,
        ROUND(AVG(s.score)::numeric, 2) as avg_score
      FROM submission_attempts sa
      JOIN users u ON sa.user_id = u.id
      LEFT JOIN submissions s ON sa.user_id = s.user_id AND sa.problem_id = s.problem_id
      WHERE u.admin_id = $1
      GROUP BY DATE(sa.timestamp)
      ORDER BY date DESC
      LIMIT 90
    `, [adminId]);

    // 6. Time series data (weekly) - from submission_attempts
    const timeSeriesWeekly = await pool.query(`
      SELECT
        DATE_TRUNC('week', sa.timestamp) as week_start,
        COUNT(sa.id) as submissions,
        COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) as correct_submissions,
        COUNT(DISTINCT sa.user_id) as active_students,
        ROUND(
          CASE
            WHEN COUNT(sa.id) > 0
            THEN (COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END)::numeric / COUNT(sa.id)::numeric * 100)
            ELSE 0
          END,
          1
        ) as correct_rate,
        ROUND(AVG(s.score)::numeric, 2) as avg_score
      FROM submission_attempts sa
      JOIN users u ON sa.user_id = u.id
      LEFT JOIN submissions s ON sa.user_id = s.user_id AND sa.problem_id = s.problem_id
      WHERE u.admin_id = $1
      GROUP BY DATE_TRUNC('week', sa.timestamp)
      ORDER BY week_start DESC
      LIMIT 52
    `, [adminId]);

    // 7. Time series data (monthly) - from submission_attempts
    const timeSeriesMonthly = await pool.query(`
      SELECT
        DATE_TRUNC('month', sa.timestamp) as month_start,
        COUNT(sa.id) as submissions,
        COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) as correct_submissions,
        COUNT(DISTINCT sa.user_id) as active_students,
        ROUND(
          CASE
            WHEN COUNT(sa.id) > 0
            THEN (COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END)::numeric / COUNT(sa.id)::numeric * 100)
            ELSE 0
          END,
          1
        ) as correct_rate,
        ROUND(AVG(s.score)::numeric, 2) as avg_score
      FROM submission_attempts sa
      JOIN users u ON sa.user_id = u.id
      LEFT JOIN submissions s ON sa.user_id = s.user_id AND sa.problem_id = s.problem_id
      WHERE u.admin_id = $1
      GROUP BY DATE_TRUNC('month', sa.timestamp)
      ORDER BY month_start DESC
      LIMIT 12
    `, [adminId]);

    // 8. Struggling points (problems with high failure rates) - from submission_attempts
    const strugglingPoints = await pool.query(`
      SELECT
        p.id as problem_id,
        p.title as problem_title,
        p.problem_type,
        c.title as chapter_title,
        COUNT(sa.id) as total_attempts,
        COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) as correct_attempts,
        ROUND(100.0 * COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) / NULLIF(COUNT(sa.id), 0), 2) as success_rate,
        ROUND(AVG(s.total_attempts)::numeric, 2) as avg_attempts_to_solve,
        ROUND(AVG(s.time_spent)::numeric, 2) as avg_time_spent
      FROM problems p
      JOIN chapters c ON p.chapter_id = c.id
      LEFT JOIN submission_attempts sa ON p.id = sa.problem_id
      LEFT JOIN users u1 ON sa.user_id = u1.id
      LEFT JOIN submissions s ON p.id = s.problem_id
      LEFT JOIN users u2 ON s.user_id = u2.id
      WHERE (u1.admin_id = $1 OR u2.admin_id = $1)
      GROUP BY p.id, p.title, p.problem_type, c.title
      HAVING COUNT(sa.id) > 0
      ORDER BY success_rate ASC, avg_attempts_to_solve DESC
      LIMIT 20
    `, [adminId]);

    // 9. Attempt progression analysis (learning curve)
    const attemptProgression = await pool.query(`
      SELECT
        sa.attempt_number,
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) as successful_attempts,
        ROUND(100.0 * COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) / COUNT(*), 2) as success_rate
      FROM submission_attempts sa
      JOIN users u ON sa.user_id = u.id
      WHERE u.admin_id = $1
      GROUP BY sa.attempt_number
      ORDER BY sa.attempt_number
      LIMIT 20
    `, [adminId]);

    res.json({
      problemAnalytics: problemAnalytics.rows,
      errorPatterns: errorPatterns.rows,
      studentAnalysis: studentAnalysis.rows,
      problemTypeAnalysis: problemTypeAnalysis.rows,
      timeSeriesDaily: timeSeriesDaily.rows,
      timeSeriesWeekly: timeSeriesWeekly.rows,
      timeSeriesMonthly: timeSeriesMonthly.rows,
      strugglingPoints: strugglingPoints.rows,
      attemptProgression: attemptProgression.rows
    });
  } catch (error) {
    log(`Get detailed analytics error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Export analytics as CSV
const exportAnalyticsCSV = async (req, res) => {
  const adminId = req.admin.adminId;

  try {
    // Get comprehensive data for CSV export
    const data = await pool.query(`
      SELECT
        u.nickname as "生徒名",
        u.grade as "学年",
        c.title as "チャプター",
        p.title as "問題タイトル",
        p.problem_type as "問題タイプ",
        p.difficulty_level as "難易度",
        s.is_correct as "正解",
        s.score as "スコア",
        s.total_attempts as "試行回数",
        s.hint_usage_count as "ヒント使用回数",
        s.time_spent as "所要時間（秒）",
        s.completed_at as "提出日時"
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN problems p ON s.problem_id = p.id
      JOIN chapters c ON p.chapter_id = c.id
      WHERE u.admin_id = $1
      ORDER BY s.completed_at DESC
    `, [adminId]);

    // Convert to CSV
    if (data.rows.length === 0) {
      // Return empty CSV with headers only
      const emptyCSV = '生徒名,学年,チャプター,問題タイトル,問題タイプ,難易度,正解,スコア,試行回数,ヒント使用回数,所要時間（秒）,提出日時\n';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_${Date.now()}.csv"`);
      return res.send('\uFEFF' + emptyCSV); // BOM for Excel UTF-8 support
    }

    const headers = Object.keys(data.rows[0]);
    const csvRows = [headers.join(',')];

    for (const row of data.rows) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="analytics_${Date.now()}.csv"`);
    res.send('\uFEFF' + csv); // Add BOM for Excel compatibility
  } catch (error) {
    log(`Export CSV error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'CSVエクスポートに失敗しました' });
  }
};

// Export analytics as JSON
const exportAnalyticsJSON = async (req, res) => {
  const adminId = req.admin.adminId;

  try {
    // Get all relevant data for JSON export
    const submissions = await pool.query(`
      SELECT
        s.id,
        s.user_id,
        u.nickname as user_nickname,
        u.grade as user_grade,
        s.problem_id,
        p.title as problem_title,
        p.problem_type,
        p.difficulty_level,
        c.title as chapter_title,
        s.is_correct,
        s.score,
        s.total_attempts,
        s.hint_usage_count,
        s.time_spent,
        s.completed_at
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN problems p ON s.problem_id = p.id
      JOIN chapters c ON p.chapter_id = c.id
      WHERE u.admin_id = $1
      ORDER BY s.completed_at DESC
    `, [adminId]);

    const attempts = await pool.query(`
      SELECT
        sa.id,
        sa.user_id,
        u.nickname as user_nickname,
        sa.problem_id,
        p.title as problem_title,
        sa.attempt_number,
        sa.is_correct_attempt,
        sa.error_message,
        sa.hint_viewed,
        sa.timestamp
      FROM submission_attempts sa
      JOIN users u ON sa.user_id = u.id
      JOIN problems p ON sa.problem_id = p.id
      WHERE u.admin_id = $1
      ORDER BY sa.timestamp DESC
      LIMIT 1000
    `, [adminId]);

    const exportData = {
      exportDate: new Date().toISOString(),
      submissions: submissions.rows,
      attempts: attempts.rows
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="analytics_${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    log(`Export JSON error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'JSONエクスポートに失敗しました' });
  }
};

// Get error analysis for a specific problem
const getErrorAnalysisByProblem = async (req, res) => {
  const { problemId } = req.params;
  const adminId = req.admin.adminId;

  try {
    // Get problem info
    const problemResult = await pool.query(
      `SELECT p.id, p.title, p.problem_type, p.difficulty_level, c.title as chapter_title
       FROM problems p
       JOIN chapters c ON p.chapter_id = c.id
       WHERE p.id = $1`,
      [problemId]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ error: '問題が見つかりません' });
    }

    const problem = problemResult.rows[0];

    // Get all incorrect attempts with error messages
    const incorrectAttempts = await pool.query(
      `SELECT
        sa.id,
        sa.user_id,
        u.nickname as student_name,
        u.grade,
        sa.attempt_number,
        sa.error_message,
        sa.hint_viewed,
        sa.timestamp
      FROM submission_attempts sa
      JOIN users u ON sa.user_id = u.id
      WHERE sa.problem_id = $1
        AND u.admin_id = $2
        AND sa.is_correct_attempt = false
      ORDER BY sa.timestamp DESC
      LIMIT 500`,
      [problemId, adminId]
    );

    // Group errors by message
    const errorGroups = await pool.query(
      `SELECT
        sa.error_message,
        COUNT(*) as count,
        COUNT(DISTINCT sa.user_id) as unique_students,
        ROUND(AVG(sa.attempt_number)::numeric, 2) as avg_attempt_number
      FROM submission_attempts sa
      JOIN users u ON sa.user_id = u.id
      WHERE sa.problem_id = $1
        AND u.admin_id = $2
        AND sa.is_correct_attempt = false
        AND sa.error_message IS NOT NULL
        AND sa.error_message != ''
      GROUP BY sa.error_message
      ORDER BY count DESC`,
      [problemId, adminId]
    );

    // Get success vs failure statistics
    const statistics = await pool.query(
      `SELECT
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) as correct_attempts,
        COUNT(CASE WHEN NOT sa.is_correct_attempt THEN 1 END) as incorrect_attempts,
        COUNT(DISTINCT sa.user_id) as unique_students,
        COUNT(DISTINCT CASE WHEN sa.is_correct_attempt THEN sa.user_id END) as students_solved,
        ROUND(100.0 * COUNT(CASE WHEN sa.is_correct_attempt THEN 1 END) / NULLIF(COUNT(*), 0), 2) as success_rate
      FROM submission_attempts sa
      JOIN users u ON sa.user_id = u.id
      WHERE sa.problem_id = $1
        AND u.admin_id = $2`,
      [problemId, adminId]
    );

    res.json({
      problem,
      statistics: statistics.rows[0],
      errorGroups: errorGroups.rows,
      recentIncorrectAttempts: incorrectAttempts.rows
    });
  } catch (error) {
    log(`Get error analysis error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get comprehensive error analysis dashboard
const getErrorAnalysisDashboard = async (req, res) => {
  const adminId = req.admin.adminId;

  try {
    // 1. Most common errors across all problems
    const topErrors = await pool.query(
      `SELECT
        sa.error_message,
        COUNT(*) as total_occurrences,
        COUNT(DISTINCT sa.problem_id) as problems_affected,
        COUNT(DISTINCT sa.user_id) as students_affected
      FROM submission_attempts sa
      JOIN users u ON sa.user_id = u.id
      WHERE u.admin_id = $1
        AND sa.is_correct_attempt = false
        AND sa.error_message IS NOT NULL
        AND sa.error_message != ''
      GROUP BY sa.error_message
      ORDER BY total_occurrences DESC
      LIMIT 20`,
      [adminId]
    );

    // 2. Problems with highest error rates
    const problematicProblems = await pool.query(
      `SELECT
        p.id as problem_id,
        p.title as problem_title,
        p.problem_type,
        c.title as chapter_title,
        COUNT(sa.id) as total_attempts,
        COUNT(CASE WHEN sa.is_correct_attempt = false THEN 1 END) as incorrect_attempts,
        ROUND(100.0 * COUNT(CASE WHEN sa.is_correct_attempt = false THEN 1 END) / NULLIF(COUNT(sa.id), 0), 2) as error_rate
      FROM problems p
      JOIN chapters c ON p.chapter_id = c.id
      LEFT JOIN submission_attempts sa ON p.id = sa.problem_id
      LEFT JOIN users u ON sa.user_id = u.id
      WHERE u.admin_id = $1 OR sa.id IS NULL
      GROUP BY p.id, p.title, p.problem_type, c.title
      HAVING COUNT(sa.id) > 0
      ORDER BY error_rate DESC, incorrect_attempts DESC
      LIMIT 20`,
      [adminId]
    );

    // 3. Students with most errors
    const strugglingStudents = await pool.query(
      `SELECT
        u.id as student_id,
        u.nickname,
        u.grade,
        COUNT(sa.id) as total_attempts,
        COUNT(CASE WHEN sa.is_correct_attempt = false THEN 1 END) as incorrect_attempts,
        ROUND(100.0 * COUNT(CASE WHEN sa.is_correct_attempt = false THEN 1 END) / NULLIF(COUNT(sa.id), 0), 2) as error_rate
      FROM users u
      LEFT JOIN submission_attempts sa ON u.id = sa.user_id
      WHERE u.admin_id = $1
      GROUP BY u.id, u.nickname, u.grade
      HAVING COUNT(sa.id) > 0
      ORDER BY incorrect_attempts DESC, error_rate DESC
      LIMIT 20`,
      [adminId]
    );

    // 4. Error trends over time (last 30 days)
    const errorTrends = await pool.query(
      `SELECT
        DATE(sa.timestamp) as date,
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN sa.is_correct_attempt = false THEN 1 END) as incorrect_attempts,
        ROUND(100.0 * COUNT(CASE WHEN sa.is_correct_attempt = false THEN 1 END) / NULLIF(COUNT(*), 0), 2) as error_rate
      FROM submission_attempts sa
      JOIN users u ON sa.user_id = u.id
      WHERE u.admin_id = $1
        AND sa.timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(sa.timestamp)
      ORDER BY date DESC`,
      [adminId]
    );

    res.json({
      topErrors: topErrors.rows,
      problematicProblems: problematicProblems.rows,
      strugglingStudents: strugglingStudents.rows,
      errorTrends: errorTrends.rows
    });
  } catch (error) {
    log(`Get error analysis dashboard error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
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
  updateCorrectAnswer,
  getDetailedAnalytics,
  exportAnalyticsCSV,
  exportAnalyticsJSON,
  getErrorAnalysisByProblem,
  getErrorAnalysisDashboard
};
