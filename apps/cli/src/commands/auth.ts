import { createInterface } from "node:readline/promises";
import { configPath, displayPath, readConfig, writeConfig } from "@hostplan/core";
import { die, note, printJson, style } from "../output";
import { currentRemote, verify } from "../remote";

export interface LoginOptions {
	url?: string;
	token?: string;
	json?: boolean;
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

export async function loginCommand(options: LoginOptions): Promise<void> {
	const url = options.url ?? (await prompt(`${style.dim("deployment url")} (https://…): `, false));
	if (!/^https?:\/\//.test(url)) die("url must start with http:// or https://");

	const token = options.token ?? (await prompt(`${style.dim("owner token")}: `, true));
	if (token.length === 0) die("no token given");

	const remote = { url: url.replace(/\/$/, ""), token };
	// Fail here rather than on the first `hsp add`, when a plan is on the line.
	await verify(remote);
	await writeConfig({ remote: remote.url, token: remote.token });

	if (options.json === true) {
		printJson({ remote: remote.url, config: configPath() });
		return;
	}
	process.stdout.write(
		`${style.green("✓")} signed in to ${style.blue(remote.url)}\n  ${style.dim(`token saved to ${displayPath(configPath())} (0600)`)}\n`,
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
