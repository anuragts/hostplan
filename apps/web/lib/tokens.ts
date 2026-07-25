import { randomBytes } from "node:crypto";

/**
 * Prefixed so a leaked token is recognisable in a log or a paste, and long
 * enough that guessing is not a strategy. Shown once at creation — only its
 * sha256 is kept, unlike a share code, which has to remain printable.
 */
export function newApiToken(): string {
	return `hsp_${randomBytes(24).toString("base64url")}`;
}

/** Human-readable, unambiguous, and short enough to read down a phone. */
export function newUserCode(): string {
	const alphabet = "ABCDEFGHJKMNPRSTUVWXYZ23456789";
	let code = "";
	for (let i = 0; i < 8; i++) {
		if (i === 4) code += "-";
		code += alphabet[randomBytes(1)[0]! % alphabet.length];
	}
	return code;
}

export function newDeviceCode(): string {
	return randomBytes(32).toString("base64url");
}
