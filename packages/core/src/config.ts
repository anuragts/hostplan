import { chmod, readFile, writeFile } from "node:fs/promises";
import { configPath, ensureDir, storeRoot } from "./paths";

export const DEFAULT_PORT = 7433;

export interface HostplanConfig {
	port: number;
	/** Base URL of a deployment, e.g. https://plans.host-plan.com. */
	remote?: string;
	/** Owner token for that deployment. */
	token?: string;
}

function str(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function readConfig(): Promise<HostplanConfig> {
	try {
		const raw = await readFile(configPath(), "utf8");
		const parsed = JSON.parse(raw) as Partial<HostplanConfig>;
		const remote = str(parsed.remote);
		const token = str(parsed.token);
		return {
			port: typeof parsed.port === "number" ? parsed.port : DEFAULT_PORT,
			...(remote === undefined ? {} : { remote }),
			...(token === undefined ? {} : { token }),
		};
	} catch {
		// A missing or corrupt config is not worth failing over — fall back to defaults.
		return { port: DEFAULT_PORT };
	}
}

export async function writeConfig(
	patch: { [K in keyof HostplanConfig]?: HostplanConfig[K] | undefined },
): Promise<HostplanConfig> {
	const current = await readConfig();
	// Passing `undefined` clears a field rather than writing a null into the file,
	// which is how `hsp logout` drops the saved token.
	const next: HostplanConfig = { ...current, port: patch.port ?? current.port };
	for (const key of ["remote", "token"] as const) {
		const value = key in patch ? patch[key] : current[key];
		if (value === undefined) delete next[key];
		else next[key] = value;
	}
	await ensureDir(storeRoot());
	// 0600: this file holds the owner token once `hsp login` has run.
	await writeFile(configPath(), `${JSON.stringify(next, null, 2)}\n`, {
		encoding: "utf8",
		mode: 0o600,
	});
	await chmod(configPath(), 0o600).catch(() => {});
	return next;
}

export interface Remote {
	url: string;
	token: string;
}

/**
 * The configured deployment, if `hsp login` has been run. Environment wins so
 * CI can supply a token without a config file: HOSTPLAN_REMOTE and
 * HOSTPLAN_TOKEN.
 */
export async function resolveRemote(): Promise<Remote | undefined> {
	const config = await readConfig();
	const url = str(process.env.HOSTPLAN_REMOTE) ?? config.remote;
	const token = str(process.env.HOSTPLAN_TOKEN) ?? config.token;
	if (url === undefined || token === undefined) return undefined;
	return { url: url.replace(/\/$/, ""), token };
}

/** env > config file > default */
export async function resolvePort(): Promise<number> {
	const fromEnv = Number.parseInt(process.env.HOSTPLAN_PORT ?? "", 10);
	if (Number.isInteger(fromEnv) && fromEnv > 0 && fromEnv < 65536) return fromEnv;
	return (await readConfig()).port;
}

export function planUrl(port: number, id: string): string {
	return `http://localhost:${port}/p/${id}`;
}
