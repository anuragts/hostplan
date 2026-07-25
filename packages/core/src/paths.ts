import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Root of the global store. `HOSTPLAN_HOME` exists so tests (and anyone who
 * wants a throwaway store) can point somewhere other than the real one.
 */
export function storeRoot(): string {
	const override = process.env.HOSTPLAN_HOME;
	return override && override.length > 0 ? override : join(homedir(), ".hostplan");
}

export function plansRoot(): string {
	return join(storeRoot(), "plans");
}

export function runRoot(): string {
	return join(storeRoot(), "run");
}

export function configPath(): string {
	return join(storeRoot(), "config.json");
}

export function pidPath(): string {
	return join(runRoot(), "server.pid");
}

export function logPath(): string {
	return join(runRoot(), "server.log");
}

export async function ensureDir(dir: string): Promise<void> {
	await mkdir(dir, { recursive: true });
}

/** Shortens a path back to `~/...` for display. */
export function displayPath(path: string): string {
	const home = homedir();
	return path.startsWith(home) ? `~${path.slice(home.length)}` : path;
}
