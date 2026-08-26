import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';
import { formatPostmark } from '../utils/postmark';
import { getAuthorFlag } from '../utils/authorFlag';

export default function Letters() {
  const { user } = useAuth();
  const [letters, setLetters] = useState([]);
  const [status, setStatus] = useState('loading');

  usePageMeta('Letters', 'Public letters from everyone writing here, archived as they are published.');

  useEffect(() => {
    apiClient
      .get('/letters')
      .then((res) => {
        setLetters(res.data.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div>
      <p className="kicker">Letters</p>
      <h1>Public letters, from everyone writing here</h1>

      {user && ['admin', 'author'].includes(user.role) && (
        <p className="post-meta">
          <Link to="/write/letter">Write a new letter</Link>
        </p>
      )}

      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <p>Couldn't load letters.</p>}
      {status === 'ready' && letters.length === 0 && <p>No letters published yet.</p>}

      <ul className="entries">
        {letters.map((letter) => {
          const { day, month } = formatPostmark(letter.published_at);
          const flag = getAuthorFlag(letter.author);
          return (
            <li key={letter.id} className="entry">
              <div className="postmark"><span className="day">{day}</span><span className="month">{month}</span></div>
              <div className="entry-body">
                <p className="kicker">Letter</p>
                <h2>
                  <Link to={`/letters/${letter.slug}`}>{letter.title}</Link>
                </h2>
                <p className="post-meta author-byline">
                  <span className="author-flag" style={{ background: flag.color }} title={flag.title} />
                  By {letter.author ? (
                    <Link to={`/authors/${letter.author.id}`}>{letter.author.name}</Link>
                  ) : 'Unknown'}
                </p>
                {letter.excerpt && <p>{letter.excerpt}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
