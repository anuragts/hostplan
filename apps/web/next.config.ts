import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

const nextConfig: NextConfig = {
	// Core is consumed as TypeScript source straight out of the workspace.
	transpilePackages: ["@hostplan/core"],
	serverExternalPackages: ["gray-matter", "shiki"],
	// Without this, Next walks up past the repo and finds an unrelated lockfile.
	turbopack: { root: repoRoot },
	outputFileTracingRoot: repoRoot,
};

export default nextConfig;
