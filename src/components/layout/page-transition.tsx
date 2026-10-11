// A CSS animation rather than a motion component: motion rendered the page at
// opacity 0 in the server HTML, so nothing was visible until JS hydrated.
export function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
