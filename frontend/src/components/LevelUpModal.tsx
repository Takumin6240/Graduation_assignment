import React, { useEffect, useState } from 'react';

interface RankUpModalProps {
  isOpen: boolean;
  previousRank: number;
  newRank: number;
  onClose: () => void;
}

const RankUpModal: React.FC<RankUpModalProps> = ({
  isOpen,
  previousRank,
  newRank,
  onClose
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Generate confetti particles
  const confettiColors = ['#FCD34D', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#3B82F6', '#10B981'];
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 0.5}s`,
    animationDuration: `${2 + Math.random() * 2}s`
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confettiParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-3 h-3 animate-confetti-fall"
              style={{
                backgroundColor: particle.color,
                left: particle.left,
                top: '-20px',
                animationDelay: particle.animationDelay,
                animationDuration: particle.animationDuration,
                borderRadius: Math.random() > 0.5 ? '50%' : '0'
              }}
            />
          ))}
        </div>
      )}

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-12 max-w-xl mx-4 text-center transform animate-scale-in">
        {/* Sparkles */}
        <div className="absolute -top-6 -left-6 text-6xl animate-spin-slow">✨</div>
        <div className="absolute -top-6 -right-6 text-6xl animate-spin-slow" style={{ animationDelay: '0.5s' }}>✨</div>

        {/* Character */}
        <div className="mb-6 flex justify-center">
          <img
            src="/合格証を見せるひよこ.png"
            alt="ランクアップ"
            className="w-40 h-40 animate-bounce"
          />
        </div>

        {/* Title */}
        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 mb-4 animate-pulse">
          ランクアップ！
        </h2>

        {/* Rank Display */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-4xl font-bold text-gray-700">
            Rank {previousRank}
          </div>
          <div className="text-5xl text-yellow-500 animate-pulse">→</div>
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-scale-in">
            Rank {newRank}
          </div>
        </div>

        {/* Message */}
        <p className="text-xl text-gray-700 font-bold">
          おめでとう！ランクが<ruby>上<rt>あ</rt></ruby>がったよ！
        </p>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-3 px-8 rounded-full transform transition-all duration-200 hover:scale-110 shadow-lg"
        >
          やったー！
        </button>
      </div>
    </div>
  );
};

export default RankUpModal;
