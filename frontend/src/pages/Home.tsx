import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          {/* メインイラスト表示エリア */}
          <div className="mb-8 flex justify-center">
            <div className="relative animate-float">
              {/* Scratchプログラミング学習のイラスト */}
              <img
                src="/キラキラした目で期待をするひよこ.png"
                alt="プログラミングを学ぶ子供たち"
                className="w-96 h-auto drop-shadow-2xl"
              />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-blue-700 mb-4">
            Scratchでプログラミングについて<ruby>学<rt>まな</rt></ruby>ぼう!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            <ruby>小学生<rt>しょうがくせい</rt></ruby>のためのプログラミング<ruby>学習<rt>がくしゅう</rt></ruby>システム
          </p>
        </div>

        {isAuthenticated && user ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 hover-lift">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <img
                    src="/いいね！ポーズをするひよこ.png"
                    alt="学習する生徒"
                    className="w-32 h-32"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    おかえり、{user.nickname}さん！
                  </h2>
                  <div className="flex gap-4 items-center mb-6">
                    <div className="bg-blue-100 px-4 py-2 rounded-full animate-bounce-gentle">
                      <span className="text-blue-700 font-bold">レベル {user.level}</span>
                    </div>
                    <div className="bg-yellow-100 px-4 py-2 rounded-full">
                      <span className="text-yellow-700 font-bold"><ruby>経験値<rt>けいけんち</rt></ruby> {user.exp}</span>
                    </div>
                  </div>
                  <Link
                    to="/chapters"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <ruby>学習<rt>がくしゅう</rt></ruby>を<ruby>始<rt>はじ</rt></ruby>める
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center hover-lift">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                <ruby>楽<rt>たの</rt></ruby>しく<ruby>学習<rt>がくしゅう</rt></ruby>！
              </h2>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  ログイン
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
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
