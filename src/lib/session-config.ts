// Session lifetime, shared by Auth.js (lib/auth.ts) and the proxy, which
// renews the cookie: active members stay signed in, and a session unused
// for SESSION_MAX_AGE expires.
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // seconds
export const SESSION_UPDATE_AGE = 24 * 60 * 60; // renew at most once a day
