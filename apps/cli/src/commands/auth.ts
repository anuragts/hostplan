import { createInterface } from "node:readline/promises";
import { configPath, displayPath, readConfig, writeConfig } from "@hostplan/core";
import { awaitApproval, startDeviceAuth } from "../device-flow";
import { die, note, printJson, style } from "../output";
import { currentRemote, verify } from "../remote";
import { openInBrowser } from "./shared";

export interface LoginOptions {
	url?: string;
	token?: string;
	json?: boolean;
	/** commander sets these false for --no-browser / --no-open */
	browser?: boolean;
	open?: boolean;
}

/** Reads a secret without echoing it into the scrollback. */
async function prompt(question: string, hidden: boolean): Promise<string> {
	const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
	if (!hidden) {
		const value = await rl.question(question);
		rl.close();
		return value.trim();
	}

	// readline has no masked mode; suppressing its echo hook is the usual way in.
	const masked = rl as unknown as { _writeToOutput: (text: string) => void };
	let armed = false;
	masked._writeToOutput = (text: string) => {
		if (!armed) process.stdout.write(text);
	};
	const answer = rl.question(question);
	armed = true;
	const value = await answer;
	process.stdout.write("\n");
	rl.close();
	return value.trim();
}

/**
 * Two ways in, because they serve different callers.
 *
 * `--token` is the one that works unattended: an agent has no browser to open,
 * so it needs a token it can be handed. Without it, we run the device flow,
 * which is nicer when a human is present but requires someone to click.
 */
export async function loginCommand(options: LoginOptions): Promise<void> {
	const url = options.url ?? (await prompt(`${style.dim("deployment url")} (https://…): `, false));
	if (!/^https?:\/\//.test(url)) die("url must start with http:// or https://");
	const remoteUrl = url.replace(/\/$/, "");

	const token =
		options.token ??
		(options.browser === false ? await prompt(`${style.dim("token")}: `, true) : undefined);

	if (token !== undefined) {
		if (token.length === 0) die("no token given");
		const remote = { url: remoteUrl, token };
		// Fail here rather than on the first `hsp add`, when a plan is on the line.
		await verify(remote);
		await writeConfig({ remote: remote.url, token: remote.token });
		report(options, remote.url, undefined);
		return;
	}

	const request = await startDeviceAuth(remoteUrl);
	const link = `${request.verify_url}?code=${encodeURIComponent(request.user_code)}`;
	note(
		[
			"",
			`  ${style.dim("open")}  ${style.blue(link)}`,
			`  ${style.dim("code")}  ${style.bold(request.user_code)}`,
			"",
			style.dim("  waiting for approval…"),
		].join("\n"),
	);
	if (options.open !== false) openInBrowser(link);

	const grant = await awaitApproval(remoteUrl, request);
	await writeConfig({ remote: remoteUrl, token: grant.token });
	report(options, remoteUrl, grant.email);
}

function report(options: LoginOptions, url: string, email: string | null | undefined): void {
	if (options.json === true) {
		printJson({ remote: url, email: email ?? null, config: configPath() });
		return;
	}
	process.stdout.write(
		`${style.green("✓")} signed in to ${style.blue(url)}${email == null ? "" : ` as ${style.bold(email)}`}\n  ${style.dim(`token saved to ${displayPath(configPath())} (0600)`)}\n`,
	);
}

export async function logoutCommand(options: { json?: boolean }): Promise<void> {
	const had = (await readConfig()).remote;
	await writeConfig({ remote: undefined, token: undefined });
	if (options.json === true) {
		printJson({ signedOut: had ?? null });
		return;
	}
	note(
		had === undefined
			? `${style.dim("○")} not signed in`
			: `${style.green("✓")} signed out of ${had}`,
	);
}

export async function whoamiCommand(options: { json?: boolean }): Promise<void> {
	const remote = await currentRemote();
	if (options.json === true) {
		printJson({ remote: remote?.url ?? null });
		return;
	}
	if (remote === undefined) {
		note(`${style.dim("○")} local only — run \`hsp login\` to push to a deployment`);
		return;
	}
	process.stdout.write(`${style.blue(remote.url)}\n`);
}
