/**
 * Public base URL of the app, read at runtime (server only). AUTH_URL is set
 * per deployment anyway; a NEXT_PUBLIC_ variable would be baked into the
 * image at build time and tie it to one domain.
 */
export function appUrl() {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
