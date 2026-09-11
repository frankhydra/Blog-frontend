import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import ReactionButtons from '../components/ReactionButtons';
import CommentSection from '../components/CommentSection';
import usePageMeta from '../hooks/usePageMeta';
import { formatPostmark } from '../utils/postmark';
import Loading from '../components/Loading';

export default function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading');
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/posts/${post.slug}`);
      navigate('/my-posts');
    } catch {
      alert("Couldn't delete that post.");
      setDeleting(false);
    }
  }

  if (status === 'loading') return <Loading fullPage />;
  if (status === 'error') return <p>That post couldn't be found.</p>;

  const canManage = user && (user.id === post.author?.id || user.role === 'admin');
  const { day, month } = formatPostmark(post.published_at);

  // Reading time isn't stored anywhere - it's fully derivable from the
  // post body, so it's simplest to compute it here rather than add a
  // column and keep it in sync on every save. Same 200wpm formula the
  // editor itself uses (RichTextEditor.jsx) so the numbers agree if
  // anyone ever compares "read time" while writing vs. while reading.
  const plainText = post.body.replace(/<[^>]+>/g, ' ');
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

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
            {' '}· {readingTime} min read
            {canManage && (
              <>
                {' '}· <Link to={`/posts/${post.slug}/edit`}>Edit</Link>
                {' '}· <button type="button" onClick={handleDelete} disabled={deleting} className="link-button-inline">
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </>
            )}
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

      {post.tags?.length > 0 && (
        <div className="skill-chip-row post-tag-row">
          {post.tags.map((tag) => (
            <Link key={tag.id} to={`/tags/${tag.slug}`} className="skill-chip post-tag-chip">
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      <ReactionButtons post={post} />
      <CommentSection post={post} />
    </article>
  );
}
