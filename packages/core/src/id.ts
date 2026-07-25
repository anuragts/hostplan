import { randomInt } from "node:crypto";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

export const ID_LENGTH = 6;

const ID_PATTERN = new RegExp(`^[0-9a-z]{${ID_LENGTH}}$`);

export function newId(): string {
	let id = "";
	for (let i = 0; i < ID_LENGTH; i++) {
		id += ALPHABET[randomInt(ALPHABET.length)];
	}
	return id;
}

export function isId(value: string): boolean {
	return ID_PATTERN.test(value);
}
