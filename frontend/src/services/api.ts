import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (username: string, password: string, nickname: string, grade: number) =>
    api.post('/auth/register', { username, password, nickname, grade }),

  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),

  loginAdmin: (username: string, password: string) =>
    api.post('/auth/admin/login', { username, password }),

  registerAdmin: (username: string, password: string) =>
    api.post('/auth/admin/register', { username, password }),

  getCurrentUser: () =>
    api.get('/auth/me'),
};

// Problems API
export const problemsAPI = {
  getChapters: () =>
    api.get('/chapters'),

  getProblemsByChapter: (chapterId: number) =>
    api.get(`/chapters/${chapterId}/problems`),

  getUserProgress: (chapterId: number) =>
    api.get(`/chapters/${chapterId}/progress`),

  getProblemDetails: (problemId: number) =>
    api.get(`/problems/${problemId}`),

  getHints: (problemId: number) =>
    api.get(`/problems/${problemId}/hints`),
};

// Submissions API
export const submissionsAPI = {
  submitSolution: (problemId: number, formData: FormData) =>
    api.post(`/submissions/problems/${problemId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getHistory: () =>
    api.get('/submissions/history'),
};

// Admin API
export const adminAPI = {
  createStudent: (username: string, password: string, nickname: string, grade: number) =>
    api.post('/admin/students', { username, password, nickname, grade }),

  getAllUsers: () =>
    api.get('/admin/users'),

  getUserDetails: (userId: number) =>
    api.get(`/admin/users/${userId}`),

  getStatistics: () =>
    api.get('/admin/statistics'),

  getProblemAnalytics: () =>
    api.get('/admin/analytics/problems'),

  getAllProblems: () =>
    api.get('/admin/problems'),

  uploadCorrectSB3: (problemId: number, formData: FormData) =>
    api.post(`/admin/problems/${problemId}/upload-correct`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  updateScratchEditorUrl: (problemId: number, scratchEditorUrl: string) =>
    api.patch(`/admin/problems/${problemId}/scratch-url`, { scratchEditorUrl }),

  updateCorrectAnswer: (problemId: number, correctAnswerX: number, correctAnswerY: number) =>
    api.patch(`/admin/problems/${problemId}/correct-answer`, { correctAnswerX, correctAnswerY }),

  getDetailedAnalytics: () =>
    api.get('/admin/analytics/detailed'),

  exportAnalyticsCSV: () =>
    api.get('/admin/analytics/export/csv', { responseType: 'blob' }),

  exportAnalyticsJSON: () =>
    api.get('/admin/analytics/export/json', { responseType: 'blob' }),
};

export default api;
