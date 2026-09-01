import {
	canRead,
	isCode,
	isId,
	isStatus,
	normalizeCode,
	shareUrls,
	validateCustomHtml,
} from "@hostplan/core";
import { currentViewer, unauthorized } from "@/lib/current-viewer";
import { origin as siteOrigin } from "@/lib/origin";
import { ownsPlan } from "@/lib/plan-access";
import { clientKey, codeAttemptKey, consumeAttempt } from "@/lib/rate-limit";
import { adminPlanStore, planStoreFor } from "@/lib/store";
import { canPublishTrustedHtml, markTrustedHtml, stripTrustedHtmlMarker } from "@/lib/trusted-html";
import { canBrowse } from "@/lib/viewer";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function notFound(): Response {
	return Response.json({ error: "not found" }, { status: 404 });
}

export async function GET(request: Request, { params }: Params) {
	const { id } = await params;
	if (!isId(id)) return notFound();

	// Read unscoped first: a code holder has no session for RLS to filter on.
	// canRead() below is what decides whether they see any of it.
	const plan = await adminPlanStore().get(id);
	if (plan === undefined) return notFound();

	const code = normalizeCode(new URL(request.url).searchParams.get("code"));
	const viewer = await currentViewer(request);
	const isOwner = ownsPlan(plan, viewer);

	// Same gate as the page and the raw route — one implementation, no gaps.
	if (!canRead(plan.meta, { isOwner, code })) {
		if (!isOwner) {
			const limit = consumeAttempt(codeAttemptKey(clientKey(request)));
			if (!limit.allowed) {
				return Response.json(
					{ error: "too many attempts" },
					{ status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
				);
			}
		}
		return unauthorized();
	}

	// A reader gets the plan, not the owner's machine: the code is theirs to hand
	// out, and source/cwd are absolute paths that would leak a home directory
	// and username to anyone holding a share link.
	const { code: _code, source: _source, cwd: _cwd, ...shareable } = plan.meta;
	const meta = isOwner ? plan.meta : shareable;
	const origin = siteOrigin(request);

	return Response.json({
		...meta,
		...(isOwner ? shareUrls(origin, plan.meta) : { url: `${origin}/p/${plan.meta.id}` }),
		body: plan.meta.format === "html" ? stripTrustedHtmlMarker(plan.body) : plan.body,
	});
}

export async function PATCH(request: Request, { params }: Params) {
	const viewer = await currentViewer(request);
	if (!canBrowse(viewer)) return unauthorized();
	const { id } = await params;
	if (!isId(id)) return notFound();

	let body: {
		visibility?: string;
		code?: string;
		rotateCode?: boolean;
		title?: string;
		status?: string;
		content?: string;
		dependsOn?: string | null;
		trustedHtml?: boolean;
	};
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return Response.json({ error: "body must be JSON" }, { status: 400 });
	}
	if (body.status !== undefined && !isStatus(body.status)) {
		return Response.json({ error: `\`${body.status}\` is not a status` }, { status: 400 });
	}
	if (body.code !== undefined && !isCode(body.code)) {
		return Response.json({ error: "invalid share code" }, { status: 400 });
	}
	const store = planStoreFor(viewer);
	let storedContent = body.content;
	if (typeof body.content === "string") {
		const existing = await store.get(id);
		if (existing === undefined) return notFound();
		if (existing.meta.format === "html") {
			if (body.trustedHtml === true) {
				if (!canPublishTrustedHtml(viewer)) {
					return Response.json(
						{ error: "trusted HTML is not enabled for this account" },
						{ status: 403 },
					);
				}
				storedContent = markTrustedHtml(body.content);
			} else {
				storedContent = stripTrustedHtmlMarker(body.content);
				const validation = validateCustomHtml(storedContent);
				if (!validation.valid) {
					return Response.json(
						{ error: "invalid custom HTML", issues: validation.errors },
						{ status: 422 },
					);
				}
			}
		}
	}

	const plan = await store.update(id, {
		...(body.visibility === "public" || body.visibility === "private"
			? { visibility: body.visibility }
			: {}),
		...(body.rotateCode === true ? { rotateCode: true } : {}),
		...(body.code === undefined ? {} : { code: body.code }),
		...(body.title === undefined ? {} : { title: body.title }),
		...(isStatus(body.status) ? { status: body.status } : {}),
		...(typeof storedContent === "string" ? { content: storedContent } : {}),
		// `null` detaches a plan from its stack; a string re-chains it.
		...(body.dependsOn === null
			? { dependsOn: null }
			: typeof body.dependsOn === "string" && isId(body.dependsOn)
				? { dependsOn: body.dependsOn }
				: {}),
	});
	if (plan === undefined) return notFound();

	const origin = siteOrigin(request);
	return Response.json({ ...plan.meta, ...shareUrls(origin, plan.meta) });
}

export async function DELETE(request: Request, { params }: Params) {
	const viewer = await currentViewer(request);
	if (!canBrowse(viewer)) return unauthorized();
	const { id } = await params;
	if (!isId(id)) return notFound();

	const plan = await planStoreFor(viewer).remove(id);
	if (plan === undefined) return notFound();
	return Response.json({ removed: plan.meta.id, title: plan.meta.title });
}
