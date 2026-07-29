import { isCode, isId, isPlanTheme, isStatus, PLAN_THEME_IDS, shareUrls } from "@hostplan/core";
import { currentViewer, unauthorized } from "@/lib/current-viewer";
import { origin as siteOrigin } from "@/lib/origin";
import { captureServerEvent } from "@/lib/server-analytics";
import { planStoreFor } from "@/lib/store";
import { canBrowse } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * A listing is scoped to whoever is asking: an account sees its own plans, the
 * legacy owner sees the whole store. Either way it is never anonymous, since a
 * listing exposes plans regardless of their visibility.
 */
export async function GET(request: Request) {
	const viewer = await currentViewer(request);
	if (!canBrowse(viewer)) return unauthorized();

	const params = new URL(request.url).searchParams;
	const project = params.get("project") ?? undefined;
	const branch = params.get("branch") ?? undefined;

	const plans = await planStoreFor(viewer).list({
		...(project === undefined ? {} : { project }),
		...(branch === undefined ? {} : { branch }),
	});

	const origin = siteOrigin(request);
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
	status?: string;
	theme?: string;
	dependsOn?: string;
	source?: string;
	cwd?: string;
}

export async function POST(request: Request) {
	const viewer = await currentViewer(request);
	if (!canBrowse(viewer)) return unauthorized();

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
	if (body.theme !== undefined && !isPlanTheme(body.theme)) {
		return Response.json(
			{ error: `theme must be one of ${PLAN_THEME_IDS.join(", ")}` },
			{ status: 400 },
		);
	}

	// A push carries the plan's identity so both sides hold one plan, not two.
	const plan = await planStoreFor(viewer).add({
		...(typeof id === "string" && isId(id) ? { id } : {}),
		...(typeof code === "string" && isCode(code) ? { code } : {}),
		content,
		title,
		project,
		branch,
		format: body.format === "html" ? "html" : "md",
		visibility: body.visibility === "public" ? "public" : "private",
		...(isStatus(body.status) ? { status: body.status } : {}),
		...(isPlanTheme(body.theme) ? { theme: body.theme } : {}),
		...(typeof body.dependsOn === "string" && isId(body.dependsOn)
			? { dependsOn: body.dependsOn }
			: {}),
		...(body.source === undefined ? {} : { source: body.source }),
		...(body.cwd === undefined ? {} : { cwd: body.cwd }),
	});

	const origin = siteOrigin(request);
	captureServerEvent({
		event: "hosted_plan_created",
		distinctId: viewer.kind === "user" ? viewer.userId : "local-owner",
		properties: {
			visibility: plan.meta.visibility,
			format: plan.meta.format,
		},
	});
	return Response.json({ ...plan.meta, ...shareUrls(origin, plan.meta) }, { status: 201 });
}
