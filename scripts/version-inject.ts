#!/usr/bin/env bun
/**
 * Inject git version into package.json and site HTML before build.
 *
 * Source of truth: `git describe --tags --always`
 * - Tagged commit: `v0.1.0`
 * - Untagged commit: `v0.1.0-3-gabc123f`
 * - No tags at all: short commit hash `abc123f`
 *
 * Follows ternity-desktop-electron pattern.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const projectRoot = join(import.meta.dir, "..");
const pkgPath = join(projectRoot, "package.json");
const siteDir = join(projectRoot, "site");

// --- Git version ---
const gitVersion = execSync("git describe --tags --always", {
  cwd: projectRoot,
})
  .toString()
  .trim();

const semver = gitVersion.replace(/^v/, "");

// --- Inject into package.json ---
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
const oldVersion = pkg.version;
pkg.version = semver;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
console.log(`📦 package.json: ${oldVersion} → ${semver}`);

// --- Inject into site HTML files ---
// Replaces <!-- VERSION --> placeholder and data-version attributes
const htmlFiles = readdirSync(siteDir).filter((f) => f.endsWith(".html"));

for (const file of htmlFiles) {
  const filePath = join(siteDir, file);
  let content = readFileSync(filePath, "utf-8");
  let changed = false;

  // Replace <!-- VERSION --> placeholder
  if (content.includes("<!-- VERSION -->")) {
    content = content.replace(/<!-- VERSION -->/g, gitVersion);
    changed = true;
  }

  // Replace data-version="..." attribute
  if (content.includes('data-version="')) {
    content = content.replace(
      /data-version="[^"]*"/g,
      `data-version="${gitVersion}"`
    );
    changed = true;
  }

  if (changed) {
    writeFileSync(filePath, content, "utf-8");
    console.log(`📄 ${file}: injected ${gitVersion}`);
  }
}

console.log(`\n✅ Version: ${gitVersion}`);
