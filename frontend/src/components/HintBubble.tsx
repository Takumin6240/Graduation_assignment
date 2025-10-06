import React, { useState } from 'react';
import { Hint } from '../types';

interface HintBubbleProps {
  hints: Hint[];
  onHintView: () => void;
}

const HintBubble: React.FC<HintBubbleProps> = ({ hints, onHintView }) => {
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const handleShowHint = () => {
    if (!showHint) {
      onHintView();
    }
    setShowHint(true);
  };

  const handleNextHint = () => {
    if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    }
  };

  if (hints.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 relative">
      <div className="absolute -top-4 left-6">
        <div className="bg-yellow-300 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
          💡 ヒント
        </div>
      </div>

      {!showHint ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">困ったときはヒントを見てみよう！</p>
          <button
            onClick={handleShowHint}
            className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-6 py-3 rounded-lg font-bold transition"
          >
            ヒントを見る
          </button>
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <p className="text-gray-800 text-lg">{hints[currentHintIndex].hint_text}</p>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              ヒント {currentHintIndex + 1} / {hints.length}
            </span>

            {currentHintIndex < hints.length - 1 && (
              <button
                onClick={handleNextHint}
                className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg font-medium transition"
              >
                次のヒント →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HintBubble;
