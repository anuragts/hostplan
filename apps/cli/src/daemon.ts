import { spawn } from "node:child_process";
import { existsSync, openSync } from "node:fs";
import { cp, mkdtemp, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDir, logPath, pidPath, resolvePort, runRoot } from "@hostplan/core";
import packageInfo from "../../../package.json" with { type: "json" };
import { die, note, style } from "./output";

const BUNDLED_ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE_ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const IS_BUNDLED = existsSync(join(BUNDLED_ROOT, "apps", "web", "package.json"));
const REPO_ROOT = IS_BUNDLED ? BUNDLED_ROOT : SOURCE_ROOT;
const VIEWER_ROOT = IS_BUNDLED ? join(runRoot(), "viewer", packageInfo.version) : REPO_ROOT;

/** The packaged or source checkout's Next.js viewer. */
export const WEB_DIR = join(VIEWER_ROOT, "apps", "web");

const HEALTH_TIMEOUT_MS = 500;
const START_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 250;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextBin(): string {
	try {
		return createRequire(import.meta.url).resolve("next/dist/bin/next");
	} catch {
		// Keep source-checkout fallbacks for linked development installs.
	}
	const candidates = [
		join(WEB_DIR, "node_modules", ".bin", "next"),
		join(REPO_ROOT, "node_modules", ".bin", "next"),
	];
	const found = candidates.find((path) => existsSync(path));
	if (found === undefined) {
		die("could not find the `next` binary — run `bun install` in the hostplan repo");
	}
	return found;
}

async function prepareViewer(): Promise<void> {
	if (!IS_BUNDLED || existsSync(join(VIEWER_ROOT, ".ready"))) return;

	await ensureDir(dirname(VIEWER_ROOT));
	const temporaryRoot = await mkdtemp(join(dirname(VIEWER_ROOT), `.${packageInfo.version}-`));
	const dependencies = dirname(
		dirname(createRequire(import.meta.url).resolve("next/package.json")),
	);

	try {
		await ensureDir(join(temporaryRoot, "apps"));
		await ensureDir(join(temporaryRoot, "packages", "core"));
		await cp(join(REPO_ROOT, "apps", "web"), join(temporaryRoot, "apps", "web"), {
			recursive: true,
		});
		await cp(
			join(REPO_ROOT, "packages", "core", "src"),
			join(temporaryRoot, "packages", "core", "src"),
			{ recursive: true },
		);
		await cp(join(REPO_ROOT, "package.json"), join(temporaryRoot, "package.json"));
		await cp(join(REPO_ROOT, "tsconfig.base.json"), join(temporaryRoot, "tsconfig.base.json"));
		await symlink(
			dependencies,
			join(temporaryRoot, "node_modules"),
			process.platform === "win32" ? "junction" : "dir",
		);
		await writeFile(join(temporaryRoot, ".ready"), `${packageInfo.version}\n`, "utf8");
		await rename(temporaryRoot, VIEWER_ROOT);
	} catch (error) {
		await rm(temporaryRoot, { recursive: true, force: true });
		if (!existsSync(join(VIEWER_ROOT, ".ready"))) throw error;
	}
}

export function isBuilt(): boolean {
	return existsSync(join(WEB_DIR, ".next", "BUILD_ID"));
}

/**
 * Confirms it's *our* server on that port, not some unrelated process that
 * happened to claim it.
 */
export async function isHealthy(port: number): Promise<boolean> {
	try {
		const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
			signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
		});
		if (!response.ok) return false;
		const body = (await response.json()) as { app?: string };
		return body.app === "hostplan";
	} catch {
		return false;
	}
}

async function readPid(): Promise<number | undefined> {
	try {
		const pid = Number.parseInt(await readFile(pidPath(), "utf8"), 10);
		if (!Number.isInteger(pid) || pid <= 0) return undefined;
		process.kill(pid, 0);
		return pid;
	} catch {
		return undefined;
	}
}

async function build(): Promise<void> {
	note(style.dim("building viewer (one-time, ~30s)…"));
	const output: Buffer[] = [];
	const code = await new Promise<number>((resolve) => {
		const child = spawn(nextBin(), ["build", "--webpack"], {
			cwd: WEB_DIR,
			stdio: ["ignore", "pipe", "pipe"],
		});
		child.stdout?.on("data", (chunk: Buffer) => output.push(chunk));
		child.stderr?.on("data", (chunk: Buffer) => output.push(chunk));
		child.on("close", (status) => resolve(status ?? 1));
		child.on("error", () => resolve(1));
	});
	if (code !== 0) {
		process.stderr.write(Buffer.concat(output).toString());
		die("failed to build the viewer");
	}
}

async function startDetached(port: number): Promise<void> {
	await ensureDir(runRoot());
	const log = openSync(logPath(), "a");
	const child = spawn(nextBin(), ["start", "-p", String(port)], {
		cwd: WEB_DIR,
		detached: true,
		stdio: ["ignore", log, log],
		env: { ...process.env, PORT: String(port) },
	});
	child.unref();
	if (child.pid !== undefined) await writeFile(pidPath(), String(child.pid), "utf8");
}

async function tailLog(lines = 15): Promise<string> {
	try {
		const log = await readFile(logPath(), "utf8");
		return log.trimEnd().split("\n").slice(-lines).join("\n");
	} catch {
		return "(no server log)";
	}
}

export interface EnsureResult {
	port: number;
	started: boolean;
}

/**
 * Brings the viewer up if it isn't already. Every command that hands back a URL
 * calls this first, so an agent never receives a link that 404s.
 */
export async function ensureServer(): Promise<EnsureResult> {
	const port = await resolvePort();
	if (await isHealthy(port)) return { port, started: false };

	await prepareViewer();
	if (!isBuilt()) await build();
	await startDetached(port);

	const deadline = Date.now() + START_TIMEOUT_MS;
	while (Date.now() < deadline) {
		await sleep(POLL_INTERVAL_MS);
		if (await isHealthy(port)) return { port, started: true };
	}
	die(`viewer did not come up on port ${port} within 30s:\n${await tailLog()}`);
}

export interface ServerStatus {
	running: boolean;
	port: number;
	pid?: number;
}

export async function serverStatus(): Promise<ServerStatus> {
	const port = await resolvePort();
	const running = await isHealthy(port);
	const pid = await readPid();
	return { running, port, ...(pid === undefined ? {} : { pid }) };
}

export async function stopServer(): Promise<boolean> {
	const pid = await readPid();
	const port = await resolvePort();
	if (pid === undefined) {
		await rm(pidPath(), { force: true });
		return false;
	}
	try {
		process.kill(pid, "SIGTERM");
	} catch {
		await rm(pidPath(), { force: true });
		return false;
	}
	const deadline = Date.now() + 5000;
	while (Date.now() < deadline) {
		await sleep(POLL_INTERVAL_MS);
		if (!(await isHealthy(port))) break;
	}
	await rm(pidPath(), { force: true });
	return true;
}

/** Runs the viewer in the foreground, for debugging the server itself. */
export async function runForeground(port: number): Promise<number> {
	await prepareViewer();
	if (!isBuilt()) await build();
	return new Promise((resolve) => {
		const child = spawn(nextBin(), ["start", "-p", String(port)], {
			cwd: WEB_DIR,
			stdio: "inherit",
			env: { ...process.env, PORT: String(port) },
		});
		child.on("close", (code) => resolve(code ?? 0));
	});
}
