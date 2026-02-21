#!/usr/bin/env bun
/**
 * Generate site/versions/index.html — a browsable list of all frozen releases.
 *
 * Scans site/versions/ for version directories (v*), reads git tag dates,
 * and generates a styled page in the Kurnik aesthetic.
 */

import { execSync } from "child_process";
import { readdirSync, statSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const projectRoot = join(import.meta.dir, "..");
const versionsDir = join(projectRoot, "site", "versions");
const outputPath = join(versionsDir, "index.html");
const templatePath = join(import.meta.dir, "versions-template.html");

interface VersionEntry {
  version: string;
  date: string;
  isoDate: string;
  fileCount: number;
  notes: string;
}

// --- Scan version directories ---
const dirs = readdirSync(versionsDir)
  .filter((d) => d.startsWith("v") && statSync(join(versionsDir, d)).isDirectory())
  .sort((a, b) => {
    // Sort by semver descending
    const parse = (v: string) => v.replace("v", "").split(".").map(Number);
    const [aMaj, aMin, aPat] = parse(a);
    const [bMaj, bMin, bPat] = parse(b);
    return bMaj - aMaj || bMin - aMin || bPat - aPat;
  });

console.log(`Found ${dirs.length} version(s): ${dirs.join(", ")}`);

// --- Get metadata for each version ---
const entries: VersionEntry[] = dirs.map((dir) => {
  const version = dir;

  // Get tag date
  let isoDate = "";
  let date = "";
  try {
    isoDate = execSync(`git log -1 --format=%aI "${version}"`, {
      cwd: projectRoot,
    })
      .toString()
      .trim();
    date = new Date(isoDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    isoDate = new Date().toISOString();
    date = "Unknown date";
  }

  // Count files in snapshot
  const fileCount = readdirSync(join(versionsDir, dir)).filter((f) =>
    f.endsWith(".html")
  ).length;

  // Try to extract notes from CHANGELOG.md
  let notes = "";
  const changelogPath = join(projectRoot, "CHANGELOG.md");
  if (existsSync(changelogPath)) {
    const changelog = readFileSync(changelogPath, "utf-8");
    const semver = version.replace("v", "");
    const regex = new RegExp(
      `## [^\\n]*${semver.replace(/\./g, "\\.")}`
    );
    const match = changelog.match(regex);
    if (match && match.index !== undefined) {
      const start = changelog.indexOf("\n", match.index) + 1;
      const nextSection = changelog.indexOf("\n## ", start);
      const section =
        nextSection > -1
          ? changelog.slice(start, nextSection)
          : changelog.slice(start);
      // Get first meaningful line as summary
      const lines = section
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("---"));
      if (lines.length > 0) {
        // Take the ### title if present, otherwise first line
        const titleLine = lines.find((l) => l.startsWith("### "));
        notes = titleLine
          ? titleLine.replace("### ", "")
          : lines[0].replace(/^[\-\*] /, "");
      }
    }
  }

  return { version, date, isoDate, fileCount, notes };
});

// --- Generate HTML ---
const template = readFileSync(templatePath, "utf-8");

const entriesHTML = entries
  .map(
    (e, i) => `
    <a href="${e.version}/" class="ver-entry${i === 0 ? " ver-latest" : ""}">
      <div class="ver-badge">${e.version}</div>
      <div class="ver-info">
        <div class="ver-meta">
          <time datetime="${e.isoDate}">${e.date}</time>
          <span class="ver-files">${e.fileCount} page${e.fileCount !== 1 ? "s" : ""}</span>
          ${i === 0 ? '<span class="ver-tag">latest</span>' : ""}
        </div>
        ${e.notes ? `<p class="ver-notes">${e.notes}</p>` : ""}
      </div>
      <span class="ver-arrow">&rarr;</span>
    </a>`
  )
  .join("\n");

const html = template.replace("<!-- VERSION_ENTRIES -->", entriesHTML);
writeFileSync(outputPath, html, "utf-8");
console.log(`Version browser written to ${outputPath}`);
