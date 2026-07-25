import { execFile } from "node:child_process";
import { basename } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export interface Scope {
	project: string;
	branch: string;
	/** Repo root, or the working directory outside a repo. Deep links open here. */
	root: string;
}

export const NO_BRANCH = "no-branch";

async function git(args: string[], cwd: string): Promise<string | undefined> {
	try {
		const { stdout } = await run("git", args, { cwd, timeout: 5000 });
		const value = stdout.trim();
		return value.length > 0 ? value : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Project is the git repo's directory name, branch is the checked-out branch.
 * Outside a repo we still produce something usable rather than failing — an
 * agent shouldn't need a repo just to park a plan.
 */
export async function detectScope(cwd: string = process.cwd()): Promise<Scope> {
	const gitRoot = await git(["rev-parse", "--show-toplevel"], cwd);
	const root = gitRoot ?? cwd;
	const project = basename(root);

	if (gitRoot === undefined) return { project, branch: NO_BRANCH, root };

	const branch = await git(["branch", "--show-current"], cwd);
	if (branch !== undefined) return { project, branch, root };

	// Detached HEAD: the sha is the only meaningful label we have.
	const sha = await git(["rev-parse", "--short", "HEAD"], cwd);
	return { project, branch: sha === undefined ? NO_BRANCH : `detached-${sha}`, root };
}
