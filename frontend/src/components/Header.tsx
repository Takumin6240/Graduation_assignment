import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, admin, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-primary-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold hover:text-primary-100 transition">
            Scratchで学ぼう！
          </Link>

          <nav className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {!isAdmin && (
                  <>
                    <Link to="/chapters" className="hover:text-primary-100 transition">
                      学習する
                    </Link>
                    <Link to="/progress" className="hover:text-primary-100 transition">
                      進捗
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <>
                    <Link to="/admin/dashboard" className="hover:text-primary-100 transition">
                      ダッシュボード
                    </Link>
                    <Link to="/admin/users" className="hover:text-primary-100 transition">
                      ユーザー管理
                    </Link>
                    <Link to="/admin/problems" className="hover:text-primary-100 transition">
                      問題管理
                    </Link>
                    <Link to="/admin/analytics" className="hover:text-primary-100 transition">
                      分析
                    </Link>
                  </>
                )}

                <div className="flex items-center gap-4">
                  <span className="text-sm">
                    {user ? `${user.nickname} (Lv.${user.level})` : admin?.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition"
                  >
                    ログアウト
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-primary-100 transition">
                  ログイン
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition"
                >
                  新規登録
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
