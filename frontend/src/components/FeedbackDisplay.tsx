import React from 'react';

interface FeedbackDetail {
  type: 'success' | 'warning' | 'error';
  icon: string;
  message: string;
}

interface FeedbackData {
  summary: string;
  details: FeedbackDetail[];
  hints: string[];
}

interface FeedbackDisplayProps {
  feedback: FeedbackData | null;
  score: number;
  isCorrect: boolean;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback, score, isCorrect }) => {
  if (!feedback) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 border-l-4 border-blue-500">
      {/* スコアとサマリー */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-2xl font-bold text-gray-800">
            {isCorrect ? (
              <span className="text-green-600">✓ 正解です！</span>
            ) : (
              <span className="text-orange-600">もう一度チャレンジ</span>
            )}
          </h3>
          <div className="text-3xl font-bold">
            <span className={`${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
              {score}点
            </span>
          </div>
        </div>

        <p className="text-lg text-gray-700 mb-4">{feedback.summary}</p>

        {/* プログレスバー */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* 詳細フィードバック */}
      {feedback.details && feedback.details.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">📋</span>
            詳細
          </h4>
          <div className="space-y-2">
            {feedback.details.map((detail, index) => (
              <div
                key={index}
                className={`flex items-start p-3 rounded-lg ${
                  detail.type === 'success'
                    ? 'bg-green-50 border-l-4 border-green-500'
                    : detail.type === 'warning'
                    ? 'bg-yellow-50 border-l-4 border-yellow-500'
                    : 'bg-red-50 border-l-4 border-red-500'
                }`}
              >
                <span
                  className={`text-xl mr-3 flex-shrink-0 ${
                    detail.type === 'success'
                      ? 'text-green-600'
                      : detail.type === 'warning'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {detail.icon}
                </span>
                <p
                  className={`text-base ${
                    detail.type === 'success'
                      ? 'text-green-800'
                      : detail.type === 'warning'
                      ? 'text-yellow-800'
                      : 'text-red-800'
                  }`}
                >
                  {detail.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ヒント */}
      {feedback.hints && feedback.hints.length > 0 && !isCorrect && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <span className="mr-2">💡</span>
            ヒント
          </h4>
          <ul className="space-y-2">
            {feedback.hints.map((hint, index) => (
              <li key={index} className="flex items-start text-blue-800">
                <span className="mr-2 mt-1 flex-shrink-0">•</span>
                <span className="text-base">{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 成功時のメッセージ */}
      {isCorrect && score === 100 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-400 rounded-lg p-4 mt-4">
          <div className="flex items-center justify-center">
            <span className="text-4xl mr-3">🎉</span>
            <p className="text-lg font-semibold text-green-800">
              完璧です！次の問題にチャレンジしましょう！
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;
