import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-sm">
            © 2025 Scratch学習支援システム - 大学卒業研究プロジェクト
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Powered by Scratch | TUT Takeda Lab
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
