import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 otherwise regenerates AGENTS.md/CLAUDE.md on every `dev`/`build` —
  // this repo doesn't keep them (see the initial commit).
  agentRules: false,
};

export default nextConfig;
