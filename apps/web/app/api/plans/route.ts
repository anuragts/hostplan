import { canRead, isCode, isId, normalizeCode, shareUrls } from "@hostplan/core";
import { isOwnerRequest, unauthorized } from "@/lib/auth";
import { planStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Listing exposes every plan, so it is owner-only regardless of visibility. */
export async function GET(request: Request) {
	if (!(await isOwnerRequest(request))) return unauthorized();

	const params = new URL(request.url).searchParams;
	const project = params.get("project") ?? undefined;
	const branch = params.get("branch") ?? undefined;

	const plans = await planStore().list({
		...(project === undefined ? {} : { project }),
		...(branch === undefined ? {} : { branch }),
	});

	const origin = new URL(request.url).origin;
	return Response.json({
		plans: plans.map((plan) => ({ ...plan.meta, ...shareUrls(origin, plan.meta) })),
	});
}

interface CreateBody {
	content?: string;
	title?: string;
	project?: string;
	branch?: string;
	format?: string;
	visibility?: string;
	id?: string;
	code?: string;
	source?: string;
	cwd?: string;
}

export async function POST(request: Request) {
	if (!(await isOwnerRequest(request))) return unauthorized();

	let body: CreateBody;
	try {
		body = (await request.json()) as CreateBody;
	} catch {
		return Response.json({ error: "body must be JSON" }, { status: 400 });
	}

	const { content, title, project, branch, id, code } = body;
	if (!content || !title || !project || !branch) {
		return Response.json(
			{ error: "content, title, project and branch are required" },
			{ status: 400 },
		);
	}

	// A push carries the plan's identity so both sides hold one plan, not two.
	const plan = await planStore().add({
		...(typeof id === "string" && isId(id) ? { id } : {}),
		...(typeof code === "string" && isCode(code) ? { code } : {}),
		content,
		title,
		project,
		branch,
		format: body.format === "html" ? "html" : "md",
		visibility: body.visibility === "public" ? "public" : "private",
		...(body.source === undefined ? {} : { source: body.source }),
		...(body.cwd === undefined ? {} : { cwd: body.cwd }),
	});

	const origin = new URL(request.url).origin;
	return Response.json({ ...plan.meta, ...shareUrls(origin, plan.meta) }, { status: 201 });
}
