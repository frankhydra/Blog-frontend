import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { formatPostmark } from '../utils/postmark';

// Read-only "Reader View" for the composer's preview tab. Renders a
// draft post/letter using the exact same markup and sanitize rules as
// PostDetail.jsx/LetterDetail.jsx, so what you see here while writing is
// what actually gets published - not a rough approximation of it.
//
// props:
//   kind     - 'post' | 'letter'
//   title, excerpt, body - current (unsaved) form values
//   meta     - optional line under the title: category name for posts,
//              target email segment for letters
export default function ContentPreview({ kind, title, excerpt, body, meta }) {
  const { user } = useAuth();
  const { day, month } = formatPostmark(new Date().toISOString());

  return (
    <article className="post-detail composer-preview">
      <div className="detail-header">
        <div className="postmark">
          <span className="day">{day}</span>
          <span className="month">{month}</span>
        </div>
        <div>
          <p className="kicker">{kind === 'letter' ? '✉ Letter' : (meta || 'Blog')}</p>
          <h1>{title || 'Untitled'}</h1>
          <p className="post-meta">
            {kind === 'letter'
              ? (meta ? `Sending to: ${meta}` : 'Draft - not yet sent')
              : (user ? `By ${user.name}` : 'Draft')}
          </p>
        </div>
      </div>

      {excerpt && <p className="preview-excerpt">{excerpt}</p>}

      {/* Same tags/attrs allow-list as PostDetail/LetterDetail - keeps the
          preview honest about what will and won't render once published. */}
      <div
        className="post-body rich-content"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(body || '<p><em>Nothing written yet.</em></p>', {
            ADD_TAGS: ['iframe'],
            ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'src', 'style', 'class', 'width', 'height'],
          }),
        }}
      />
    </article>
  );
}
