import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const root = new URL("..", import.meta.url);
const sourcePath = new URL("../crawler/sources.json", import.meta.url);
const generatedPath = new URL("../crawler/generated-assets.json", import.meta.url);
const reportPath = new URL("../crawl-report.json", import.meta.url);

const sources = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const now = new Date().toISOString();
const errors = [];

function slug(value) {
  return String(value || "pwc-source")
    .toLowerCase()
    .replace(/https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function compact(value) {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

function extractTag(html, pattern) {
  const match = html.match(pattern);
  return compact(match?.[1] || "");
}

function stripHtml(html) {
  return compact(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function titleFromUrl(url) {
  const parsed = new URL(url);
  const last = path.basename(parsed.pathname).replace(/\.[a-z0-9]+$/i, "");
  return compact(last.replace(/[-_]+/g, " ")).replace(/\b\w/g, (char) => char.toUpperCase()) || parsed.hostname;
}

function contentFormat(url, contentType, title) {
  if (/pdf/i.test(contentType) || /\.pdf($|\?)/i.test(url)) return "PDF report";
  if (/survey|barometer|report|research/i.test(title)) return "Research report";
  if (/services/i.test(url)) return "Service page";
  return "Insight page";
}

function sourceType(format) {
  if (format === "PDF report" || format === "Research report") return "PwC research report";
  if (format === "Service page") return "PwC services page";
  return "PwC insight page";
}

function inferTopic(title, text) {
  const combined = `${title} ${text}`.toLowerCase();
  if (combined.includes("financial services")) return "Financial Services AI";
  if (combined.includes("technology") || combined.includes("telecom") || combined.includes("tmt")) return "TMT AI";
  if (combined.includes("responsible") || combined.includes("trust") || combined.includes("assurance")) return "AI assurance and trust";
  if (combined.includes("jobs") || combined.includes("skills") || combined.includes("workforce")) return "Workforce and AI";
  if (combined.includes("ceo")) return "AI transformation";
  return "Human Scale AI";
}

function inferAudience(title, text) {
  const combined = `${title} ${text}`.toLowerCase();
  const roles = [];
  if (combined.includes("ceo") || combined.includes("chief executive")) roles.push("CEO");
  if (combined.includes("cfo") || combined.includes("finance")) roles.push("CFO");
  if (combined.includes("technology") || combined.includes("cio") || combined.includes("cto")) roles.push("CIO / CTO");
  if (combined.includes("workforce") || combined.includes("skills") || combined.includes("chro")) roles.push("CHRO");
  if (combined.includes("risk") || combined.includes("governance") || combined.includes("assurance")) roles.push("Risk leader");
  return roles.length ? [...new Set(roles)] : ["CEO", "CIO / CTO"];
}

function extractProofPoints(text) {
  const sentences = compact(text)
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.length > 48 && sentence.length < 260);
  const proofy = sentences.filter((sentence) => /\b\d+[,.]?\d*\b|%|percent|survey|research|report|barometer|CEO|AI|productivity|skills|trust/i.test(sentence));
  return [...new Set(proofy)].slice(0, 4);
}

function summaryFrom(text, fallback) {
  const sentences = compact(text)
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.length > 40);
  return sentences.slice(0, 2).join(" ").slice(0, 420) || fallback;
}

async function fetchSource(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "PwC Partner Narrative Kits source refresh prototype (+approved public URLs only)",
        accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
      },
    });
    const contentType = response.headers.get("content-type") || "";
    const finalUrl = response.url || url;
    const bytes = await response.arrayBuffer();
    const body = Buffer.from(bytes);
    return { response, contentType, finalUrl, body };
  } finally {
    clearTimeout(timer);
  }
}

function assetFromHtml(url, source, html, contentType, finalUrl) {
  const title = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || extractTag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || titleFromUrl(finalUrl);
  const description = extractTag(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) || extractTag(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const rawText = stripHtml(html).slice(0, 12000);
  const format = contentFormat(finalUrl, contentType, title);
  const primaryTopic = inferTopic(title, rawText);
  const proofPoints = extractProofPoints(rawText);
  const id = `pwc-${slug(finalUrl)}-${crypto.createHash("sha1").update(finalUrl).digest("hex").slice(0, 8)}`;
  return {
    id,
    title,
    url: finalUrl,
    canonical_url: finalUrl,
    source_group: source.id,
    source_type: sourceType(format),
    platform: new URL(finalUrl).hostname.replace(/^www\./, ""),
    format,
    language: "English",
    region: finalUrl.includes("/uk/") ? "UK" : "Global",
    published_date: null,
    last_seen_date: now.slice(0, 10),
    last_crawled_date: now.slice(0, 10),
    raw_text: rawText,
    summary: description || summaryFrom(rawText, `Candidate source from ${source.label}.`),
    primary_topic: primaryTopic,
    secondary_topics: ["Human Scale AI"].filter((topic) => topic !== primaryTopic),
    audience: inferAudience(title, rawText),
    business_area: "Artificial intelligence",
    funnel_stage: proofPoints.length >= 2 ? "Proof" : "Thought leadership",
    key_claims: proofPoints.slice(0, 3),
    proof_points: proofPoints.length ? proofPoints : [description || `Approved public PwC source: ${title}`],
    suggested_use: "Review and approve before using in partner narrative kits.",
    suggested_sales_enablement_use: "Candidate proof source for partner-facing AI narratives after marketing review.",
    related_asset_ids: [],
    ai_confidence_score: 0.72,
    metadata_status: "Needs review",
    content_usefulness: "Candidate proof source",
    url_status: "Accessible",
  };
}

function assetFromPdf(url, source, contentType, finalUrl, status) {
  const title = titleFromUrl(finalUrl);
  const id = `pwc-${slug(finalUrl)}-${crypto.createHash("sha1").update(finalUrl).digest("hex").slice(0, 8)}`;
  return {
    id,
    title,
    url: finalUrl,
    canonical_url: finalUrl,
    source_group: source.id,
    source_type: "PwC research report",
    platform: new URL(finalUrl).hostname.replace(/^www\./, ""),
    format: "PDF report",
    language: "English",
    region: "Global",
    published_date: null,
    last_seen_date: now.slice(0, 10),
    last_crawled_date: now.slice(0, 10),
    raw_text: "PDF reached by source refresh. Text extraction requires an approved PDF parser before partner use.",
    summary: `Candidate PwC PDF source requiring text extraction and marketing approval: ${title}.`,
    primary_topic: inferTopic(title, ""),
    secondary_topics: ["Human Scale AI"],
    audience: inferAudience(title, ""),
    business_area: "Artificial intelligence",
    funnel_stage: "Proof",
    key_claims: [],
    proof_points: [`PDF source was reachable with HTTP ${status}. Text extraction pending.`],
    suggested_use: "Do not use directly in partner kits until PDF text and claims are extracted and approved.",
    suggested_sales_enablement_use: "Candidate source for human review.",
    related_asset_ids: [],
    ai_confidence_score: 0.45,
    metadata_status: "Needs review",
    content_usefulness: "Candidate proof source",
    url_status: status >= 200 && status < 400 ? "Accessible" : "Needs review",
    extraction_note: "PDF content is not parsed by this dependency-free crawler.",
  };
}

const enabledSources = sources.sources.filter((source) => source.enabled !== false);
const urls = enabledSources.flatMap((source) => source.urls.map((url) => ({ source, url })));
const assets = [];
let fetchedPageCount = 0;

for (const { source, url } of urls) {
  try {
    const { response, contentType, finalUrl, body } = await fetchSource(url);
    const status = response.status;
    if (!response.ok) {
      errors.push({ url, status, message: response.statusText });
      assets.push(assetFromPdf(url, source, contentType, finalUrl, status));
      continue;
    }

    if (/pdf/i.test(contentType) || /\.pdf($|\?)/i.test(finalUrl)) {
      assets.push(assetFromPdf(url, source, contentType, finalUrl, status));
    } else {
      const html = body.toString("utf8");
      assets.push(assetFromHtml(url, source, html, contentType, finalUrl));
    }
    fetchedPageCount += 1;
  } catch (error) {
    errors.push({ url, message: error.message });
  }
}

const generated = {
  generatedAt: now,
  sourceGroupCount: enabledSources.length,
  seedUrlCount: urls.length,
  assets,
};

const report = {
  lastRunAt: now,
  seedUrlCount: urls.length,
  discoveredUrlCount: 0,
  fetchedPageCount,
  assetCount: assets.length,
  newCandidateCount: assets.length,
  notes: [
    "Source refresh fetches approved public PwC URLs from crawler/sources.json.",
    "Generated assets are candidates for marketing review, not auto-approved partner kit sources.",
    "No public profile scraping or unapproved social monitoring is configured.",
    "PDF URLs are checked for availability but require a PDF text extraction step before claims can be used.",
  ],
  errors,
};

await fs.mkdir(new URL("../crawler", import.meta.url), { recursive: true });
await fs.writeFile(generatedPath, `${JSON.stringify(generated, null, 2)}\n`);
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify(report, null, 2));
