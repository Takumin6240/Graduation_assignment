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
      <h1 className="text-4xl font-bold text-primary-700 mb-8"><ruby>学習<rt>がくしゅう</rt></ruby>チャプター</h1>

      <div className="grid gap-6">
        {chapters.map((chapter) => (
          <Link
            key={chapter.id}
            to={`/chapters/${chapter.id}`}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border-2 border-transparent hover:border-primary-300"
          >
            <div className="flex items-start gap-6">
              {/* シンプルなアイコン表示 */}
              <div className="text-6xl flex-shrink-0">📚</div>

              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-3" dangerouslySetInnerHTML={{ __html: chapter.title }}></h2>
                <p className="text-gray-600 text-lg mb-4" dangerouslySetInnerHTML={{ __html: chapter.description }}></p>

                <div className="flex items-center gap-2">
                  <span className="bg-primary-600 text-white px-6 py-3 rounded-lg font-bold inline-flex items-center gap-2 hover:bg-primary-700 transition-colors">
                    <ruby>問題<rt>もんだい</rt></ruby>を<ruby>解<rt>と</rt></ruby>く
                    <span className="text-xl">→</span>
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
