import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import Loading from '../components/Loading';

interface ProblemAnalytics {
  problem_id: number;
  problem_title: string;
  problem_type: string;
  chapter_title: string;
  difficulty_level: number;
  total_attempts: number;
  unique_users: number;
  correct_attempts: number;
  average_score: number;
  average_time_spent: number;
  average_attempts_to_solve: number;
}

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<ProblemAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await adminAPI.getProblemAnalytics();
        setAnalytics(response.data.analytics || []);
      } catch (error: any) {
        console.error('Failed to fetch analytics:', error);
        setError('分析データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
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

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'bg-green-100 text-green-800';
    if (level <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-primary-700 mb-8">問題分析</h1>

      <div className="grid gap-6">
        {analytics.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            まだ分析データがありません
          </div>
        ) : (
          analytics.map((problem) => {
            const successRate = problem.total_attempts > 0
              ? Math.round((problem.correct_attempts / problem.total_attempts) * 100)
              : 0;

            const difficultyRating =
              successRate >= 80 ? 'かんたん' :
              successRate >= 50 ? 'ふつう' :
              'むずかしい';

            return (
              <div key={problem.problem_id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{getProblemTypeIcon(problem.problem_type)}</div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                        {getProblemTypeName(problem.problem_type)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(problem.difficulty_level)}`}>
                        難易度: {problem.difficulty_level}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-1">
                      {problem.problem_title}
                    </h2>
                    <p className="text-gray-600 text-sm">{problem.chapter_title}</p>
                  </div>

                  <div className="text-right">
                    <div className={`inline-block px-4 py-2 rounded-lg font-bold ${
                      successRate >= 80 ? 'bg-green-100 text-green-700' :
                      successRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      成功率: {successRate}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">実質難易度: {difficultyRating}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase">総試行回数</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {problem.total_attempts}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase">挑戦者数</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {problem.unique_users}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase">正解数</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {problem.correct_attempts}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase">平均スコア</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                      {Math.round(problem.average_score)}点
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase">平均試行回数</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {problem.average_attempts_to_solve ?
                        Math.round(problem.average_attempts_to_solve * 10) / 10 :
                        0}回
                    </p>
                  </div>
                </div>

                {problem.average_time_spent > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      平均所要時間: {Math.round(problem.average_time_spent / 60)}分
                    </p>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>成功率の可視化</span>
                    <span>{successRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        successRate >= 80 ? 'bg-green-500' :
                        successRate >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${successRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Recommendations */}
                {successRate < 50 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      <strong>推奨:</strong> この問題は成功率が低いです。問題文やヒントの改善を検討してください。
                    </p>
                  </div>
                )}

                {successRate > 90 && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>推奨:</strong> この問題は成功率が高いです。難易度を上げることを検討できます。
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
