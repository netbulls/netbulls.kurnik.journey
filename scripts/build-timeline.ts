#!/usr/bin/env bun

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

// ── Config ──

const CHANGELOG_SOURCES = [
  {
    repo: "netbulls.kurnik",
    label: "Product",
    url: "https://raw.githubusercontent.com/netbulls/netbulls.kurnik/main/CHANGELOG.md",
    local: resolve(import.meta.dir, "../../netbulls.kurnik/CHANGELOG.md"),
  },
  {
    repo: "netbulls.kurnik.brand",
    label: "Brand",
    url: "https://raw.githubusercontent.com/netbulls/netbulls.kurnik.brand/main/CHANGELOG.md",
    local: resolve(import.meta.dir, "../../netbulls.kurnik.brand/CHANGELOG.md"),
  },
  {
    repo: "netbulls.kurnik.journey",
    label: "Journey",
    url: "https://raw.githubusercontent.com/netbulls/netbulls.kurnik.journey/main/CHANGELOG.md",
    local: resolve(import.meta.dir, "../CHANGELOG.md"),
  },
];

const OUTPUT_PATH = resolve(import.meta.dir, "../site/timeline.html");
const TEMPLATE_PATH = resolve(import.meta.dir, "timeline-template.html");

// ── Fetch changelogs ──

async function fetchChangelogs(): Promise<string> {
  const sections: string[] = [];

  for (const source of CHANGELOG_SOURCES) {
    let content: string | null = null;

    // Try local first (sibling repos in ~/Projects/)
    if (existsSync(source.local)) {
      console.log(`📂 Reading ${source.repo} from local: ${source.local}`);
      content = readFileSync(source.local, "utf-8");
    } else {
      // Fall back to GitHub raw
      console.log(`🌐 Fetching ${source.repo} from GitHub...`);
      try {
        const res = await fetch(source.url);
        if (res.ok) {
          content = await res.text();
        } else {
          console.warn(`⚠️  Failed to fetch ${source.repo}: ${res.status}`);
        }
      } catch (e) {
        console.warn(`⚠️  Network error fetching ${source.repo}:`, e);
      }
    }

    if (content) {
      sections.push(`--- SOURCE: ${source.repo} (${source.label}) ---\n${content}`);
    }
  }

  return sections.join("\n\n");
}

// ── AI curation ──

async function curateEntries(allChangelogs: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY not set. Set it in env or .env.local");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  console.log("🤖 Sending changelogs to Claude for curation...");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are curating a public timeline for Kurnik — an AI-powered product incubator being built in public.

Below are changelogs from three repos (product, brand, journey). Select the entries that are substantial and interesting to a public audience — milestones, key decisions, launches, completed phases. Skip minor housekeeping like file renames or config fixes.

For each selected entry, output a JSON array. Each item:
{
  "timestamp": "ISO 8601 with timezone",
  "location": "City, Country",
  "title": "Short milestone title",
  "description": "1-2 sentence description of what happened and why it matters",
  "category": "brand" | "product" | "infrastructure" | "launch" | "decision",
  "icon": "single emoji"
}

Sort by timestamp descending (newest first). Output ONLY the JSON array, no markdown fences, no explanation.

---

${allChangelogs}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return text.trim();
}

// ── HTML generation ──

function generateTimelineHTML(entriesJson: string): string {
  let entries: Array<{
    timestamp: string;
    location: string;
    title: string;
    description: string;
    category: string;
    icon: string;
  }>;

  try {
    entries = JSON.parse(entriesJson);
  } catch (e) {
    console.error("❌ Failed to parse AI response as JSON:", e);
    console.error("Raw response:", entriesJson);
    process.exit(1);
  }

  console.log(`✅ ${entries.length} entries selected for timeline`);

  const template = readFileSync(TEMPLATE_PATH, "utf-8");

  const entriesHTML = entries
    .map(
      (entry) => `
    <div class="tl-entry" data-category="${entry.category}">
      <div class="tl-marker">
        <span class="tl-icon">${entry.icon}</span>
      </div>
      <div class="tl-content">
        <div class="tl-meta">
          <time datetime="${entry.timestamp}">${formatDate(entry.timestamp)}</time>
          <span class="tl-location">${entry.location}</span>
          <span class="tl-category">${entry.category}</span>
        </div>
        <h3 class="tl-title">${entry.title}</h3>
        <p class="tl-desc">${entry.description}</p>
      </div>
    </div>`
    )
    .join("\n");

  return template.replace("<!-- TIMELINE_ENTRIES -->", entriesHTML);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Main ──

async function main() {
  console.log("\n🐓 Kurnik Journey — Timeline Builder\n");

  const allChangelogs = await fetchChangelogs();
  if (!allChangelogs.trim()) {
    console.error("❌ No changelogs found");
    process.exit(1);
  }

  const curatedJson = await curateEntries(allChangelogs);
  const html = generateTimelineHTML(curatedJson);

  writeFileSync(OUTPUT_PATH, html, "utf-8");
  console.log(`\n📄 Timeline written to ${OUTPUT_PATH}`);
  console.log("Done!\n");
}

main();
