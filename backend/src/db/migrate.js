const pool = require('../config/database');

const migrations = `
-- Users table (students)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  grade INTEGER CHECK (grade >= 1 AND grade <= 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  admin_username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  order_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  problem_type VARCHAR(20) CHECK (problem_type IN ('fill_blank', 'predict', 'find_error', 'mission')),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  initial_sb3_data JSONB,
  correct_sb3_data JSONB,
  correct_answer_x INTEGER,
  correct_answer_y INTEGER,
  scratch_editor_url TEXT DEFAULT 'https://scratch.mit.edu/',
  max_score INTEGER DEFAULT 100,
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  order_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hints table
CREATE TABLE IF NOT EXISTS hints (
  id SERIAL PRIMARY KEY,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  grade INTEGER CHECK (grade >= 1 AND grade <= 6),
  hint_text TEXT NOT NULL,
  hint_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table (final submission record)
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  score INTEGER NOT NULL,
  total_attempts INTEGER DEFAULT 1,
  hint_usage_count INTEGER DEFAULT 0,
  time_spent INTEGER,
  final_sb3_data JSONB,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, problem_id)
);

-- Submission attempts table (all attempts for research)
CREATE TABLE IF NOT EXISTS submission_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  attempted_sb3_data JSONB,
  is_correct_attempt BOOLEAN NOT NULL,
  error_message TEXT,
  hint_viewed BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON submission_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_problem_id ON submission_attempts(problem_id);
CREATE INDEX IF NOT EXISTS idx_hints_problem_id ON hints(problem_id);
CREATE INDEX IF NOT EXISTS idx_hints_grade ON hints(grade);
CREATE INDEX IF NOT EXISTS idx_problems_chapter_id ON problems(chapter_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_problems_updated_at ON problems;
CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hints_updated_at ON hints;
CREATE TRIGGER update_hints_updated_at BEFORE UPDATE ON hints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add correct_answer_x and correct_answer_y columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='problems' AND column_name='correct_answer_x') THEN
    ALTER TABLE problems ADD COLUMN correct_answer_x INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='problems' AND column_name='correct_answer_y') THEN
    ALTER TABLE problems ADD COLUMN correct_answer_y INTEGER;
  END IF;
END $$;
`;

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Running database migrations...');
    await client.query(migrations);
    console.log('✓ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigrations();
