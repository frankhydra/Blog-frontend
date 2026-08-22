import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';
import { formatPostmark } from '../utils/postmark';

export default function LetterDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [letter, setLetter] = useState(null);
  const [status, setStatus] = useState('loading');

  usePageMeta(letter?.title, letter?.excerpt);

  useEffect(() => {
    setStatus('loading');
    apiClient
      .get(`/letters/${slug}`)
      .then((res) => {
        setLetter(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>That letter couldn't be found.</p>;

  const { day, month } = formatPostmark(letter.published_at);

  return (
    <article className="post-detail">
      <Link to="/letters" className="back-link">&larr; Back to letters</Link>

      <div className="detail-header">
        <div className="postmark"><span className="day">{day}</span><span className="month">{month}</span></div>
        <div>
          <p className="kicker">✉ Letter</p>
          <h1>{letter.title}</h1>
          {user?.role === 'admin' && (
            <p className="post-meta">
              <Link to={`/letters/${letter.slug}/edit`}>Edit</Link>
            </p>
          )}
        </div>
      </div>

      {/* See PostDetail.jsx for why style/class/width/height are allowed
          here - the editor's floating media toolbar depends on them. */}
      <div
        className="post-body rich-content"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(letter.body, {
            ADD_TAGS: ['iframe'],
            ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'src', 'style', 'class', 'width', 'height'],
          }),
        }}
      />
    </article>
  );
}
