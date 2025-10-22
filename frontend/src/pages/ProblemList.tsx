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

  const getProblemTypeImage = (type: string) => {
    const images: Record<string, string> = {
      fill_blank: '/右に向かって走るひよこ.png',
      predict: '/虫眼鏡を除くひよこ.png',
      find_error: '/はてなマークを浮かべるひよこ.png',
      mission: '/ノートパソコンを開いて作業をするひよこ.png',
    };
    return images[type] || images.fill_blank;
  };

  const getProblemTypeName = (type: string) => {
    switch (type) {
      case 'fill_blank':
        return '<ruby>穴埋<rt>あなう</rt></ruby>め<ruby>問題<rt>もんだい</rt></ruby>';
      case 'predict':
        return '<ruby>予測<rt>よそく</rt></ruby><ruby>問題<rt>もんだい</rt></ruby>';
      case 'find_error':
        return '<ruby>間違<rt>まちが</rt></ruby>い<ruby>探<rt>さが</rt></ruby>し<ruby>問題<rt>もんだい</rt></ruby>';
      case 'mission':
        return 'ミッション<ruby>型<rt>がた</rt></ruby><ruby>問題<rt>もんだい</rt></ruby>';
      default:
        return '<ruby>問題<rt>もんだい</rt></ruby>';
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
          ← チャプター<ruby>一覧<rt>いちらん</rt></ruby>に<ruby>戻<rt>もど</rt></ruby>る
        </Link>
        <h1 className="text-4xl font-bold text-primary-700 mb-2" dangerouslySetInnerHTML={{ __html: chapter.title }}></h1>
        <p className="text-gray-600 text-lg" dangerouslySetInnerHTML={{ __html: chapter.description }}></p>
      </div>

      {problems.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          このチャプターにはまだ<ruby>問題<rt>もんだい</rt></ruby>がありません。
        </div>
      ) : (
        <div className="grid gap-6">
          {problems.map((problem) => {
            const progress = userProgress[problem.id];
            const isCompleted = progress?.is_correct;
            const score = progress?.score || 0;
            const problemImageSrc = getProblemTypeImage(problem.problem_type);

            return (
              <Link
                key={problem.id}
                to={`/problems/${problem.id}`}
                className={`bg-white rounded-xl shadow-lg p-8 card-hover relative overflow-hidden border-2 ${
                  score === 100
                    ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50'
                    : 'border-transparent hover:border-blue-200'
                }`}
              >
                {/* 満点時の装飾的な背景要素 */}
                {score === 100 && (
                  <div className="absolute -top-10 -right-10 opacity-20 pointer-events-none text-9xl">
                    🏆
                  </div>
                )}

                {/* 完了バッジ */}
                {isCompleted && (
                  <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                    score === 100
                      ? 'bg-yellow-400 text-gray-800'
                      : 'bg-green-500 text-white'
                  }`} dangerouslySetInnerHTML={{ __html: score === 100 ? '⭐ 100<ruby>点<rt>てん</rt></ruby><ruby>満点<rt>まんてん</rt></ruby>!' : `✓ <ruby>完了<rt>かんりょう</rt></ruby> (${score}<ruby>点<rt>てん</rt></ruby>)` }}>
                  </div>
                )}

                <div className="flex items-start gap-6">
                  {/* 問題タイプごとのイラスト */}
                  <div className="flex-shrink-0">
                    <img
                      src={problem.image_url || problemImageSrc}
                      alt={getProblemTypeName(problem.problem_type)}
                      className="w-24 h-24 object-contain"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-base font-bold" dangerouslySetInnerHTML={{ __html: getProblemTypeName(problem.problem_type) }}>
                      </span>
                      <span className={`px-4 py-2 rounded-lg text-base font-bold ${getDifficultyColor(problem.difficulty_level)}`}>
                        {getDifficultyText(problem.difficulty_level)}
                      </span>
                    </div>

                    <h2 className={`text-3xl font-bold mb-2 ${score === 100 ? 'text-orange-700' : 'text-gray-800'}`} dangerouslySetInnerHTML={{ __html: problem.title }}>
                    </h2>
                  </div>
                </div>

                <div className="mt-4 text-right">
                  <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium ${
                    score === 100
                      ? 'bg-yellow-500 text-white'
                      : 'bg-blue-600 text-white'
                  }`}>
                    <span dangerouslySetInnerHTML={{ __html: isCompleted ? '<ruby>再挑戦<rt>さいちょうせん</rt></ruby>する' : '<ruby>挑戦<rt>ちょうせん</rt></ruby>する' }}></span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
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
