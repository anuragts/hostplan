import { canRead, isId, normalizeCode, type PlanFormat, type StoredPlan } from "@hostplan/core";
import { currentViewer } from "@/lib/current-viewer";
import { ownsPlan } from "@/lib/plan-access";
import { clientKey, codeAttemptKey, consumeAttempt } from "@/lib/rate-limit";
import { adminPlanStore } from "@/lib/store";

type PlanRouteAccess = { ok: true; plan: StoredPlan } | { ok: false; response: Response };

/** Keep raw and rendered plan documents behind the same privacy and rate-limit rules. */
export async function resolvePlanRouteAccess(
	request: Request,
	id: string,
	requiredFormat?: PlanFormat,
): Promise<PlanRouteAccess> {
	const plan = isId(id) ? await adminPlanStore().get(id) : undefined;
	if (plan === undefined || (requiredFormat !== undefined && plan.meta.format !== requiredFormat)) {
		return { ok: false, response: new Response("not found", { status: 404 }) };
	}

	const supplied = new URL(request.url).searchParams.get("code");
	const code = normalizeCode(supplied);
	const isOwner = ownsPlan(plan, await currentViewer(request));
	if (!canRead(plan.meta, { isOwner, code })) {
		// Opening a bare private link is not a guess. Count only supplied codes.
		if (!isOwner && supplied !== null && supplied.length > 0) {
			const limit = consumeAttempt(codeAttemptKey(clientKey(request)));
			if (!limit.allowed) {
				return {
					ok: false,
					response: new Response("too many attempts", {
						status: 429,
						headers: { "retry-after": String(limit.retryAfterSeconds) },
					}),
				};
			}
		}
		return { ok: false, response: new Response("not found", { status: 404 }) };
	}

	return { ok: true, plan };
}
