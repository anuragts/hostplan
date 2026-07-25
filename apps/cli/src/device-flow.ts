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
	if (response.status === 400) {
		throw new CliError(
			"this deployment has no accounts — sign in with `hsp login --token <owner token>`",
		);
	}
	if (!response.ok) throw new CliError(`could not start sign-in: ${response.status}`);
	return (await response.json()) as DeviceRequest;
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

		if (response.ok) return (await response.json()) as DeviceGrant;

		const detail = await response
			.json()
			.then((body) => (body as { error?: string }).error)
			.catch(() => undefined);
		throw new CliError(detail ?? `sign-in failed: ${response.status}`);
	}
	throw new CliError("sign-in timed out — run `hsp login` again");
}
