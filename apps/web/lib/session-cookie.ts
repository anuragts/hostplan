/**
 * Lives apart from `auth.ts` because middleware runs in the edge runtime, where
 * importing anything that reaches `node:crypto` fails at request time.
 */
export const SESSION_COOKIE = "hsp_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
