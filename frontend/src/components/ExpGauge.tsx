import React, { useEffect, useState } from 'react';

interface ExpGaugeProps {
  currentExp: number;
  expToNextLevel: number;
  level: number;
  animate?: boolean;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ExpGauge: React.FC<ExpGaugeProps> = ({
  currentExp,
  expToNextLevel,
  level,
  animate = true,
  showLabel = true,
  size = 'medium'
}) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const totalExpForLevel = level * 100;
  const progressPercentage = (currentExp / totalExpForLevel) * 100;

  useEffect(() => {
    if (animate) {
      // Delay animation slightly for better visual effect
      const timer = setTimeout(() => {
        setAnimatedWidth(progressPercentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedWidth(progressPercentage);
    }
  }, [progressPercentage, animate]);

  const sizeClasses = {
    small: 'h-2',
    medium: 'h-4',
    large: 'h-6'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className={`flex justify-between mb-1 ${textSizeClasses[size]}`}>
          <span className="font-bold text-gray-700">
            <ruby>レベル<rt>れべる</rt></ruby> {level}
          </span>
          <span className="text-gray-600">
            {currentExp} / {totalExpForLevel} EXP
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]} shadow-inner`}>
        <div
          className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 rounded-full transition-all duration-1000 ease-out relative"
          style={{ width: `${animatedWidth}%` }}
        >
          {/* Shiny animation overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
        </div>
      </div>
      {showLabel && (
        <div className={`text-right mt-1 ${textSizeClasses[size]} text-gray-500`}>
          <ruby>次<rt>つぎ</rt></ruby>のレベルまで <span className="font-bold text-primary-600">{expToNextLevel}</span> EXP
        </div>
      )}
    </div>
  );
};

export default ExpGauge;
