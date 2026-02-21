#!/usr/bin/env bun
/**
 * Draft and post milestone tweets for Kurnik.
 *
 * Three modes:
 *   bun run tweet draft "0.1.0" "notes"                        — drafts via Claude, prints to stdout, exits 2
 *   bun run tweet post  "0.1.0" "tweet text"                   — posts from @erace, no prompts
 *   bun run tweet quote "https://x.com/.../status/123" "text"  — quote-tweets from @kurnik_ai
 *
 * Requires:
 *   ANTHROPIC_API_KEY — for drafting
 *   X_PERSONAL_API_KEY, X_PERSONAL_API_SECRET,
 *   X_PERSONAL_ACCESS_TOKEN, X_PERSONAL_ACCESS_SECRET — for posting from @erace
 *   X_KURNIK_API_KEY, X_KURNIK_API_SECRET,
 *   X_KURNIK_ACCESS_TOKEN, X_KURNIK_ACCESS_SECRET — for posting from @kurnik_ai
 */

import Anthropic from "@anthropic-ai/sdk";
import { createHmac, randomBytes } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

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

interface XCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
  handle: string;
}

function getPersonalCredentials(): XCredentials {
  return {
    apiKey: requireEnv("X_PERSONAL_API_KEY"),
    apiSecret: requireEnv("X_PERSONAL_API_SECRET"),
    accessToken: requireEnv("X_PERSONAL_ACCESS_TOKEN"),
    accessSecret: requireEnv("X_PERSONAL_ACCESS_SECRET"),
    handle: PERSONAL_HANDLE,
  };
}

function getKurnikCredentials(): XCredentials {
  return {
    apiKey: requireEnv("X_KURNIK_API_KEY"),
    apiSecret: requireEnv("X_KURNIK_API_SECRET"),
    accessToken: requireEnv("X_KURNIK_ACCESS_TOKEN"),
    accessSecret: requireEnv("X_KURNIK_ACCESS_SECRET"),
    handle: KURNIK_HANDLE,
  };
}

async function postTweet(
  text: string,
  creds: XCredentials,
  quoteTweetId?: string
): Promise<{ id: string; url: string }> {
  const url = "https://api.x.com/2/tweets";
  const method = "POST";

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    creds.apiSecret,
    creds.accessSecret
  );
  oauthParams.oauth_signature = signature;

  const authHeader =
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(", ");

  const body: Record<string, unknown> = { text };
  if (quoteTweetId) {
    body.quote_tweet_id = quoteTweetId;
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`X API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const tweetId = data.data.id;
  return {
    id: tweetId,
    url: `https://x.com/${creds.handle}/status/${tweetId}`,
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

// ── Get latest changelog entry ──

function getLatestChangelog(): { version: string; notes: string } {
  const changelogPath = resolve(import.meta.dir, "../CHANGELOG.md");
  const content = readFileSync(changelogPath, "utf-8");

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

  const versionMatch = match[0].match(/v?(\d+\.\d+\.\d+)/);
  const version = versionMatch ? versionMatch[1] : "latest";

  return { version, notes };
}

// ── Commands ──

async function cmdDraft(version: string, notes: string) {
  console.log("\n🐓 Kurnik — Tweet Drafter\n");
  console.log(`Version: v${version}`);
  console.log(`Notes: ${notes}\n`);

  console.log("🤖 Drafting tweet...\n");
  const drafts = await draftTweet(version, notes);

  console.log("━".repeat(60));
  console.log(`\n📱 @${PERSONAL_HANDLE} (personal):\n`);
  console.log(`  ${drafts.personal}`);
  console.log(`  (${drafts.personal.length}/280 chars)\n`);
  console.log(`💬 @${KURNIK_HANDLE} (quote-tweet):\n`);
  console.log(`  ${drafts.kurnikQuote}\n`);
  console.log("━".repeat(60));

  console.log(`\nTo post, run:`);
  console.log(`  bun run tweet post "${version}" "${drafts.personal.replace(/"/g, '\\"')}"\n`);

  process.exit(2); // awaiting approval
}

async function cmdPost(version: string, text: string) {
  console.log("\n📤 Posting to @" + PERSONAL_HANDLE + "...\n");

  const result = await postTweet(text, getPersonalCredentials());
  console.log(`✅ Posted! ${result.url}\n`);
  console.log(`Now quote-tweet from @${KURNIK_HANDLE}:`);
  console.log(`  bun run tweet quote "${result.url}" "your quote text"\n`);
}

async function cmdQuote(tweetUrl: string, text: string) {
  const tweetIdMatch = tweetUrl.match(/status\/(\d+)/);
  if (!tweetIdMatch) {
    console.error("❌ Invalid tweet URL — expected https://x.com/.../status/123456");
    process.exit(1);
  }
  const quoteTweetId = tweetIdMatch[1];

  console.log(`\n📤 Quote-tweeting from @${KURNIK_HANDLE}...\n`);
  console.log(`  Quoting: ${tweetUrl}`);
  console.log(`  Text: ${text}\n`);

  const result = await postTweet(text, getKurnikCredentials(), quoteTweetId);
  console.log(`✅ Posted! ${result.url}\n`);
}

// ── Main ──

async function main() {
  const mode = process.argv[2];

  if (mode === "draft") {
    let version = process.argv[3] || "";
    let notes = process.argv[4] || "";

    if (!version || !notes) {
      const latest = getLatestChangelog();
      version = version || latest.version;
      notes = notes || latest.notes;
    }

    await cmdDraft(version, notes);
  } else if (mode === "post") {
    const version = process.argv[3] || "";
    const text = process.argv[4] || "";

    if (!text) {
      console.error("Usage: bun run tweet post <version> <tweet text>");
      process.exit(1);
    }

    await cmdPost(version, text);
  } else if (mode === "quote") {
    const tweetUrl = process.argv[3] || "";
    const text = process.argv[4] || "";

    if (!tweetUrl || !text) {
      console.error('Usage: bun run tweet quote "https://x.com/.../status/123" "quote text"');
      process.exit(1);
    }

    await cmdQuote(tweetUrl, text);
  } else {
    console.error("Usage:");
    console.error('  bun run tweet draft "0.1.0" "release notes"');
    console.error('  bun run tweet post  "0.1.0" "exact tweet text"');
    console.error('  bun run tweet quote "https://x.com/.../status/123" "quote text"');
    process.exit(1);
  }
}

main();
