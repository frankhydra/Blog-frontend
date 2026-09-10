// Gray shimmering placeholder cards for list/grid views specifically (post
// feeds, book/portfolio/author grids) - swaps in under an already-visible
// page shell while data loads, instead of the full-page spinner (which
// stays exactly as-is for auth/whole-page loads - see Loading.jsx).
// Each variant reuses the real card's own CSS classes (.entry, .book-card,
// etc.) for its outer shape, so a skeleton card is always the same size
// and spacing as the real thing that replaces it - only the inner content
// is swapped for shimmering blocks.

function EntrySkeleton() {
  return (
    <li className="entry skeleton-card" aria-hidden="true">
      <div className="skeleton-block skeleton-postmark" />
      <div className="entry-body">
        <div className="skeleton-block skeleton-line skeleton-line-kicker" />
        <div className="skeleton-block skeleton-line skeleton-line-title" />
        <div className="skeleton-block skeleton-line skeleton-line-byline" />
        <div className="skeleton-block skeleton-line skeleton-line-excerpt" />
      </div>
    </li>
  );
}

function BookSkeleton() {
  return (
    <div className="book-card skeleton-card" aria-hidden="true">
      <div className="book-cover skeleton-block" />
      <div className="skeleton-block skeleton-line skeleton-line-book-title" />
    </div>
  );
}

function AuthorSkeleton() {
  return (
    <div className="author-card skeleton-card" aria-hidden="true">
      <div className="author-card-head">
        <div className="author-card-avatar skeleton-block skeleton-circle" />
        <div className="skeleton-author-meta">
          <div className="skeleton-block skeleton-line skeleton-line-name" />
          <div className="skeleton-block skeleton-line skeleton-line-meta" />
        </div>
      </div>
      <div className="skeleton-block skeleton-line skeleton-line-bio" />
      <div className="skeleton-block skeleton-line skeleton-line-bio-short" />
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="portfolio-project-card skeleton-card" aria-hidden="true">
      <div className="portfolio-project-image-wrap skeleton-block" />
      <div className="portfolio-project-body">
        <div className="skeleton-block skeleton-line skeleton-line-title" />
        <div className="skeleton-block skeleton-line skeleton-line-desc" />
        <div className="skeleton-block skeleton-line skeleton-line-desc-short" />
      </div>
    </div>
  );
}

const VARIANTS = {
  entry: { Card: EntrySkeleton, wrapperTag: 'ul', wrapperClass: 'entries' },
  book: { Card: BookSkeleton, wrapperTag: 'div', wrapperClass: 'book-grid' },
  author: { Card: AuthorSkeleton, wrapperTag: 'div', wrapperClass: 'author-cards' },
  project: { Card: ProjectSkeleton, wrapperTag: 'div', wrapperClass: 'portfolio-grid' },
};

// <SkeletonGrid variant="entry" count={4} /> - drop in wherever a list is
// still loading, alongside (not instead of) the page's own header/CTA
// content, which should stay visible immediately rather than being
// blanked out by a full-page spinner.
export default function SkeletonGrid({ variant, count = 4 }) {
  const config = VARIANTS[variant];
  if (!config) return null;
  const { Card, wrapperTag: Wrapper, wrapperClass } = config;

  return (
    <Wrapper className={wrapperClass} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} />
      ))}
    </Wrapper>
  );
}
