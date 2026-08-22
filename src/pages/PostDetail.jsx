import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import apiClient from '../api/client';
import ReactionButtons from '../components/ReactionButtons';
import CommentSection from '../components/CommentSection';
import usePageMeta from '../hooks/usePageMeta';
import { formatPostmark } from '../utils/postmark';

export default function PostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading');

  usePageMeta(post?.title, post?.excerpt);

  useEffect(() => {
    setStatus('loading');
    apiClient
      .get(`/posts/${slug}`)
      .then((res) => {
        setPost(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>That post couldn't be found.</p>;

  const { day, month } = formatPostmark(post.published_at);

  return (
    <article className="post-detail">
      <Link to="/" className="back-link">&larr; Back to all posts</Link>

      <div className="detail-header">
        <div className="postmark"><span className="day">{day}</span><span className="month">{month}</span></div>
        <div>
          <p className="kicker">{post.category ? post.category.name : 'Blog'}</p>
          <h1>{post.title}</h1>
          <p className="post-meta">
            By <Link to={`/authors/${post.author.id}`}>{post.author.name}</Link>
          </p>
        </div>
      </div>

      {/* Body is HTML produced by the rich text editor (RichTextEditor.jsx).
          Always sanitize before injecting - even though only trusted logged-in
          authors can write posts, this is cheap defense-in-depth against a
          compromised account or a bug in the editor's output. iframe (for
          YouTube embeds) has to be explicitly allowed since DOMPurify strips
          it by default, and so do style/class - the editor's floating media
          toolbar writes inline width and media alignment/float classes
          directly onto images/iframes, and those get silently dropped on
          render without this allow-list. */}
      <div
        className="post-body rich-content"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(post.body, {
            ADD_TAGS: ['iframe'],
            ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'src', 'style', 'class', 'width', 'height'],
          }),
        }}
      />
      <ReactionButtons post={post} />
      <CommentSection post={post} />
    </article>
  );
}
