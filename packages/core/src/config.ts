import { readFile, writeFile } from "node:fs/promises";
import { configPath, ensureDir, storeRoot } from "./paths";

export const DEFAULT_PORT = 7433;

export interface HostplanConfig {
	port: number;
}

export async function readConfig(): Promise<HostplanConfig> {
	try {
		const raw = await readFile(configPath(), "utf8");
		const parsed = JSON.parse(raw) as Partial<HostplanConfig>;
		return { port: typeof parsed.port === "number" ? parsed.port : DEFAULT_PORT };
	} catch {
		// A missing or corrupt config is not worth failing over — fall back to defaults.
		return { port: DEFAULT_PORT };
	}
}

export async function writeConfig(patch: Partial<HostplanConfig>): Promise<HostplanConfig> {
	const next = { ...(await readConfig()), ...patch };
	await ensureDir(storeRoot());
	await writeFile(configPath(), `${JSON.stringify(next, null, 2)}\n`, "utf8");
	return next;
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
