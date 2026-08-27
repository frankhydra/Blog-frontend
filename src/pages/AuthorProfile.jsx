import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import PortfolioOnePager from '../components/PortfolioOnePager';

export default function AuthorProfile() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [status, setStatus] = useState('loading');

  usePageMeta(author?.name, author?.bio);

  useEffect(() => {
    setStatus('loading');
    apiClient
      .get(`/authors/${id}`)
      .then((res) => {
        setAuthor(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>That author couldn't be found.</p>;

  return (
    <div className="about-page">
      <PortfolioOnePager
        person={author}
        items={author.portfolio}
        posts={author.posts}
        experience={author.experience}
        showContact
        backLink={{ to: '/portfolio', label: 'Back to Portfolio' }}
      />
    </div>
  );
}
