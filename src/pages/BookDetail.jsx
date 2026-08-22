import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';

export default function BookDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [status, setStatus] = useState('loading');

  usePageMeta(book?.title, book?.description);

  useEffect(() => {
    setStatus('loading');
    apiClient
      .get(`/books/${slug}`)
      .then((res) => {
        setBook(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>That book couldn't be found.</p>;

  const canEdit = user && (user.id === book.owner_id || user.role === 'admin');

  return (
    <article className="book-detail">
      <Link to="/books" className="back-link">&larr; Back to books</Link>

      <div className="book-detail-layout">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="book-cover-large" />
        ) : (
          <div className="book-cover-large book-cover-placeholder">{book.title}</div>
        )}

        <div>
          <h1>{book.title}</h1>
          <p className="post-meta">
            By {book.author_name}
            {canEdit && <> · <Link to={`/books/${book.slug}/edit`}>Edit</Link></>}
          </p>
          {book.description && <p>{book.description}</p>}

          {book.file_url && (
            <p>
              <a href={book.file_url} download={book.file_name} className="book-download-link">
                Download {book.file_name ? `(${book.file_name})` : 'book'}
              </a>
            </p>
          )}

          <p className="post-meta">
            Purchase/affiliate links coming soon - this section is ready for
            them when that's added later.
          </p>
        </div>
      </div>
    </article>
  );
}
