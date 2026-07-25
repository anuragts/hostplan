import { canRead, isId, normalizeCode, shareUrls } from "@hostplan/core";
import { isOwnerRequest, unauthorized } from "@/lib/auth";
import { clientKey, consumeAttempt } from "@/lib/rate-limit";
import { planStore } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function notFound(): Response {
	return Response.json({ error: "not found" }, { status: 404 });
}

export async function GET(request: Request, { params }: Params) {
	const { id } = await params;
	if (!isId(id)) return notFound();

	const plan = await planStore().get(id);
	if (plan === undefined) return notFound();

	const code = normalizeCode(new URL(request.url).searchParams.get("code"));
	const isOwner = await isOwnerRequest(request);

	// Same gate as the page and the raw route — one implementation, no gaps.
	if (!canRead(plan.meta, { isOwner, code })) {
		if (!isOwner) {
			const limit = consumeAttempt(`api:${clientKey(request)}`);
			if (!limit.allowed) {
				return Response.json(
					{ error: "too many attempts" },
					{ status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
				);
			}
		}
		return unauthorized();
	}

	// The code is the owner's to hand out; a code holder gets the plan, not it.
	const { code: planCode, ...safeMeta } = plan.meta;
	const meta = isOwner ? plan.meta : safeMeta;
	const origin = new URL(request.url).origin;

	return Response.json({
		...meta,
		...(isOwner ? shareUrls(origin, plan.meta) : { url: `${origin}/p/${plan.meta.id}` }),
		body: plan.body,
	});
}

export async function PATCH(request: Request, { params }: Params) {
	if (!(await isOwnerRequest(request))) return unauthorized();
	const { id } = await params;
	if (!isId(id)) return notFound();

	let body: { visibility?: string; rotateCode?: boolean; title?: string };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return Response.json({ error: "body must be JSON" }, { status: 400 });
	}

	const plan = await planStore().update(id, {
		...(body.visibility === "public" || body.visibility === "private"
			? { visibility: body.visibility }
			: {}),
		...(body.rotateCode === true ? { rotateCode: true } : {}),
		...(body.title === undefined ? {} : { title: body.title }),
	});
	if (plan === undefined) return notFound();

	const origin = new URL(request.url).origin;
	return Response.json({ ...plan.meta, ...shareUrls(origin, plan.meta) });
}

export async function DELETE(request: Request, { params }: Params) {
	if (!(await isOwnerRequest(request))) return unauthorized();
	const { id } = await params;
	if (!isId(id)) return notFound();

	const plan = await planStore().remove(id);
	if (plan === undefined) return notFound();
	return Response.json({ removed: plan.meta.id, title: plan.meta.title });
}
