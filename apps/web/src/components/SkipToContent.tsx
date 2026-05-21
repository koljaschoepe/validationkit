/**
 * Skip-links — hidden until keyboard-focused. Phase Nova-2: two anchors
 * (main + nav) so keyboard-only users can short-circuit either way.
 *
 * Target IDs: `#main-content` on the page wrapper, `#site-nav` on the
 * top SiteNav. Pages that don't render SiteNav (e.g. Landing) simply
 * skip the second link gracefully — focus falls through.
 */
export function SkipToContent() {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:left-3 focus-within:top-3 focus-within:z-[100] focus-within:flex focus-within:gap-2">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:rounded-md focus:border focus:border-border focus:bg-card focus:px-3 focus:py-2 focus:font-mono focus:type-mono-sm focus:text-foreground focus:shadow-lg focus:outline-2 focus:outline-ring focus:outline-offset-2"
      >
        Skip to main content
      </a>
      <a
        href="#site-nav"
        className="sr-only focus:not-sr-only focus:rounded-md focus:border focus:border-border focus:bg-card focus:px-3 focus:py-2 focus:font-mono focus:type-mono-sm focus:text-foreground focus:shadow-lg focus:outline-2 focus:outline-ring focus:outline-offset-2"
      >
        Skip to navigation
      </a>
    </div>
  );
}
