import type { NextConfig } from "next";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Load the monorepo root .env into process.env so shared config
// (packages/config) sees the same values as the rest of the stack.
function loadRootEnv() {
  const rootEnvPath = resolve(__dirname, "../../.env");
  if (!existsSync(rootEnvPath)) return;

  const content = readFileSync(rootEnvPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadRootEnv();

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
