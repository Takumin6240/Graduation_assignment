import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { submissionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';

interface Submission {
  id: number;
  problem_id: number;
  title: string;
  problem_type: string;
  chapter_title: string;
  is_correct: boolean;
  score: number;
  total_attempts: number;
  hint_usage_count: number;
  time_spent: number;
  completed_at: string;
}

const Progress: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await submissionsAPI.getHistory();
        setSubmissions(response.data.submissions || []);
      } catch (error: any) {
        console.error('Failed to fetch submissions:', error);
        setError('提出履歴の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const getProblemTypeIcon = (type: string) => {
    switch (type) {
      case 'fill_blank': return '📝';
      case 'predict': return '🔮';
      case 'find_error': return '🐛';
      case 'mission': return '🚀';
      default: return '📚';
    }
  };

  const getProblemTypeName = (type: string) => {
    switch (type) {
      case 'fill_blank': return '穴埋め問題';
      case 'predict': return '予測問題';
      case 'find_error': return '間違い探し問題';
      case 'mission': return 'ミッション型問題';
      default: return '問題';
    }
  };

  const totalSolved = submissions.filter(s => s.is_correct).length;
  const totalScore = submissions.reduce((sum, s) => sum + s.score, 0);
  const averageScore = submissions.length > 0 ? Math.round(totalScore / submissions.length) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-primary-700 mb-8">学習進捗</h1>

      {/* User Stats */}
      {user && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">こんにちは、{user.nickname}さん！</h2>
              <p className="text-primary-100 text-lg">{user.grade}年生 | レベル {user.level}</p>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-sm font-medium mb-1">経験値</p>
                <p className="text-4xl font-bold">{user.exp} EXP</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">解いた問題数</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{totalSolved}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">挑戦回数</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{submissions.length}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">平均スコア</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{averageScore}点</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Submission History */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">提出履歴</h2>

        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">まだ提出がありません</p>
            <Link
              to="/chapters"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 inline-block"
            >
              問題に挑戦する
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getProblemTypeIcon(submission.problem_type)}</div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                        {getProblemTypeName(submission.problem_type)}
                      </span>
                      {submission.is_correct ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          ✓ 正解
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                          ✗ 不正解
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {submission.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{submission.chapter_title}</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">スコア</p>
                        <p className="font-bold text-yellow-600">{submission.score}点</p>
                      </div>
                      <div>
                        <p className="text-gray-500">試行回数</p>
                        <p className="font-bold text-blue-600">{submission.total_attempts}回</p>
                      </div>
                      <div>
                        <p className="text-gray-500">所要時間</p>
                        <p className="font-bold text-gray-700">
                          {submission.time_spent > 0 ? `${Math.round(submission.time_spent / 60)}分` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(submission.completed_at).toLocaleDateString('ja-JP')}
                    </p>
                    <Link
                      to={`/problems/${submission.problem_id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      もう一度挑戦 →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;
