// One shared loading indicator used everywhere a page or section is
// waiting on data, in place of the 34 separate hardcoded "Loading…" texts
// that used to be scattered across the app. Two sizes:
//   <Loading />          - compact, inline - drops into an already-visible
//                          page (e.g. a list area while its items load)
//   <Loading fullPage />  - centered with real vertical room - for the
//                          early-return case where it replaces the whole
//                          page while auth/data is still resolving
export default function Loading({ label = 'Loading…', fullPage = false }) {
  return (
    <div className={`loading-state${fullPage ? ' loading-state-full' : ''}`} role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span className="loading-label">{label}</span>
    </div>
  );
}
