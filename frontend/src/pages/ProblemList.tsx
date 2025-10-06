import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { problemsAPI } from '../services/api';
import { Problem, Chapter } from '../types';
import Loading from '../components/Loading';

const ProblemList: React.FC = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userProgress, setUserProgress] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!chapterId) {
        setError('チャプターIDが指定されていません');
        setLoading(false);
        return;
      }

      try {
        const [chaptersRes, problemsRes, progressRes] = await Promise.all([
          problemsAPI.getChapters(),
          problemsAPI.getProblemsByChapter(parseInt(chapterId)),
          problemsAPI.getUserProgress(parseInt(chapterId))
        ]);

        const currentChapter = chaptersRes.data.chapters.find(
          (c: Chapter) => c.id === parseInt(chapterId)
        );

        if (!currentChapter) {
          setError('チャプターが見つかりません');
          setLoading(false);
          return;
        }

        setChapter(currentChapter);
        setProblems(problemsRes.data.problems || []);

        // APIから配列形式で返ってくるprogressをオブジェクトに変換
        const progressArray = progressRes.data.progress || [];
        const progressMap = progressArray.reduce((acc: any, item: any) => {
          acc[item.id] = item;
          return acc;
        }, {});
        setUserProgress(progressMap);
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chapterId]);

  const getProblemTypeIcon = (type: string) => {
    switch (type) {
      case 'fill_blank':
        return '📝';
      case 'predict':
        return '🔮';
      case 'find_error':
        return '🐛';
      case 'mission':
        return '🚀';
      default:
        return '📚';
    }
  };

  const getProblemTypeName = (type: string) => {
    switch (type) {
      case 'fill_blank':
        return '穴埋め問題';
      case 'predict':
        return '予測問題';
      case 'find_error':
        return '間違い探し問題';
      case 'mission':
        return 'ミッション型問題';
      default:
        return '問題';
    }
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'bg-green-100 text-green-800';
    if (level <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyText = (level: number) => {
    if (level <= 2) return 'かんたん';
    if (level <= 3) return 'ふつう';
    return 'むずかしい';
  };

  if (loading) return <Loading />;

  if (error || !chapter) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'エラーが発生しました'}
        </div>
        <button
          onClick={() => navigate('/chapters')}
          className="mt-4 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          チャプター一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          to="/chapters"
          className="text-primary-600 hover:text-primary-700 mb-4 inline-block"
        >
          ← チャプター一覧に戻る
        </Link>
        <h1 className="text-4xl font-bold text-primary-700 mb-2">{chapter.title}</h1>
        <p className="text-gray-600 text-lg">{chapter.description}</p>
      </div>

      {problems.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          このチャプターにはまだ問題がありません。
        </div>
      ) : (
        <div className="grid gap-6">
          {problems.map((problem) => {
            const progress = userProgress[problem.id];
            const isCompleted = progress?.is_correct;
            const score = progress?.score || 0;

            return (
              <Link
                key={problem.id}
                to={`/problems/${problem.id}`}
                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-1 relative overflow-hidden ${
                  score === 100 ? 'border-4 border-lime-400 bg-gradient-to-br from-lime-50 to-yellow-50 shadow-lime-200' : ''
                }`}
              >
                {/* 満点時の装飾的な背景要素 */}
                {score === 100 && (
                  <div className="absolute -top-10 -right-10 text-9xl opacity-10 pointer-events-none">
                    🏆
                  </div>
                )}

                {/* 完了バッジ */}
                {isCompleted && (
                  <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                    score === 100
                      ? 'bg-lime-400 text-gray-800'
                      : 'bg-green-500 text-white'
                  }`}>
                    {score === 100 ? '🌟 満点! 100点' : `✓ 完了 (${score}点)`}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-lg text-sm font-medium">
                      {getProblemTypeName(problem.problem_type)}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getDifficultyColor(problem.difficulty_level)}`}>
                      {getDifficultyText(problem.difficulty_level)}
                    </span>
                  </div>

                  <h2 className={`text-2xl font-bold mb-2 ${score === 100 ? 'text-lime-700' : 'text-gray-800'}`}>
                    {problem.title}
                  </h2>
                  <p className="text-gray-600">{problem.description}</p>
                </div>

                <div className="mt-4 text-right">
                  <span className={`px-6 py-2 rounded-lg font-medium inline-block ${
                    score === 100
                      ? 'bg-lime-500 text-white'
                      : 'bg-primary-600 text-white'
                  }`}>
                    {isCompleted ? '再挑戦する' : '挑戦する'} →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProblemList;
