import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

const nextConfig: NextConfig = {
	// `tsconfig.json` aliases core to source so the npm tarball stays self-contained.
	// Shiki is deliberately *not* external: left to runtime resolution its
	// grammars load as separate module reads on every cold start.
	serverExternalPackages: ["gray-matter"],
	// Without this, Next walks up past the repo and finds an unrelated lockfile.
	turbopack: { root: repoRoot },
	outputFileTracingRoot: repoRoot,
};

export default nextConfig;
