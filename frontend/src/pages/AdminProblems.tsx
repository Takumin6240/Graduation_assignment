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

const AdminProblems: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Modal states
  const [modalType, setModalType] = useState<'url' | 'answer' | 'upload' | null>(null);
  const [selectedProblemForModal, setSelectedProblemForModal] = useState<Problem | null>(null);

  // Form inputs
  const [urlInput, setUrlInput] = useState<string>('');
  const [answerXInput, setAnswerXInput] = useState<string>('');
  const [answerYInput, setAnswerYInput] = useState<string>('');

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
    const labels: Record<string, string> = {
      fill_blank: '📝 穴埋め問題',
      predict: '🔮 予測問題',
      find_error: '🐛 バグ発見問題',
      mission: '🚀 ミッション問題',
    };
    return labels[type] || type;
  };

  const getDifficultyLabel = (level: number) => {
    const stars = '⭐'.repeat(level);
    return `${stars} (レベル${level})`;
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-primary-700 mb-8">問題管理</h1>

      {uploadSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          ✓ {uploadSuccess}
        </div>
      )}

      {/* Modal Overlay */}
      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {modalType === 'url' && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Scratch URL 編集</h2>
                <p className="text-sm text-gray-600 mb-4">問題: {selectedProblemForModal?.title}</p>
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
                <p className="text-sm text-gray-600 mb-4">問題: {selectedProblemForModal?.title}</p>
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
                <p className="text-sm text-gray-600 mb-4">問題: {selectedProblemForModal?.title}</p>
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

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  チャプター
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: '300px'}}>
                  問題タイトル
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  種類
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  難易度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  順序
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scratch URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  正解座標 (予測問題)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  正解SB3アップロード
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {problem.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {problem.chapter_title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{problem.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getProblemTypeLabel(problem.problem_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getDifficultyLabel(problem.difficulty_level)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {problem.order_number}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-gray-600 truncate max-w-xs" title={problem.scratch_editor_url}>
                        {problem.scratch_editor_url || 'https://scratch.mit.edu/'}
                      </div>
                      <button
                        onClick={() => openModal('url', problem)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium w-fit"
                      >
                        URL編集
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {problem.problem_type === 'predict' ? (
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-gray-600">
                          X: {problem.correct_answer_x ?? '-'}, Y: {problem.correct_answer_y ?? '-'}
                        </div>
                        <button
                          onClick={() => openModal('answer', problem)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium w-fit"
                        >
                          正解座標編集
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">予測問題のみ</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openModal('upload', problem)}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      正解ファイル更新
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-800 mb-3">📌 使い方</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>各問題の「正解ファイル更新」ボタンをクリック</li>
          <li>Scratchで作成した正解プログラムの.sb3ファイルを選択</li>
          <li>「アップロード」ボタンをクリックして正解データを更新</li>
          <li>アップロードされたSB3ファイルの内容がデータベースに保存され、採点に使用されます</li>
        </ol>
      </div>
    </div>
  );
};

export default AdminProblems;
