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
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2" dangerouslySetInnerHTML={{ __html: chapter.title }}></h2>
            <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: chapter.description }}></p>
            <div className="mt-4">
              <span className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium inline-block">
                <ruby>問題<rt>もんだい</rt></ruby>を<ruby>解<rt>と</rt></ruby>く →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Chapters;
