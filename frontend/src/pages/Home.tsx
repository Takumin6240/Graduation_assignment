import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          {/* シンプルなイラスト表示エリア */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              {/* プログラミングを表現するシンプルなイラスト（絵文字） */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className="text-8xl">💻</span>
                <span className="text-8xl">🐱</span>
                <span className="text-8xl">✨</span>
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-bold text-primary-700 mb-4">
            Scratchでプログラミングについて<ruby>学<rt>まな</rt></ruby>ぼう!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            <ruby>小学生<rt>しょうがくせい</rt></ruby>のためのプログラミング<ruby>学習<rt>がくしゅう</rt></ruby>システム
          </p>
        </div>

        {isAuthenticated && user ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                おかえり、{user.nickname}さん！
              </h2>
              <div className="flex gap-4 items-center mb-6">
                <div className="bg-primary-100 px-4 py-2 rounded-full">
                  <span className="text-primary-700 font-bold">レベル {user.level}</span>
                </div>
                <div className="bg-yellow-100 px-4 py-2 rounded-full">
                  <span className="text-yellow-700 font-bold"><ruby>経験値<rt>けいけんち</rt></ruby> {user.exp}</span>
                </div>
              </div>
              <Link
                to="/chapters"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <ruby>学習<rt>がくしゅう</rt></ruby>を<ruby>始<rt>はじ</rt></ruby>める →
              </Link>
            </div>

          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                <ruby>楽<rt>たの</rt></ruby>しく<ruby>学習<rt>がくしゅう</rt></ruby>！
              </h2>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/login"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  ログイン
                </Link>
              </div>
              <p className="mt-6 text-gray-600 text-sm">
                ログインIDとパスワードは<ruby>先生<rt>せんせい</rt></ruby>から<ruby>受<rt>う</rt></ruby>け<ruby>取<rt>と</rt></ruby>ってください
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
