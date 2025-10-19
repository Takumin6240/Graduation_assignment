import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-primary-700 mb-4">
            Scratchでプログラミングについて学ぼう!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            小学生のためのプログラミング学習システム
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
                  <span className="text-yellow-700 font-bold">経験値 {user.exp}</span>
                </div>
              </div>
              <Link
                to="/chapters"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition"
              >
                学習を始める →
              </Link>
            </div>

          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                楽しく学習！
              </h2>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/login"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition"
                >
                  ログイン
                </Link>
              </div>
              <p className="mt-6 text-gray-600 text-sm">
                ログインIDとパスワードは先生から受け取ってください
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
