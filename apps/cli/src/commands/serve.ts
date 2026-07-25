import { displayPath, logPath, resolvePort, storeRoot, writeConfig } from "@hostplan/core";
import { ensureServer, runForeground, serverStatus, stopServer } from "../daemon";
import { note, printJson, style } from "../output";

export interface ServeOptions {
	port?: string;
	foreground?: boolean;
	json?: boolean;
}

async function portFrom(options: ServeOptions): Promise<number> {
	if (options.port === undefined) return resolvePort();
	const port = Number.parseInt(options.port, 10);
	// Persist it so later `hsp add` calls build the same URL.
	return (await writeConfig({ port })).port;
}

export async function serveCommand(options: ServeOptions): Promise<void> {
	const port = await portFrom(options);

	if (options.foreground === true) {
		process.exitCode = await runForeground(port);
		return;
	}

	const { started } = await ensureServer();
	const url = `http://localhost:${port}`;
	if (options.json === true) {
		printJson({ running: true, started, port, url, store: storeRoot() });
		return;
	}
	process.stdout.write(
		`${style.green("✓")} ${started ? "started" : "already running"}  ${style.blue(url)}\n  ${style.dim(displayPath(storeRoot()))}\n`,
	);
}

export async function serveStatusCommand(options: ServeOptions): Promise<void> {
	const status = await serverStatus();
	if (options.json === true) {
		printJson({ ...status, url: `http://localhost:${status.port}`, store: storeRoot() });
		return;
	}
	if (!status.running) {
		note(`${style.dim("○")} not running  ${style.dim(`(port ${status.port})`)}`);
		process.exitCode = 1;
		return;
	}
	process.stdout.write(
		`${style.green("●")} running  ${style.blue(`http://localhost:${status.port}`)}${status.pid === undefined ? "" : style.dim(`  pid ${status.pid}`)}\n  ${style.dim(displayPath(logPath()))}\n`,
	);
}

export async function serveStopCommand(options: ServeOptions): Promise<void> {
	const stopped = await stopServer();
	if (options.json === true) {
		printJson({ stopped });
		return;
	}
	note(stopped ? `${style.green("✓")} stopped` : `${style.dim("○")} was not running`);
}
