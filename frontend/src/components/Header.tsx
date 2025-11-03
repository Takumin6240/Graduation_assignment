import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PointsGauge from './ExpGauge';

const Header: React.FC = () => {
  const { user, admin, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Calculate points progress for current rank
  const currentRankPoints = user ? user.points % (user.rank * 100) : 0;
  const pointsToNextRank = user ? user.rank * 100 - currentRankPoints : 100;

  return (
    <header className="bg-primary-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold hover:text-primary-100 transition">
            Scratchでプログラミングについて学ぼう!
          </Link>

          <nav className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {!isAdmin && (
                  <>
                    <Link to="/chapters" className="hover:text-primary-100 transition">
                      <ruby>問題<rt>もんだい</rt></ruby>をとく
                    </Link>
                    <Link to="/progress" className="hover:text-primary-100 transition">
                      <ruby>自分<rt>じぶん</rt></ruby>の<ruby>記録<rt>きろく</rt></ruby>
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
                  {user ? (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold">{user.nickname}</div>
                        <div className="text-xs text-primary-100">Rank {user.rank}</div>
                      </div>
                      <div className="w-48">
                        <PointsGauge
                          currentPoints={currentRankPoints}
                          pointsToNextRank={pointsToNextRank}
                          rank={user.rank}
                          animate={false}
                          showLabel={false}
                          size="small"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm">{admin?.username}</span>
                  )}
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
                <Link
                  to="/login"
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition"
                >
                  ログイン
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
