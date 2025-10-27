import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import Loading from '../components/Loading';

interface Problem {
  id: number;
  chapter_id: number;
  problem_type: string;
  title: string;
  description: string;
  max_score: number;
  difficulty_level: number;
  order_number: number;
  scratch_editor_url: string;
  correct_answer_x: number | null;
  correct_answer_y: number | null;
  chapter_title: string;
  created_at: string;
  updated_at: string;
}

interface GroupedProblems {
  chapterId: number;
  chapterTitle: string;
  problems: Problem[];
}

const AdminProblems: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  // Modal states
  const [modalType, setModalType] = useState<'url' | 'answer' | 'upload' | null>(null);
  const [selectedProblemForModal, setSelectedProblemForModal] = useState<Problem | null>(null);

  // Form inputs
  const [urlInput, setUrlInput] = useState<string>('');
  const [answerXInput, setAnswerXInput] = useState<string>('');
  const [answerYInput, setAnswerYInput] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const response = await adminAPI.getAllProblems();
      setProblems(response.data.problems);
    } catch (error: any) {
      console.error('Failed to fetch problems:', error);
      setError('問題一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to strip HTML tags for plain text display
  const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Group problems by chapter
  const groupedProblems: GroupedProblems[] = problems.reduce((acc: GroupedProblems[], problem) => {
    let chapter = acc.find(c => c.chapterId === problem.chapter_id);
    if (!chapter) {
      chapter = {
        chapterId: problem.chapter_id,
        chapterTitle: problem.chapter_title,
        problems: []
      };
      acc.push(chapter);
    }
    chapter.problems.push(problem);
    return acc;
  }, []);

  // Sort chapters by ID and problems by order_number
  groupedProblems.sort((a, b) => a.chapterId - b.chapterId);
  groupedProblems.forEach(chapter => {
    chapter.problems.sort((a, b) => a.order_number - b.order_number);
  });

  const openModal = (type: 'url' | 'answer' | 'upload', problem: Problem) => {
    setModalType(type);
    setSelectedProblemForModal(problem);

    if (type === 'url') {
      setUrlInput(problem.scratch_editor_url || 'https://scratch.mit.edu/');
    } else if (type === 'answer') {
      setAnswerXInput(problem.correct_answer_x != null ? String(problem.correct_answer_x) : '0');
      setAnswerYInput(problem.correct_answer_y != null ? String(problem.correct_answer_y) : '0');
    } else if (type === 'upload') {
      setUploadFile(null);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedProblemForModal(null);
    setUrlInput('');
    setAnswerXInput('');
    setAnswerYInput('');
    setUploadFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedProblemForModal || !uploadFile) {
      alert('SB3ファイルを選択してください');
      return;
    }

    setUploading(true);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('sb3File', uploadFile);

      const response = await adminAPI.uploadCorrectSB3(selectedProblemForModal.id, formData);
      setUploadSuccess(response.data.message);
      await fetchProblems();
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.error || 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const getProblemTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; color: string; icon: string }> = {
      fill_blank: { label: '穴埋め問題', color: 'bg-blue-100 text-blue-800', icon: '📝' },
      predict: { label: '予測問題', color: 'bg-purple-100 text-purple-800', icon: '🔮' },
      find_error: { label: 'バグ発見', color: 'bg-red-100 text-red-800', icon: '🐛' },
      mission: { label: 'ミッション', color: 'bg-green-100 text-green-800', icon: '🚀' },
    };
    return labels[type] || { label: type, color: 'bg-gray-100 text-gray-800', icon: '❓' };
  };

  const getDifficultyStars = (level: number) => {
    return '⭐'.repeat(level);
  };

  const handleUrlUpdate = async () => {
    if (!selectedProblemForModal) return;

    try {
      const response = await adminAPI.updateScratchEditorUrl(selectedProblemForModal.id, urlInput);
      setUploadSuccess(response.data.message);
      await fetchProblems();
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.error || 'URL の更新に失敗しました');
    }
  };

  const handleAnswerUpdate = async () => {
    if (!selectedProblemForModal) return;

    const x = parseInt(answerXInput);
    const y = parseInt(answerYInput);

    if (isNaN(x) || isNaN(y)) {
      alert('X座標とY座標は数値で入力してください');
      return;
    }

    try {
      const response = await adminAPI.updateCorrectAnswer(selectedProblemForModal.id, x, y);
      setUploadSuccess(response.data.message);
      await fetchProblems();
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.error || '正解座標の更新に失敗しました');
    }
  };

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

  // Filter problems by selected chapter
  const displayedGroups = selectedChapter
    ? groupedProblems.filter(g => g.chapterId === selectedChapter)
    : groupedProblems;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary-700 mb-4">問題管理</h1>
        <p className="text-gray-600">各問題の正解ファイル、Scratch URL、正解座標を管理できます</p>
      </div>

      {uploadSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {uploadSuccess}
        </div>
      )}

      {/* Chapter Filter */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <span className="font-medium text-gray-700">チャプター絞り込み:</span>
        <button
          onClick={() => setSelectedChapter(null)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            selectedChapter === null
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          全て
        </button>
        {groupedProblems.map(group => (
          <button
            key={group.chapterId}
            onClick={() => setSelectedChapter(group.chapterId)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedChapter === group.chapterId
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Chapter {group.chapterId}
          </button>
        ))}
      </div>

      {/* Modal Overlay */}
      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            {modalType === 'url' && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Scratch URL 編集</h2>
                <p className="text-sm text-gray-600 mb-4">問題: {stripHtmlTags(selectedProblemForModal?.title || '')}</p>
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Scratch エディタ URL</label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://scratch.mit.edu/projects/..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleUrlUpdate}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition"
                  >
                    保存
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-bold transition"
                  >
                    キャンセル
                  </button>
                </div>
              </>
            )}

            {modalType === 'answer' && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">正解座標編集</h2>
                <p className="text-sm text-gray-600 mb-4">問題: {stripHtmlTags(selectedProblemForModal?.title || '')}</p>
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">X座標</label>
                      <input
                        type="number"
                        value={answerXInput}
                        onChange={(e) => setAnswerXInput(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Y座標</label>
                      <input
                        type="number"
                        value={answerYInput}
                        onChange={(e) => setAnswerYInput(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAnswerUpdate}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition"
                  >
                    保存
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-bold transition"
                  >
                    キャンセル
                  </button>
                </div>
              </>
            )}

            {modalType === 'upload' && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">正解ファイル更新</h2>
                <p className="text-sm text-gray-600 mb-4">問題: {stripHtmlTags(selectedProblemForModal?.title || '')}</p>
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">SB3ファイルを選択</label>
                  <input
                    type="file"
                    accept=".sb3"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {uploadFile && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ {uploadFile.name} を選択しました
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={!uploadFile || uploading}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50"
                  >
                    {uploading ? 'アップロード中...' : 'アップロード'}
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-bold transition"
                  >
                    キャンセル
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Problems by Chapter */}
      <div className="space-y-8">
        {displayedGroups.map(group => (
          <div key={group.chapterId} className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
            {/* Chapter Header */}
            <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white px-6 py-4">
              <h2 className="text-2xl font-bold" dangerouslySetInnerHTML={{ __html: group.chapterTitle }}></h2>
            </div>

            {/* Problems Grid */}
            <div className="p-6 space-y-4">
              {group.problems.map(problem => {
                const typeInfo = getProblemTypeLabel(problem.problem_type);
                return (
                  <div key={problem.id} className="border-2 border-gray-200 rounded-lg p-5 hover:border-primary-300 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      {/* Problem Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
                            問題 #{problem.order_number}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${typeInfo.color}`}>
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                          <span className="text-yellow-500 text-lg" title={`難易度レベル ${problem.difficulty_level}`}>
                            {getDifficultyStars(problem.difficulty_level)}
                          </span>
                        </div>
                        <h3
                          className="text-xl font-bold text-gray-800 mb-2"
                          dangerouslySetInnerHTML={{ __html: problem.title }}
                        ></h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>ID: {problem.id} | 最大スコア: {problem.max_score}点</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => openModal('upload', problem)}
                          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
                        >
                          📁 正解ファイル更新
                        </button>
                        <button
                          onClick={() => openModal('url', problem)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
                        >
                          🔗 URL編集
                        </button>
                        {problem.problem_type === 'predict' && (
                          <button
                            onClick={() => openModal('answer', problem)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
                          >
                            🎯 正解座標編集
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="font-medium text-gray-700">Scratch URL:</span>
                          <p className="text-gray-600 truncate mt-1" title={problem.scratch_editor_url}>
                            {problem.scratch_editor_url || 'https://scratch.mit.edu/'}
                          </p>
                        </div>
                        {problem.problem_type === 'predict' && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <span className="font-medium text-gray-700">正解座標:</span>
                            <p className="text-gray-600 mt-1">
                              X: {problem.correct_answer_x ?? '-'}, Y: {problem.correct_answer_y ?? '-'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          使い方
        </h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">📁</span>
            <span><strong>正解ファイル更新:</strong> Scratchで作成した正解プログラムの.sb3ファイルをアップロード（穴埋め、バグ発見、ミッション問題用）</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">🔗</span>
            <span><strong>URL編集:</strong> 生徒が問題を解く際に使用するScratchプロジェクトのURLを設定</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">🎯</span>
            <span><strong>正解座標編集:</strong> 予測問題の正解となるスプライトの座標（X, Y）を設定</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminProblems;
