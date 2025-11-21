import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import Loading from '../components/Loading';

// Type definitions for detailed analytics
interface ProblemAnalytic {
  problem_id: number;
  problem_title: string;
  problem_type: string;
  difficulty_level: number;
  problem_order: number;
  chapter_id: number;
  chapter_title: string;
  chapter_order: number;
  unique_students: number;
  total_submissions: number;
  correct_submissions: number;
  correct_rate: number;
  avg_score: number;
  avg_time_spent_seconds: number;
  avg_attempts_to_solve: number;
  avg_hint_usage: number;
  first_attempt_success: number;
  first_attempt_total: number;
  min_time_spent: number;
  max_time_spent: number;
  median_time_spent: number;
}

interface ErrorPattern {
  problem_id: number;
  problem_title: string;
  problem_type: string;
  error_message: string;
  error_count: number;
  affected_students: number;
}

interface StudentAnalytic {
  student_id: number;
  nickname: string;
  grade: number;
  registration_date: string;
  problems_attempted: number;
  problems_solved: number;
  total_submissions: number;
  correct_submissions: number;
  correct_rate: number;
  avg_score: number;
  avg_attempts: number;
  total_time_spent: number;
  fill_blank_correct: number;
  fill_blank_submissions: number;
  predict_correct: number;
  predict_submissions: number;
  find_error_correct: number;
  find_error_submissions: number;
  mission_correct: number;
  mission_submissions: number;
}

interface ProblemTypeAnalytic {
  problem_type: string;
  students_attempted: number;
  total_submissions: number;
  correct_submissions: number;
  correct_rate: number;
  avg_score: number;
  avg_time_spent: number;
  avg_attempts: number;
}

interface TimeSeriesData {
  date?: string;
  week_start?: string;
  month_start?: string;
  submissions: number;
  correct_submissions: number;
  active_students: number;
  correct_rate: number;
  avg_score: number;
}

interface StrugglingPoint {
  problem_id: number;
  problem_title: string;
  problem_type: string;
  chapter_title: string;
  total_attempts: number;
  correct_attempts: number;
  success_rate: number;
  avg_attempts_to_solve: number;
  avg_time_spent: number;
}

interface AttemptProgression {
  attempt_number: number;
  total_attempts: number;
  successful_attempts: number;
  success_rate: number;
}

interface DetailedAnalytics {
  problemAnalytics: ProblemAnalytic[];
  errorPatterns: ErrorPattern[];
  studentAnalysis: StudentAnalytic[];
  problemTypeAnalysis: ProblemTypeAnalytic[];
  timeSeriesDaily: TimeSeriesData[];
  timeSeriesWeekly: TimeSeriesData[];
  timeSeriesMonthly: TimeSeriesData[];
  strugglingPoints: StrugglingPoint[];
  attemptProgression: AttemptProgression[];
}

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'problems' | 'students' | 'errors' | 'timeseries'>('overview');
  const [timeSeriesView, setTimeSeriesView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await adminAPI.getDetailedAnalytics();
      setAnalytics(response.data);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      setError('分析データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getProblemTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; icon: string; color: string }> = {
      fill_blank: { label: '穴埋め問題', icon: '', color: 'text-blue-600' },
      predict: { label: '予測問題', icon: '', color: 'text-purple-600' },
      find_error: { label: 'バグ発見', icon: '', color: 'text-red-600' },
      mission: { label: 'ミッション', icon: '', color: 'text-green-600' },
    };
    return labels[type] || { label: type, icon: '', color: 'text-gray-600' };
  };

  const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}分`;
    return `${Math.round(seconds / 3600)}時間`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return <Loading />;

  if (error || !analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'エラーが発生しました'}
        </div>
      </div>
    );
  }

  const totalStudents = analytics.studentAnalysis.length;
  const totalProblems = analytics.problemAnalytics.length;
  const totalSubmissions = analytics.problemAnalytics.reduce((sum, p) => sum + Number(p.total_submissions), 0);
  const totalCorrect = analytics.problemAnalytics.reduce((sum, p) => sum + Number(p.correct_submissions), 0);
  const overallSuccessRate = totalSubmissions > 0 ? Math.round((totalCorrect / totalSubmissions) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary-700 mb-2">学習分析ダッシュボード</h1>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'overview', label: '全体概要', icon: '' },
            { key: 'problems', label: '問題別分析', icon: '' },
            { key: 'students', label: '生徒別分析', icon: '' },
            { key: 'errors', label: 'エラー分析', icon: '' },
            { key: 'timeseries', label: '時系列分析', icon: '' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 font-medium transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium">総生徒数</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{totalStudents}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium">総問題数</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{totalProblems}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium">総提出数</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{totalSubmissions}</p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium">全体正解率</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{overallSuccessRate}%</p>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Problem Type Comparison */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">問題タイプ別比較</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.problemTypeAnalysis.map((type) => {
                const typeInfo = getProblemTypeLabel(type.problem_type);
                const correctRate = Number(type.correct_rate);

                return (
                  <div key={type.problem_type} className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 transition">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`font-bold ${typeInfo.color}`}>{typeInfo.label}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">挑戦者:</span>
                        <span className="font-bold">{type.students_attempted}人</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">提出回数:</span>
                        <span className="font-bold">{type.total_submissions}回</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">正解率:</span>
                        <span className="font-bold text-green-600">{correctRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">平均試行:</span>
                        <span className="font-bold">{Number(type.avg_attempts).toFixed(1)}回</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning Curve - Attempt Progression */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">学習曲線（試行回数と正解率の関係）</h2>
            <p className="text-gray-600 mb-6">試行回数が増えるにつれて正解率がどう変化するかを示します</p>
            <div className="space-y-3">
              {analytics.attemptProgression.slice(0, 10).map((attempt) => {
                const successRate = Number(attempt.success_rate);
                const barColor =
                  successRate >= 80 ? 'bg-green-500' :
                  successRate >= 50 ? 'bg-yellow-500' :
                  'bg-red-500';

                return (
                  <div key={attempt.attempt_number}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {attempt.attempt_number}回目の挑戦
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        {successRate}% ({attempt.successful_attempts}/{attempt.total_attempts})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${barColor} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${successRate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Struggling Points - Top 10 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">つまずきポイント TOP10</h2>
            <p className="text-gray-600 mb-6">成功率が低く、生徒が苦戦している問題</p>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">順位</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">問題</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイプ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">成功率</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均試行回数</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均時間</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.strugglingPoints.slice(0, 10).map((point, index) => {
                    const typeInfo = getProblemTypeLabel(point.problem_type);
                    const successRate = Number(point.success_rate);

                    return (
                      <tr key={point.problem_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-gray-800">#{index + 1}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div dangerouslySetInnerHTML={{ __html: point.problem_title }} className="text-sm font-medium text-gray-900"></div>
                          <div className="text-xs text-gray-500" dangerouslySetInnerHTML={{ __html: point.chapter_title }}></div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`text-sm ${typeInfo.color}`}>{typeInfo.label}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`font-bold ${successRate < 30 ? 'text-red-600' : successRate < 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {successRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-800">{Number(point.avg_attempts_to_solve).toFixed(1)}回</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-800">{formatTime(Number(point.avg_time_spent))}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Problems Tab - Problem-by-Problem Analysis */}
      {activeTab === 'problems' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
            <p className="text-blue-800 font-medium">
              各問題の詳細な統計データを表示します。一回目正答率は特に重要な指標です。
            </p>
          </div>

          {analytics.problemAnalytics.map((problem) => {
            const typeInfo = getProblemTypeLabel(problem.problem_type);
            const correctRate = Number(problem.correct_rate);
            const firstAttemptRate = problem.first_attempt_total > 0
              ? Math.round((Number(problem.first_attempt_success) / Number(problem.first_attempt_total)) * 100)
              : 0;

            return (
              <div key={problem.problem_id} className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
                {/* Problem Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${typeInfo.color} bg-gray-100`}>
                        {typeInfo.label}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-200 text-gray-700">
                        難易度 {problem.difficulty_level}
                      </span>
                    </div>
                    <h3
                      className="text-xl font-bold text-gray-800 mb-1"
                      dangerouslySetInnerHTML={{ __html: problem.problem_title }}
                    ></h3>
                    <p className="text-gray-600 text-sm" dangerouslySetInnerHTML={{ __html: problem.chapter_title }}></p>
                  </div>
                  <div className={`px-6 py-3 rounded-lg text-center ${
                    correctRate >= 80 ? 'bg-green-100' :
                    correctRate >= 50 ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    <div className={`text-3xl font-bold ${
                      correctRate >= 80 ? 'text-green-700' :
                      correctRate >= 50 ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {correctRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">正解率</div>
                    <div className="text-xs text-gray-500 mt-1">(提出回数ベース)</div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">挑戦者数</p>
                    <p className="text-2xl font-bold text-blue-700">{problem.unique_students}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">提出回数</p>
                    <p className="text-2xl font-bold text-purple-700">{problem.total_submissions}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">正解回数</p>
                    <p className="text-2xl font-bold text-green-700">{problem.correct_submissions}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">平均スコア</p>
                    <p className="text-2xl font-bold text-yellow-700">{Number(problem.avg_score).toFixed(0)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">平均試行回数</p>
                    <p className="text-2xl font-bold text-red-700">{Number(problem.avg_attempts_to_solve).toFixed(1)}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">平均時間</p>
                    <p className="text-2xl font-bold text-indigo-700">{formatTime(Number(problem.avg_time_spent_seconds))}</p>
                  </div>
                </div>

                {/* Critical Insight - First Attempt Success Rate */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">一回目の挑戦での正解率（重要指標）</p>
                      <p className="text-xs text-gray-600">
                        {problem.first_attempt_success}人/{problem.first_attempt_total}人が一回目で正解
                      </p>
                    </div>
                    <div className="text-4xl font-bold text-orange-600">
                      {firstAttemptRate}%
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${firstAttemptRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Time Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">所要時間の分布</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">最短:</span>
                        <span className="font-bold">{formatTime(Number(problem.min_time_spent))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">中央値:</span>
                        <span className="font-bold">{formatTime(Number(problem.median_time_spent))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">最長:</span>
                        <span className="font-bold">{formatTime(Number(problem.max_time_spent))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">ヒント使用状況</p>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{Number(problem.avg_hint_usage).toFixed(1)}</div>
                      <div className="text-xs text-gray-600">平均ヒント使用回数</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">問題の評価</p>
                    <div className="text-xs space-y-1">
                      {correctRate < 40 && (
                        <p className="text-red-600 font-medium">難易度が高すぎる可能性</p>
                      )}
                      {correctRate > 90 && (
                        <p className="text-blue-600 font-medium">難易度が適切または易しい</p>
                      )}
                      {firstAttemptRate < 30 && (
                        <p className="text-orange-600 font-medium">問題文の改善を検討</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Students Tab - Student-by-Student Analysis */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
            <p className="text-green-800 font-medium">
              各生徒の学習状況と得意/苦手な問題タイプを分析します。ニックネームは論文用に保持されています。
            </p>
          </div>

          <div className="grid gap-6">
            {analytics.studentAnalysis.map((student) => {
              const correctRate = Number(student.correct_rate);

              const fillBlankRate = student.fill_blank_submissions > 0
                ? Math.round((student.fill_blank_correct / student.fill_blank_submissions) * 100)
                : 0;
              const predictRate = student.predict_submissions > 0
                ? Math.round((student.predict_correct / student.predict_submissions) * 100)
                : 0;
              const findErrorRate = student.find_error_submissions > 0
                ? Math.round((student.find_error_correct / student.find_error_submissions) * 100)
                : 0;
              const missionRate = student.mission_submissions > 0
                ? Math.round((student.mission_correct / student.mission_submissions) * 100)
                : 0;

              const problemTypes = [
                { name: '穴埋め', rate: fillBlankRate, icon: '', submissions: student.fill_blank_submissions, correct: student.fill_blank_correct },
                { name: '予測', rate: predictRate, icon: '', submissions: student.predict_submissions, correct: student.predict_correct },
                { name: 'バグ発見', rate: findErrorRate, icon: '', submissions: student.find_error_submissions, correct: student.find_error_correct },
                { name: 'ミッション', rate: missionRate, icon: '', submissions: student.mission_submissions, correct: student.mission_correct },
              ].filter(t => t.submissions > 0);

              const weakestType = problemTypes.reduce((min, type) => type.rate < min.rate ? type : min, problemTypes[0]);
              const strongestType = problemTypes.reduce((max, type) => type.rate > max.rate ? type : max, problemTypes[0]);

              return (
                <div key={student.student_id} className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-700">{student.nickname.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{student.nickname}</h3>
                        <p className="text-sm text-gray-600">
                          {student.grade}年生 | 登録日: {formatDate(student.registration_date)}
                        </p>
                      </div>
                    </div>
                    <div className={`px-6 py-3 rounded-lg text-center ${
                      correctRate >= 80 ? 'bg-green-100' :
                      correctRate >= 50 ? 'bg-yellow-100' :
                      'bg-red-100'
                    }`}>
                      <div className={`text-3xl font-bold ${
                        correctRate >= 80 ? 'text-green-700' :
                        correctRate >= 50 ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {correctRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600 mt-1">正解率</div>
                      <div className="text-xs text-gray-500 mt-1">(提出ベース)</div>
                    </div>
                  </div>

                  {/* Overall Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">{student.problems_attempted}問</p>
                      <p className="text-xs text-gray-600">挑戦した問題</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{student.problems_solved}問</p>
                      <p className="text-xs text-gray-600">正解した問題</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-700">{student.total_submissions}回</p>
                      <p className="text-xs text-gray-600">総提出回数</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-700">{Number(student.avg_score).toFixed(0)}</p>
                      <p className="text-xs text-gray-600">平均スコア</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-purple-700">{Number(student.avg_attempts).toFixed(1)}</p>
                      <p className="text-xs text-gray-600">平均試行回数</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-700">{formatTime(Number(student.total_time_spent))}</p>
                      <p className="text-xs text-gray-600">総学習時間</p>
                    </div>
                  </div>

                  {/* Problem Type Performance */}
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">問題タイプ別の成績（提出ベース）</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { name: '穴埋め', icon: '', rate: fillBlankRate, correct: student.fill_blank_correct, submissions: student.fill_blank_submissions },
                        { name: '予測', icon: '', rate: predictRate, correct: student.predict_correct, submissions: student.predict_submissions },
                        { name: 'バグ発見', icon: '', rate: findErrorRate, correct: student.find_error_correct, submissions: student.find_error_submissions },
                        { name: 'ミッション', icon: '', rate: missionRate, correct: student.mission_correct, submissions: student.mission_submissions },
                      ].map((type) => (
                        <div key={type.name} className="border-2 border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-700">{type.name}</span>
                          </div>
                          <div className="text-center">
                            <div className={`text-xl font-bold ${
                              type.rate >= 80 ? 'text-green-600' :
                              type.rate >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {type.submissions > 0 ? `${type.rate}%` : '-'}
                            </div>
                            <div className="text-xs text-gray-600">{type.correct}正解/{type.submissions}提出</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Insights */}
                  {problemTypes.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-4">
                      <p className="text-sm font-bold text-gray-800 mb-2">学習傾向の分析</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-green-700 font-medium">
                            得意: {strongestType.name} ({strongestType.rate}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-red-700 font-medium">
                            苦手: {weakestType.name} ({weakestType.rate}%)
                          </p>
                        </div>
                      </div>
                      {correctRate < 50 && (
                        <p className="text-orange-700 font-medium mt-2 text-sm">
                          推奨: {weakestType.name}問題の復習とヒントの活用を促してください
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Errors Tab - Error Pattern Analysis */}
      {activeTab === 'errors' && (
        <div className="space-y-6">
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <p className="text-red-800 font-medium">
              よく発生するエラーパターンを分析します。エラーメッセージから生徒のつまずきポイントを特定できます。
            </p>
          </div>

          {analytics.errorPatterns.length === 0 ? (
            <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-8 text-center">
              <p className="text-gray-600 text-lg">エラーデータがありません</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">問題</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイプ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">エラーメッセージ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">発生回数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">影響を受けた生徒</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.errorPatterns.map((error, index) => {
                    const typeInfo = getProblemTypeLabel(error.problem_type);

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div dangerouslySetInnerHTML={{ __html: error.problem_title }} className="text-sm font-medium text-gray-900"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${typeInfo.color}`}>{typeInfo.label}</span>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            {error.error_message}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-red-600">{error.error_count}回</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-gray-800">{error.affected_students}人</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Time Series Tab */}
      {activeTab === 'timeseries' && (
        <div className="space-y-6">
          <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 flex justify-between items-center">
            <p className="text-purple-800 font-medium">
              時系列で学習活動を追跡します。日別、週別、月別の粒度で表示できます。
            </p>
            <div className="flex gap-2">
              {['daily', 'weekly', 'monthly'].map((view) => (
                <button
                  key={view}
                  onClick={() => setTimeSeriesView(view as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    timeSeriesView === view
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-purple-600 border-2 border-purple-300 hover:bg-purple-100'
                  }`}
                >
                  {view === 'daily' ? '日別' : view === 'weekly' ? '週別' : '月別'}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const data =
              timeSeriesView === 'daily' ? analytics.timeSeriesDaily :
              timeSeriesView === 'weekly' ? analytics.timeSeriesWeekly :
              analytics.timeSeriesMonthly;

            if (data.length === 0) {
              return (
                <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-8 text-center">
                  <p className="text-gray-600 text-lg">データがありません</p>
                </div>
              );
            }

            return (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {timeSeriesView === 'daily' ? '日別' : timeSeriesView === 'weekly' ? '週別' : '月別'}の学習活動
                </h2>
                <div className="space-y-4">
                  {data.map((item, index) => {
                    const dateLabel = item.date
                      ? formatDate(item.date)
                      : item.week_start
                      ? `${formatDate(item.week_start)}の週`
                      : item.month_start
                      ? new Date(item.month_start).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
                      : '';

                    const correctRate = Number(item.correct_rate);

                    return (
                      <div key={index} className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 transition">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="font-bold text-gray-800">{dateLabel}</p>
                            <p className="text-sm text-gray-600">アクティブ生徒: {item.active_students}人</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary-600">{item.submissions}回</p>
                            <p className="text-xs text-gray-600">提出回数</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="bg-green-50 rounded p-2 text-center">
                            <p className="text-lg font-bold text-green-700">{item.correct_submissions}回</p>
                            <p className="text-xs text-gray-600">正解回数</p>
                          </div>
                          <div className="bg-yellow-50 rounded p-2 text-center">
                            <p className="text-lg font-bold text-yellow-700">{correctRate.toFixed(1)}%</p>
                            <p className="text-xs text-gray-600">正解率</p>
                          </div>
                          <div className="bg-blue-50 rounded p-2 text-center">
                            <p className="text-lg font-bold text-blue-700">{Number(item.avg_score || 0).toFixed(0)}点</p>
                            <p className="text-xs text-gray-600">平均スコア</p>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              correctRate >= 80 ? 'bg-green-500' :
                              correctRate >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${correctRate}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
