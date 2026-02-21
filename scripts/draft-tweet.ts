#!/usr/bin/env bun
/**
 * Draft and post a milestone tweet for Kurnik.
 *
 * Flow:
 *   1. Takes version + changelog notes as input
 *   2. Sends to Claude to draft a tweet
 *   3. Prints draft for approval
 *   4. On approval, posts via X API from @erace
 *   5. Prints URL for @kurnik_ai to manually quote-tweet
 *
 * Usage:
 *   bun run scripts/draft-tweet.ts "0.1.0" "Journey site launched with timeline"
 *   bun run scripts/draft-tweet.ts  (interactive — reads from latest CHANGELOG entry)
 *
 * Requires:
 *   ANTHROPIC_API_KEY — for drafting
 *   X_PERSONAL_API_KEY, X_PERSONAL_API_SECRET,
 *   X_PERSONAL_ACCESS_TOKEN, X_PERSONAL_ACCESS_SECRET — for posting
 */

import Anthropic from "@anthropic-ai/sdk";
import { createHmac, randomBytes } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";
import { createInterface } from "readline";

// ── Config ──

const PERSONAL_HANDLE = "erace";
const KURNIK_HANDLE = "kurnik_ai";
const JOURNEY_URL = "https://journey.kurnik.ai";

// ── Read env ──

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`❌ Missing env: ${key}`);
    process.exit(1);
  }
  return val;
}

// ── OAuth 1.0a signing ──

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(sortedParams),
  ].join("&");

  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  return createHmac("sha1", signingKey).update(baseString).digest("base64");
}

async function postTweet(text: string): Promise<{ id: string; url: string }> {
  const apiKey = requireEnv("X_PERSONAL_API_KEY");
  const apiSecret = requireEnv("X_PERSONAL_API_SECRET");
  const accessToken = requireEnv("X_PERSONAL_ACCESS_TOKEN");
  const accessSecret = requireEnv("X_PERSONAL_ACCESS_SECRET");

  const url = "https://api.x.com/2/tweets";
  const method = "POST";

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    apiSecret,
    accessSecret
  );
  oauthParams.oauth_signature = signature;

  const authHeader =
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(", ");

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`X API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const tweetId = data.data.id;
  return {
    id: tweetId,
    url: `https://x.com/${PERSONAL_HANDLE}/status/${tweetId}`,
  };
}

// ── AI drafting ──

async function draftTweet(
  version: string,
  notes: string
): Promise<{ personal: string; kurnikQuote: string }> {
  const apiKey = requireEnv("ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Draft a tweet for a founder building an AI product in public.

Context:
- Product: Kurnik — AI-powered product incubator ("where ideas come home to roost")
- Poster: @${PERSONAL_HANDLE} (founder, director-level, authentic voice)
- Version: v${version}
- What happened: ${notes}
- Journey URL: ${JOURNEY_URL}

Rules:
- Max 280 characters for the personal tweet
- Authentic founder voice, not corporate marketing
- Include the journey URL naturally
- No hashtag spam (1 max, or none)
- Brief, punchy, honest about the process

Also draft a short quote-tweet for @${KURNIK_HANDLE} (the product account) that would quote the personal tweet. Keep it product-focused, 1-2 lines max.

Respond ONLY as JSON, no markdown fences:
{
  "personal": "the tweet text",
  "kurnikQuote": "the quote tweet text"
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text.trim());
}

// ── Interactive prompt ──

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ── Get latest changelog entry ──

function getLatestChangelog(): { version: string; notes: string } {
  const changelogPath = resolve(import.meta.dir, "../CHANGELOG.md");
  const content = readFileSync(changelogPath, "utf-8");

  // Find first ## heading and extract content until next ##
  const match = content.match(/^## .+$/m);
  if (!match || match.index === undefined) {
    return { version: "unknown", notes: "New milestone" };
  }

  const start = match.index + match[0].length;
  const nextSection = content.indexOf("\n## ", start);
  const section =
    nextSection > -1 ? content.slice(start, nextSection) : content.slice(start);

  const notes = section
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("---"))
    .join(". ");

  // Try to extract version from heading
  const versionMatch = match[0].match(/v?(\d+\.\d+\.\d+)/);
  const version = versionMatch ? versionMatch[1] : "latest";

  return { version, notes };
}

// ── Main ──

async function main() {
  console.log("\n🐓 Kurnik — Tweet Drafter\n");

  // Get version + notes from args or changelog
  let version = process.argv[2] || "";
  let notes = process.argv[3] || "";

  if (!version || !notes) {
    console.log("Reading from CHANGELOG.md...\n");
    const latest = getLatestChangelog();
    version = version || latest.version;
    notes = notes || latest.notes;
  }

  console.log(`Version: v${version}`);
  console.log(`Notes: ${notes}\n`);

  // Draft
  console.log("🤖 Drafting tweet...\n");
  const drafts = await draftTweet(version, notes);

  // Show drafts
  console.log("━".repeat(60));
  console.log(`\n📱 @${PERSONAL_HANDLE} (personal):\n`);
  console.log(`  ${drafts.personal}`);
  console.log(`  (${drafts.personal.length}/280 chars)\n`);
  console.log(`💬 @${KURNIK_HANDLE} (quote-tweet):\n`);
  console.log(`  ${drafts.kurnikQuote}\n`);
  console.log("━".repeat(60));

  // Approve
  const answer = await ask("\nPost to @" + PERSONAL_HANDLE + "? [y/N/edit] ");

  let finalText = drafts.personal;

  if (answer.toLowerCase() === "edit") {
    finalText = await ask("Enter your tweet: ");
  } else if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
    console.log("\n⏭️  Skipped. No tweet posted.\n");
    return;
  }

  // Post
  console.log("\n📤 Posting...\n");
  try {
    const result = await postTweet(finalText);
    console.log(`✅ Posted! ${result.url}\n`);
    console.log(`Now quote-tweet from @${KURNIK_HANDLE}:`);
    console.log(`  1. Log into @${KURNIK_HANDLE}`);
    console.log(`  2. Quote: ${result.url}`);
    console.log(`  3. Text: ${drafts.kurnikQuote}\n`);
  } catch (err) {
    console.error(`\n❌ Failed to post:`, err);
    console.log(`\nManual fallback — copy and post yourself:\n`);
    console.log(finalText);
  }
}

main();
