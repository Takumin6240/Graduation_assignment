import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { problemsAPI, submissionsAPI } from '../services/api';
import { Problem, Hint } from '../types';
import Loading from '../components/Loading';
import ExpGauge from '../components/ExpGauge';
import LevelUpModal from '../components/LevelUpModal';
import { useAuth } from '../contexts/AuthContext';

const ProblemDetail: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [answerX, setAnswerX] = useState<string>('');
  const [answerY, setAnswerY] = useState<string>('');
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [displayedExp, setDisplayedExp] = useState(0);
  const [hints, setHints] = useState<Hint[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [hintUsageCount, setHintUsageCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Reset start time when problem changes
        setStartTime(Date.now());
        setShowHints(false);
        setHintUsageCount(0);

        const problemRes = await problemsAPI.getProblemDetails(Number(problemId));
        setProblem(problemRes.data.problem);

        // Fetch all problems in the same chapter to find next problem
        if (problemRes.data.problem.chapter_id) {
          const problemsRes = await problemsAPI.getProblemsByChapter(problemRes.data.problem.chapter_id);
          setAllProblems(problemsRes.data.problems || []);
        }

        // Fetch hints for this problem
        try {
          const hintsRes = await problemsAPI.getHints(Number(problemId));
          setHints(hintsRes.data.hints || []);
        } catch (error) {
          console.error('Failed to fetch hints:', error);
          setHints([]);
        }
      } catch (error) {
        console.error('Failed to fetch problem:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [problemId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleToggleHints = () => {
    if (!showHints && hintUsageCount === 0) {
      // First time viewing hints
      setHintUsageCount(1);
    }
    setShowHints(!showHints);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For predict problems, check coordinate input
    if (problem?.problem_type === 'predict') {
      if (answerX === '' || answerY === '') {
        alert('X座標とY座標を入力してください');
        return;
      }
    } else {
      // For other problems, check file upload
      if (!file) {
        alert('SB3ファイルを選択してください');
        return;
      }
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      if (problem?.problem_type === 'predict') {
        formData.append('answerX', answerX);
        formData.append('answerY', answerY);
      } else {
        formData.append('sb3File', file!);
      }

      formData.append('hintUsageCount', String(hintUsageCount));
      formData.append('timeSpent', String(Math.floor((Date.now() - startTime) / 1000)));

      const response = await submissionsAPI.submitSolution(Number(problemId), formData);
      setResult(response.data);

      // Refresh user data to update header EXP gauge
      if (response.data.isCorrect) {
        await refreshUser();
      }

      // Show level up modal if leveled up
      if (response.data.expData?.leveledUp) {
        setTimeout(() => {
          setShowLevelUpModal(true);
        }, 1500); // Show after 1.5 seconds
      }

      // Animate EXP counter
      if (response.data.expData) {
        const targetExp = response.data.expData.earnedExp;
        let currentExp = 0;
        const duration = 1500; // 1.5 seconds
        const steps = 50;
        const increment = targetExp / steps;
        const stepDuration = duration / steps;

        const timer = setInterval(() => {
          currentExp += increment;
          if (currentExp >= targetExp) {
            setDisplayedExp(targetExp);
            clearInterval(timer);
          } else {
            setDisplayedExp(Math.floor(currentExp));
          }
        }, stepDuration);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '提出に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const getProblemTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fill_blank: '<ruby>穴埋<rt>あなう</rt></ruby>め<ruby>問題<rt>もんだい</rt></ruby>',
      predict: '<ruby>予測<rt>よそく</rt></ruby><ruby>問題<rt>もんだい</rt></ruby>',
      find_error: 'バグ<ruby>発見<rt>はっけん</rt></ruby><ruby>問題<rt>もんだい</rt></ruby>',
      mission: 'ミッション<ruby>問題<rt>もんだい</rt></ruby>',
    };
    return labels[type] || type;
  };

  const getProblemTypeImage = (type: string) => {
    const images: Record<string, string> = {
      fill_blank: '/右に向かって走るひよこ.png',
      predict: '/虫眼鏡を除くひよこ.png',
      find_error: '/はてなマークを浮かべるひよこ.png',
      mission: '/ノートパソコンを開いて作業をするひよこ.png',
    };
    return images[type] || images.fill_blank;
  };

  const handleOpenScratch = () => {
    const url = problem?.scratch_editor_url || 'https://scratch.mit.edu/';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <Loading />;
  if (!problem) return <div><ruby>問題<rt>もんだい</rt></ruby>が<ruby>見<rt>み</rt></ruby>つかりません</div>;

  if (result) {
    const isPerfectScore = result.score === 100;
    const expData = result.expData;

    // Find next problem
    const currentIndex = allProblems.findIndex(p => p.id === Number(problemId));
    const nextProblem = currentIndex >= 0 && currentIndex < allProblems.length - 1
      ? allProblems[currentIndex + 1]
      : null;

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Level Up Modal */}
        {expData?.leveledUp && (
          <LevelUpModal
            isOpen={showLevelUpModal}
            previousLevel={expData.previousLevel}
            newLevel={expData.newLevel}
            onClose={() => setShowLevelUpModal(false)}
          />
        )}

        <div className="max-w-2xl mx-auto">
          <div
            className={`rounded-2xl shadow-2xl p-8 text-center ${
              isPerfectScore
                ? 'bg-gradient-to-br from-lime-50 to-yellow-50 border-4 border-lime-400'
                : result.isCorrect
                ? 'bg-green-50 border-4 border-green-400'
                : 'bg-orange-50 border-4 border-orange-400'
            }`}
          >
            <div className="mb-6">
              {/* 結果に応じたキャラクター表示 */}
              <div className="flex justify-center items-center mb-4">
                {isPerfectScore ? (
                  <div className="flex gap-6">
                    <img src="/合格証を見せるひよこ.png" alt="合格" className="w-40 h-40 animate-bounce" />
                    <img src="/花丸を描くひよこ.png" alt="花丸" className="w-32 h-32 animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <img src="/ハンコ風の「よくがんばりました」.png" alt="よくがんばりました" className="w-32 h-32 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                ) : result.isCorrect ? (
                  <img src="/パチパチと拍手するひよこ.png" alt="拍手" className="w-40 h-40" />
                ) : (
                  <img src="/もやもやと悩むひよこ.png" alt="悩む" className="w-40 h-40" />
                )}
              </div>
              {isPerfectScore && (
                <div>
                  <div className="text-4xl font-black text-lime-600 mb-2">
                    ★ <ruby>満点<rt>まんてん</rt></ruby>おめでとう！ ★
                  </div>
                  <div className="text-xl text-gray-700">
                    すごい！パーフェクトだよ！
                  </div>
                </div>
              )}
            </div>

            <div className={`text-6xl font-black mb-6 ${
              isPerfectScore ? 'text-lime-600' : 'text-primary-700'
            }`}>
              {result.score}<ruby>点<rt>てん</rt></ruby>
            </div>

            {/* EXP獲得表示 */}
            {expData && result.isCorrect && (
              <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border-2 border-yellow-300">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <img src="/たまごの殻からコンニチハ！するひよこ.png" alt="EXP" className="w-16 h-16" />
                  <div className="text-left">
                    <div className="text-3xl font-black text-yellow-600 animate-count-up">
                      +{displayedExp} EXP
                    </div>
                    {expData.bonusExp > 0 && (
                      <div className="text-sm text-orange-600 font-bold">
                        ボーナス: +{expData.bonusExp} EXP
                      </div>
                    )}
                  </div>
                </div>

                {/* EXP Gauge */}
                <ExpGauge
                  currentExp={expData.currentLevelExp}
                  expToNextLevel={expData.expToNextLevel}
                  level={expData.newLevel}
                  animate={true}
                  showLabel={true}
                  size="large"
                />

                {expData.leveledUp && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-400">
                    <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                      <ruby>レベルアップ<rt>れべるあっぷ</rt></ruby>！ Lv.{expData.previousLevel} → Lv.{expData.newLevel}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isPerfectScore && (
              <div className="mb-6 p-4 bg-white rounded-xl shadow-lg border-2 border-lime-300">
                <div className="text-sm text-gray-600 mt-1">
                  <ruby>次<rt>つぎ</rt></ruby>の<ruby>問題<rt>もんだい</rt></ruby>にも<ruby>挑戦<rt>ちょうせん</rt></ruby>してみよう！
                </div>
              </div>
            )}

            <p className="text-lg text-gray-700 mb-6">
              <ruby>試行<rt>しこう</rt></ruby><ruby>回数<rt>かいすう</rt></ruby>: {result.attemptNumber}<ruby>回目<rt>かいめ</rt></ruby>
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => navigate(`/chapters/${problem.chapter_id}`)}
                className={`${
                  isPerfectScore
                    ? 'bg-lime-500 hover:bg-lime-600'
                    : 'bg-primary-600 hover:bg-primary-700'
                } text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg`}
              >
                チャプターに<ruby>戻<rt>もど</rt></ruby>る
              </button>

              {nextProblem && (
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    navigate(`/problems/${nextProblem.id}`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <ruby>次<rt>つぎ</rt></ruby>の<ruby>問題<rt>もんだい</rt></ruby>へ →
                </button>
              )}

              {!result.isCorrect && (
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setStartTime(Date.now()); // Reset timer for retry
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  もう<ruby>一度<rt>いちど</rt></ruby><ruby>挑戦<rt>ちょうせん</rt></ruby>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const problemImageSrc = getProblemTypeImage(problem.problem_type);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 問題タイプヘッダー */}
        <div className="mb-6 bg-white rounded-xl shadow-lg p-6 hover-lift">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <img
                src={problem.image_url || problemImageSrc}
                alt={getProblemTypeLabel(problem.problem_type)}
                className="w-24 h-24 object-contain"
              />
            </div>
            <div className="flex-1">
              <span className="text-lg text-blue-600 font-bold" dangerouslySetInnerHTML={{ __html: getProblemTypeLabel(problem.problem_type) }}>
              </span>
              <h1 className="text-4xl font-bold text-gray-800 mt-2" dangerouslySetInnerHTML={{ __html: problem.title }}></h1>
            </div>
          </div>
        </div>

        {/* 学ぼうセクション */}
        {problem.learning_objective && (
          <div className="bg-blue-50 rounded-xl shadow-lg p-8 mb-6 border-2 border-blue-200 hover-lift">
            <div className="flex items-start gap-4 mb-6">
              <img
                src="/指示棒を持つひよこ.png"
                alt="学習"
                className="w-20 h-20"
              />
              <h2 className="text-3xl font-bold text-blue-800"><ruby>学<rt>まな</rt></ruby>ぼう</h2>
            </div>
            <p className="text-gray-800 text-xl whitespace-pre-wrap leading-loose" dangerouslySetInnerHTML={{ __html: problem.learning_objective }}></p>
          </div>
        )}

        {/* 問題文カード */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-2 border-green-100 hover-lift">
          <div className="flex items-start gap-4 mb-6">
            <img
              src="/シンプルなQ＆A.png"
              alt="問題"
              className="w-20 h-20"
            />
            <h2 className="text-3xl font-bold text-green-800"><ruby>問題文<rt>もんだいぶん</rt></ruby></h2>
          </div>
          <p className="text-gray-800 text-xl whitespace-pre-wrap leading-loose" dangerouslySetInnerHTML={{ __html: problem.description }}></p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-8 mb-6">
          <h3 className="text-2xl font-bold text-blue-800 mb-5">📌 <ruby>解答<rt>かいとう</rt></ruby><ruby>方法<rt>ほうほう</rt></ruby></h3>
          {problem.problem_type === 'predict' ? (
            <ol className="list-decimal list-inside space-y-4 text-gray-800 text-lg leading-loose">
              <li>「Scratchエディタを<ruby>開<rt>ひら</rt></ruby>く」ボタンでプログラムを<ruby>確認<rt>かくにん</rt></ruby></li>
              <li>プログラムがどう<ruby>動<rt>うご</rt></ruby>くか<ruby>予測<rt>よそく</rt></ruby>します</li>
              <li>スプライトの<ruby>最終的<rt>さいしゅうてき</rt></ruby>なX<ruby>座標<rt>ざひょう</rt></ruby>とY<ruby>座標<rt>ざひょう</rt></ruby>を<ruby>計算<rt>けいさん</rt></ruby>します</li>
              <li><ruby>下<rt>した</rt></ruby>の<ruby>解答欄<rt>かいとうらん</rt></ruby>にX<ruby>座標<rt>ざひょう</rt></ruby>とY<ruby>座標<rt>ざひょう</rt></ruby>を<ruby>入力<rt>にゅうりょく</rt></ruby>して<ruby>提出<rt>ていしゅつ</rt></ruby></li>
            </ol>
          ) : (
            <ol className="list-decimal list-inside space-y-4 text-gray-800 text-lg leading-loose">
              <li>「Scratchエディタを<ruby>開<rt>ひら</rt></ruby>く」ボタンでScratchを<ruby>起動<rt>きどう</rt></ruby></li>
              <li><ruby>問題<rt>もんだい</rt></ruby>に<ruby>従<rt>したが</rt></ruby>ってプログラムを<ruby>作成<rt>さくせい</rt></ruby>します</li>
              <li><ruby>完成<rt>かんせい</rt></ruby>したら「ファイル」→「コンピューターに<ruby>保存<rt>ほぞん</rt></ruby>する」で.sb3ファイルをダウンロード</li>
              <li>ダウンロードした.sb3ファイルをこのページにアップロードして<ruby>提出<rt>ていしゅつ</rt></ruby></li>
            </ol>
          )}
          <div className="mt-4">
            <button
              onClick={handleOpenScratch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Scratchエディタを<ruby>開<rt>ひら</rt></ruby>く
            </button>
          </div>
        </div>

        {/* ヒントセクション */}
        {hints.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-8 mb-6 hover-lift">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <img
                  src="/指示棒を持つひよこ.png"
                  alt="ヒント"
                  className="w-20 h-20"
                />
                <h3 className="text-2xl font-bold text-yellow-800">💡 ヒント</h3>
              </div>
              <button
                onClick={handleToggleHints}
                className={`${
                  showHints
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2`}
              >
                {showHints ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <ruby>閉<rt>と</rt></ruby>じる
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    ヒントを<ruby>見<rt>み</rt></ruby>る
                  </>
                )}
              </button>
            </div>

            {showHints && (
              <div className="space-y-4 animate-fadeIn">
                {hints.map((hint, index) => (
                  <div
                    key={hint.id}
                    className="bg-white rounded-lg p-6 shadow-md border-l-4 border-yellow-500"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <p
                        className="text-gray-800 text-lg leading-loose flex-1"
                        dangerouslySetInnerHTML={{ __html: hint.hint_text }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showHints && (
              <p className="text-gray-700 text-center text-sm mt-2">
                <ruby>困<rt>こま</rt></ruby>ったときはヒントを<ruby>見<rt>み</rt></ruby>てみよう！
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4"><ruby>解答<rt>かいとう</rt></ruby>を<ruby>提出<rt>ていしゅつ</rt></ruby></h3>

          {problem.problem_type === 'predict' ? (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-4">
                スプライトの<ruby>最終<rt>さいしゅう</rt></ruby><ruby>位置<rt>いち</rt></ruby>を<ruby>入力<rt>にゅうりょく</rt></ruby>してください
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">X<ruby>座標<rt>ざひょう</rt></ruby></label>
                  <input
                    type="number"
                    value={answerX}
                    onChange={(e) => setAnswerX(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="例: 30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Y<ruby>座標<rt>ざひょう</rt></ruby></label>
                  <input
                    type="number"
                    value={answerY}
                    onChange={(e) => setAnswerY(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="例: 0"
                    required
                  />
                </div>
              </div>
              {answerX !== '' && answerY !== '' && (
                <p className="mt-3 text-sm text-green-600">
                  ✓ X<ruby>座標<rt>ざひょう</rt></ruby>: {answerX}, Y<ruby>座標<rt>ざひょう</rt></ruby>: {answerY}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                SB3ファイルをアップロード
              </label>
              <input
                type="file"
                accept=".sb3"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              {file && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {file.name} を<ruby>選択<rt>せんたく</rt></ruby>しました
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              (problem.problem_type === 'predict' ? (answerX === '' || answerY === '') : !file)
            }
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-lg font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
            dangerouslySetInnerHTML={{ __html: submitting ? '<ruby>提出<rt>ていしゅつ</rt></ruby><ruby>中<rt>ちゅう</rt></ruby>...' : '<ruby>提出<rt>ていしゅつ</rt></ruby>する' }}
          >
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProblemDetail;
