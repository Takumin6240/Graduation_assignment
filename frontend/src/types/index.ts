export interface User {
  id: number;
  username: string;
  nickname: string;
  grade: number;
  level: number;
  exp: number;
  created_at?: string;
}

export interface Admin {
  id: number;
  username: string;
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  order_number: number;
  created_at?: string;
}

export type ProblemType = 'fill_blank' | 'predict' | 'find_error' | 'mission';

export interface Problem {
  id: number;
  chapter_id: number;
  problem_type: ProblemType;
  title: string;
  learning_objective?: string;
  description: string;
  initial_sb3_data?: any;
  scratch_editor_url?: string;
  max_score: number;
  difficulty_level: number;
  order_number: number;
  created_at?: string;
}

export interface Hint {
  id: number;
  problem_id: number;
  grade: number;
  hint_text: string;
  hint_order: number;
}

export interface Submission {
  id: number;
  user_id: number;
  problem_id: number;
  is_correct: boolean;
  score: number;
  total_attempts: number;
  hint_usage_count: number;
  time_spent: number;
  completed_at: string;
}

export interface SubmissionResult {
  isCorrect: boolean;
  score: number;
  message: string;
  attemptNumber: number;
  totalAttempts: number;
}

export interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  login: (username: string, password: string) => Promise<void>;
  loginAdmin: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, nickname: string, grade: number) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}
