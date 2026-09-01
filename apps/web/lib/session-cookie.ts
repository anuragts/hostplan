/**
 * Kept separate from auth.ts because middleware runs in the edge runtime and
 * cannot import node:crypto.
 */
export const SESSION_COOKIE = "hsp_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
