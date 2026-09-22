// Q6 - "how social media does this": a compact, read-only summary shown
// near the top of a post/letter/book, right in the byline area, so
// popularity is visible at a glance without scrolling to the interactive
// like button or the comment thread further down the page. This is
// display-only - ReactionButtons.jsx (further down) is still the actual
// clickable like/dislike control; this strip just surfaces the numbers
// content.likes_count/comments_count/views_count already carry from
// PostController/LetterController/BookController::show().
export default function ContentStats({ content }) {
  return (
    <div className="content-stats">
      <span className="content-stat" title="Views">
        👁 {content.views_count ?? 0}
      </span>
      <span className="content-stat" title="Likes">
        ♡ {content.likes_count ?? 0}
      </span>
      <span className="content-stat" title="Comments">
        💬 {content.comments_count ?? 0}
      </span>
    </div>
  );
}
