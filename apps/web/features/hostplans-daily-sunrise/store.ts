import { createClient } from "@supabase/supabase-js";
import { secretKey, supabaseUrl } from "@/lib/supabase-clients";
import { DAILY_SUNRISE_TABLE, type DailySunriseSnapshot } from "./snapshot";

function assertSafeSnapshot(snapshot: DailySunriseSnapshot): void {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.snapshotDate)) {
		throw new Error("snapshotDate must be a UTC date in YYYY-MM-DD format");
	}
	if (snapshot.scope === "overall" && snapshot.publicPath !== "*") {
		throw new Error("overall snapshots must use the aggregate path '*'");
	}
	if (snapshot.scope !== "overall" && snapshot.publicPath === "*") {
		throw new Error("path and article snapshots require a public pathname");
	}
	if (
		snapshot.publicPath !== "*" &&
		(!snapshot.publicPath.startsWith("/") ||
			snapshot.publicPath.includes("?") ||
			snapshot.publicPath.includes("#"))
	) {
		throw new Error("publicPath must be a sanitized public pathname");
	}
	if (/^\/p\//.test(snapshot.publicPath) || snapshot.publicPath.startsWith("/api/")) {
		throw new Error("private and API routes cannot enter Daily Sunrise snapshots");
	}
	if (snapshot.articleSlug !== null && !/^[a-z0-9-]+$/.test(snapshot.articleSlug)) {
		throw new Error("articleSlug must contain only lowercase letters, digits, and hyphens");
	}
	if (snapshot.automationPrNumber === null && snapshot.automationCommitSha === null) {
		throw new Error("an automation PR number or commit SHA is required");
	}
	for (const value of [
		snapshot.newUsers,
		snapshot.returningUsers,
		snapshot.pageViews,
		snapshot.organicSearchSessions,
		snapshot.aiAnswerReferralSessions,
		snapshot.activationEvents,
	]) {
		if (!Number.isSafeInteger(value) || value < 0) {
			throw new Error("snapshot metrics must be non-negative safe integers");
		}
	}
}

/** Service-only aggregate write. The table has RLS enabled and no client policies. */
export async function upsertDailySunriseSnapshot(snapshot: DailySunriseSnapshot): Promise<void> {
	assertSafeSnapshot(snapshot);
	const url = supabaseUrl();
	const key = secretKey();
	if (url === undefined || key === undefined) {
		throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required for Daily Sunrise");
	}
	const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
	const { error } = await db.from(DAILY_SUNRISE_TABLE).upsert(
		{
			snapshot_date: snapshot.snapshotDate,
			scope: snapshot.scope,
			public_path: snapshot.publicPath,
			article_slug: snapshot.articleSlug,
			automation_pr_number: snapshot.automationPrNumber,
			automation_commit_sha: snapshot.automationCommitSha,
			new_users: snapshot.newUsers,
			returning_users: snapshot.returningUsers,
			page_views: snapshot.pageViews,
			organic_search_sessions: snapshot.organicSearchSessions,
			ai_answer_referral_sessions: snapshot.aiAnswerReferralSessions,
			activation_events: snapshot.activationEvents,
			insight: snapshot.insight,
			decision: snapshot.decision,
			is_complete: snapshot.isComplete,
		},
		{ onConflict: "snapshot_date,scope,public_path" },
	);
	if (error !== null) throw new Error(`Daily Sunrise upsert failed: ${error.message}`);
}
