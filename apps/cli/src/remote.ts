import type { PlanMeta, Remote, StoredPlan, Visibility } from "@hostplan/core";
import { resolveRemote } from "@hostplan/core";
import { CliError } from "./output";

/**
 * The API returns metadata flattened alongside the links it already built with
 * the deployment's own origin — so the CLI never has to guess the public URL.
 */
export type RemotePlan = PlanMeta & { url: string; codedUrl?: string };

export interface PushInput {
	content: string;
	title: string;
	project: string;
	branch: string;
	format: "md" | "html";
	visibility?: Visibility;
	id?: string;
	code?: string;
}

const TIMEOUT_MS = 20_000;

async function call(remote: Remote, path: string, init: RequestInit = {}): Promise<Response> {
	return fetch(`${remote.url}${path}`, {
		...init,
		headers: {
			...init.headers,
			authorization: `Bearer ${remote.token}`,
			"content-type": "application/json",
		},
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
}

/** Turns an HTTP failure into something worth reading before it reaches a user. */
async function fail(response: Response, action: string): Promise<never> {
	const detail = await response
		.json()
		.then((body) => (body as { error?: string }).error)
		.catch(() => undefined);
	if (response.status === 401) {
		throw new CliError(`${action}: token rejected — run \`hsp login\` again`);
	}
	throw new CliError(`${action}: ${response.status} ${detail ?? response.statusText}`);
}

export async function currentRemote(): Promise<Remote | undefined> {
	return resolveRemote();
}

/** Confirms a URL is a hostplan deployment and the token is accepted. */
export async function verify(remote: Remote): Promise<void> {
	let response: Response;
	try {
		response = await call(remote, "/api/plans?limit=1");
	} catch (error) {
		throw new CliError(`cannot reach ${remote.url}: ${(error as Error).message}`);
	}
	if (!response.ok) await fail(response, "sign in");
}

export async function push(remote: Remote, input: PushInput): Promise<RemotePlan> {
	const response = await call(remote, "/api/plans", {
		method: "POST",
		body: JSON.stringify(input),
	});
	if (!response.ok) await fail(response, "push");
	return (await response.json()) as RemotePlan;
}

export async function fetchPlan(remote: Remote, id: string): Promise<RemotePlan | undefined> {
	const response = await call(remote, `/api/plans/${id}`);
	if (response.status === 404) return undefined;
	if (!response.ok) await fail(response, "fetch");
	return (await response.json()) as RemotePlan;
}

export async function fetchList(
	remote: Remote,
	filter: { project?: string; branch?: string },
): Promise<StoredPlan[]> {
	const query = new URLSearchParams();
	if (filter.project !== undefined) query.set("project", filter.project);
	if (filter.branch !== undefined) query.set("branch", filter.branch);
	const response = await call(remote, `/api/plans?${query}`);
	if (!response.ok) await fail(response, "list");
	const body = (await response.json()) as { plans: StoredPlan[] };
	return body.plans;
}
