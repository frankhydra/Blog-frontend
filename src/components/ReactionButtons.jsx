import { useState } from 'react';
import apiClient from '../api/client';

// Q6 - was post-only (hardcoded /posts/{slug}/react). Reactions now work
// on letters and books too, so this takes contentType ('posts'|'letters'|
// 'books') plus the content object instead of assuming "post".
// Props: contentType, content = the post/letter/book object (needs slug,
// likes_count, dislikes_count, my_reaction)
export default function ReactionButtons({ contentType, content }) {
  const [likes, setLikes] = useState(content.likes_count ?? 0);
  const [dislikes, setDislikes] = useState(content.dislikes_count ?? 0);
  const [myReaction, setMyReaction] = useState(content.my_reaction ?? null);
  const [submitting, setSubmitting] = useState(false);

  async function react(type) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/${contentType}/${content.slug}/react`, { type });
      // Trust the server's counts rather than guessing locally -
      // it already worked out the toggle/switch logic for us.
      setLikes(res.data.likes_count);
      setDislikes(res.data.dislikes_count);
      setMyReaction(res.data.my_reaction);
    } catch {
      // Silently ignore for now - worst case the click just doesn't register
      // and the user can try again. A toast/error message can come later.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="reaction-buttons">
      <button
        onClick={() => react('like')}
        disabled={submitting}
        className={myReaction === 'like' ? 'reaction-active' : ''}
        aria-pressed={myReaction === 'like'}
      >
        👍 {likes}
      </button>
      <button
        onClick={() => react('dislike')}
        disabled={submitting}
        className={myReaction === 'dislike' ? 'reaction-active' : ''}
        aria-pressed={myReaction === 'dislike'}
      >
        👎 {dislikes}
      </button>
    </div>
  );
}
