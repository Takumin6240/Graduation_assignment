const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { log } = require('../utils/logger');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Student registration
const registerStudent = async (req, res) => {
  const { username, password, nickname, grade } = req.body;

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

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, nickname, grade)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, nickname, grade, level, exp, created_at`,
      [username, passwordHash, nickname, grade]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken({ userId: user.id, role: 'student' });

    log(`New student registered: ${username} (Grade: ${grade})`);

    res.status(201).json({
      message: '登録が完了しました',
      token,
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
    log(`Registration error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Student login
const loginStudent = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'ユーザー名とパスワードを入力してください' });
    }

    // Get user
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
    }

    // Generate token
    const token = generateToken({ userId: user.id, role: 'student' });

    log(`Student logged in: ${username}`);

    res.json({
      message: 'ログインしました',
      token,
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
    log(`Login error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Admin login
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'ユーザー名とパスワードを入力してください' });
    }

    // Get admin
    const result = await pool.query(
      'SELECT * FROM admins WHERE admin_username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
    }

    const admin = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
    }

    // Generate token
    const token = generateToken({ adminId: admin.id, role: 'admin' });

    log(`Admin logged in: ${username}`);

    res.json({
      message: 'ログインしました',
      token,
      admin: {
        id: admin.id,
        username: admin.admin_username
      }
    });
  } catch (error) {
    log(`Admin login error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Admin registration
const registerAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: '全ての項目を入力してください' });
    }

    // Check if username already exists
    const existingAdmin = await pool.query(
      'SELECT id FROM admins WHERE admin_username = $1',
      [username]
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({ error: 'このユーザー名は既に使用されています' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new admin
    const result = await pool.query(
      `INSERT INTO admins (admin_username, password_hash)
       VALUES ($1, $2)
       RETURNING id, admin_username, created_at`,
      [username, passwordHash]
    );

    const admin = result.rows[0];

    // Generate token
    const token = generateToken({ adminId: admin.id, role: 'admin' });

    log(`New admin registered: ${username}`);

    res.status(201).json({
      message: '管理者登録が完了しました',
      token,
      admin: {
        id: admin.id,
        username: admin.admin_username
      }
    });
  } catch (error) {
    log(`Admin registration error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// Get current user info
const getCurrentUser = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, nickname, grade, level, exp, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    log(`Get user error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  loginAdmin,
  registerAdmin,
  getCurrentUser
};
