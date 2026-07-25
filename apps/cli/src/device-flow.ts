import { CliError } from "./output";

export interface DeviceRequest {
	device_code: string;
	user_code: string;
	verify_url: string;
	interval: number;
	expires_in: number;
}

export interface DeviceGrant {
	token: string;
	email: string | null;
}

const POLL_TIMEOUT_MS = 20_000;

const NO_ACCOUNTS =
	"this deployment doesn't support account sign-in — use `hsp login --token <token>`";

/**
 * A deployment that predates accounts has no `/api/cli/auth`, so it answers
 * with an HTML error page. Parsing that as JSON throws a SyntaxError that says
 * nothing useful, so read the body as text and decide from there.
 */
async function readJson<T>(response: Response): Promise<T | undefined> {
	const text = await response.text();
	try {
		return JSON.parse(text) as T;
	} catch {
		return undefined;
	}
}

/** Asks the deployment for a pending request the human can approve. */
export async function startDeviceAuth(url: string): Promise<DeviceRequest> {
	let response: Response;
	try {
		response = await fetch(`${url}/api/cli/auth`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
		});
	} catch (error) {
		throw new CliError(`cannot reach ${url}: ${(error as Error).message}`);
	}

	const body = await readJson<DeviceRequest & { error?: string }>(response);

	// Not JSON at all: an older build, a proxy error page, anything but us.
	if (body === undefined) throw new CliError(NO_ACCOUNTS);
	if (response.status === 400) throw new CliError(body.error ?? NO_ACCOUNTS);
	if (!response.ok) throw new CliError(body.error ?? `could not start sign-in: ${response.status}`);
	if (typeof body.device_code !== "string") throw new CliError(NO_ACCOUNTS);

	return body;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Polls until the human approves, or the request expires. 202 means "not yet",
 * which is the only status that should keep us waiting.
 */
export async function awaitApproval(
	url: string,
	request: DeviceRequest,
	onTick?: () => void,
): Promise<DeviceGrant> {
	const deadline = Date.now() + request.expires_in * 1000;
	const intervalMs = Math.max(1, request.interval) * 1000;

	while (Date.now() < deadline) {
		await sleep(intervalMs);
		onTick?.();

		const response = await fetch(`${url}/api/cli/token`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ device_code: request.device_code }),
			signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
		}).catch(() => undefined);

		if (response === undefined) continue; // transient; keep waiting
		if (response.status === 202) continue;

		const body = await readJson<DeviceGrant & { error?: string }>(response);
		if (response.ok && typeof body?.token === "string") return body;

		throw new CliError(body?.error ?? `sign-in failed: ${response.status}`);
	}
	throw new CliError("sign-in timed out — run `hsp login` again");
}
