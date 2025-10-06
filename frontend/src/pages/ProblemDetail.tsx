import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { problemsAPI, submissionsAPI } from '../services/api';
import { Problem } from '../types';
import Loading from '../components/Loading';

const ProblemDetail: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [answerX, setAnswerX] = useState<string>('');
  const [answerY, setAnswerY] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Reset start time when problem changes
        setStartTime(Date.now());

        const problemRes = await problemsAPI.getProblemDetails(Number(problemId));
        setProblem(problemRes.data.problem);

        // Fetch all problems in the same chapter to find next problem
        if (problemRes.data.problem.chapter_id) {
          const problemsRes = await problemsAPI.getProblemsByChapter(problemRes.data.problem.chapter_id);
          setAllProblems(problemsRes.data.problems || []);
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

      formData.append('hintUsageCount', '0');
      formData.append('timeSpent', String(Math.floor((Date.now() - startTime) / 1000)));

      const response = await submissionsAPI.submitSolution(Number(problemId), formData);
      setResult(response.data);
    } catch (error: any) {
      alert(error.response?.data?.error || '提出に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const getProblemTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fill_blank: '📝 穴埋め問題',
      predict: '🔮 予測問題',
      find_error: '🐛 バグ発見問題',
      mission: '🚀 ミッション問題',
    };
    return labels[type] || type;
  };

  const handleOpenScratch = () => {
    const url = problem?.scratch_editor_url || 'https://scratch.mit.edu/';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <Loading />;
  if (!problem) return <div>問題が見つかりません</div>;

  if (result) {
    const isPerfectScore = result.score === 100;

    // Find next problem
    const currentIndex = allProblems.findIndex(p => p.id === Number(problemId));
    const nextProblem = currentIndex >= 0 && currentIndex < allProblems.length - 1
      ? allProblems[currentIndex + 1]
      : null;

    return (
      <div className="container mx-auto px-4 py-8">
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
            {isPerfectScore && (
              <div className="mb-4">
                <div className="text-4xl font-black text-lime-600 mb-2">
                  ★ 満点おめでとう！ ★
                </div>
                <div className="text-xl text-gray-700">
                  すごい！パーフェクトだよ！
                </div>
              </div>
            )}

            <h2 className="text-3xl font-bold mb-4 text-gray-800">{result.message}</h2>

            <div className={`text-6xl font-black mb-6 ${
              isPerfectScore ? 'text-lime-600' : 'text-primary-700'
            }`}>
              {result.score}点
            </div>

            {isPerfectScore && (
              <div className="mb-6 p-4 bg-white rounded-xl shadow-lg border-2 border-lime-300">
                <div className="text-sm text-gray-600 mt-1">
                  次の問題にも挑戦してみよう！
                </div>
              </div>
            )}

            <p className="text-lg text-gray-700 mb-6">
              試行回数: {result.attemptNumber}回目
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => navigate(`/chapters/${problem.chapter_id}`)}
                className={`${
                  isPerfectScore
                    ? 'bg-lime-500 hover:bg-lime-600'
                    : 'bg-primary-600 hover:bg-primary-700'
                } text-white px-8 py-3 rounded-lg font-bold transition shadow-lg`}
              >
                チャプターに戻る
              </button>

              {nextProblem && (
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    navigate(`/problems/${nextProblem.id}`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition shadow-lg"
                >
                  次の問題へ →
                </button>
              )}

              {!result.isCorrect && (
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setStartTime(Date.now()); // Reset timer for retry
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold transition shadow-lg"
                >
                  もう一度挑戦
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <span className="text-sm text-primary-600 font-medium">
            {getProblemTypeLabel(problem.problem_type)}
          </span>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">{problem.title}</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">問題説明</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{problem.description}</p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-blue-800 mb-3">📌 解答方法</h3>
          {problem.problem_type === 'predict' ? (
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>「Scratchエディタを開く」ボタンでプログラムを確認</li>
              <li>プログラムがどう動くか予測します</li>
              <li>スプライトの最終的なX座標とY座標を計算します</li>
              <li>下の解答欄にX座標とY座標を入力して提出</li>
            </ol>
          ) : (
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>「Scratchエディタを開く」ボタンでScratchを起動</li>
              <li>問題に従ってプログラムを作成します</li>
              <li>完成したら「ファイル」→「コンピューターに保存する」で.sb3ファイルをダウンロード</li>
              <li>ダウンロードした.sb3ファイルをこのページにアップロードして提出</li>
            </ol>
          )}
          <div className="mt-4">
            <button
              onClick={handleOpenScratch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Scratchエディタを開く
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">解答を提出</h3>

          {problem.problem_type === 'predict' ? (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-4">
                スプライトの最終位置を入力してください
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">X座標</label>
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
                  <label className="block text-sm text-gray-600 mb-2">Y座標</label>
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
                  ✓ X座標: {answerX}, Y座標: {answerY}
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
                  ✓ {file.name} を選択しました
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
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-lg font-bold text-lg transition disabled:opacity-50"
          >
            {submitting ? '提出中...' : '提出する'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProblemDetail;
