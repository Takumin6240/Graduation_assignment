import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { problemsAPI } from '../services/api';
import { Chapter } from '../types';
import Loading from '../components/Loading';

const Chapters: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await problemsAPI.getChapters();
        setChapters(response.data.chapters);
      } catch (error) {
        console.error('Failed to fetch chapters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-6">
          <img
            src="/パソコンを開いてメガネをカチャカチャするエリート風ひよこ.png"
            alt="プログラミング学習"
            className="w-80 h-auto animate-float"
          />
        </div>
        <h1 className="text-4xl font-bold text-blue-700 mb-4"><ruby>学習<rt>がくしゅう</rt></ruby>チャプター</h1>
        <p className="text-gray-600 text-lg"><ruby>好<rt>す</rt></ruby>きなチャプターを<ruby>選<rt>えら</rt></ruby>んで<ruby>始<rt>はじ</rt></ruby>めよう！</p>
      </div>

      <div className="grid gap-6 max-w-4xl mx-auto">
        {chapters.map((chapter, index) => (
          <Link
            key={chapter.id}
            to={`/chapters/${chapter.id}`}
            className="bg-white rounded-xl shadow-lg p-8 card-hover border-2 border-transparent hover:border-blue-300"
          >
            <div className="flex items-start gap-6">
              {/* チャプターのイラスト */}
              <div className="flex-shrink-0">
                <img
                  src={chapter.image_url || '/指示棒を持つひよこ.png'}
                  alt={`チャプター${index + 1}`}
                  className="w-32 h-32 object-contain"
                />
              </div>

              <div className="flex-1">
                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full inline-block mb-3 text-sm font-bold">
                  Chapter {chapter.order_number}
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3" dangerouslySetInnerHTML={{ __html: chapter.title }}></h2>
                <p className="text-gray-600 text-lg mb-4" dangerouslySetInnerHTML={{ __html: chapter.description }}></p>

                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold inline-flex items-center gap-2 hover:bg-blue-700 transition-all">
                    <ruby>問題<rt>もんだい</rt></ruby>を<ruby>解<rt>と</rt></ruby>く
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Chapters;
