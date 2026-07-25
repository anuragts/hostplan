import { randomInt, timingSafeEqual } from "node:crypto";

/**
 * I, O, Q and L are omitted — a share code gets read aloud and typed by hand,
 * and those are the ones people confuse with 1, 0 and each other.
 */
const ALPHABET = "ABCDEFGHJKMNPRSTUVWXYZ";

export const CODE_LENGTH = 4;

const CODE_PATTERN = new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`);

export function newCode(): string {
	let code = "";
	for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
	return code;
}

/** Uppercases and validates user input; undefined when it isn't a code at all. */
export function normalizeCode(value: string | undefined | null): string | undefined {
	if (value === undefined || value === null) return undefined;
	const upper = value.trim().toUpperCase();
	return CODE_PATTERN.test(upper) ? upper : undefined;
}

export function isCode(value: string): boolean {
	return CODE_PATTERN.test(value);
}

/**
 * Constant-time compare, so the rate limiter is the only signal an attacker
 * gets back. Both sides are already normalized to the same fixed length.
 */
export function codesMatch(a: string | undefined, b: string | undefined): boolean {
	if (a === undefined || b === undefined) return false;
	const left = Buffer.from(a.toUpperCase());
	const right = Buffer.from(b.toUpperCase());
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}
