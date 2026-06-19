import fs from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE_PATH = new URL("../crawler/sources.json", import.meta.url);
const TECHNOLOGY_DIR = new URL("../crawler/technology/", import.meta.url);
const GENERATED_PATH = new URL("../crawler/technology/generated-assets.json", import.meta.url);
const GRAPH_PATH = new URL("../crawler/technology/link-graph.json", import.meta.url);
const REPORT_PATH = new URL("../crawler/technology/crawl-report.json", import.meta.url);
const ROOT_REPORT_PATH = new URL("../crawl-report.json", import.meta.url);

const DEFAULT_START_URL = "https://www.pwc.com/gx/en/issues/technology.html";
const DEFAULT_MAX_PAGES = Number.parseInt(process.env.MAX_PAGES || "80", 10);
const DEFAULT_MAX_DEPTH = Number.parseInt(process.env.MAX_DEPTH || "4", 10);
const REQUEST_DELAY_MS = Number.parseInt(process.env.REQUEST_DELAY_MS || "500", 10);
const FETCH_MODE = process.env.FETCH_MODE || "auto";
const now = new Date().toISOString();

let browserModulePromise = null;
let browserPromise = null;
let browserContextPromise = null;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function hash(value, length = 10) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, length);
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#x27;/g, "'");
}

function compact(value) {
  return decodeEntities(String(value || ""))
    .replace(/\u00a0/g, " ")
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripHash(url) {
  const parsed = new URL(url);
  parsed.hash = "";
  return parsed.toString();
}

function normaliseUrl(href, baseUrl) {
  if (!href) return null;
  const trimmed = href.trim();
  if (/^(mailto|tel|javascript|data):/i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed, baseUrl);
    parsed.hash = "";
    parsed.searchParams.delete("utm_source");
    parsed.searchParams.delete("utm_medium");
    parsed.searchParams.delete("utm_campaign");
    return parsed.toString();
  } catch {
    return null;
  }
}

function extensionOf(url) {
  const pathname = new URL(url).pathname.toLowerCase();
  const match = pathname.match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "html";
}

function isHtmlLike(url, contentType = "") {
  const ext = extensionOf(url);
  return /html|text\/plain/i.test(contentType) || ["html", "htm", ""].includes(ext);
}

function isPdfLike(url, contentType = "") {
  return /pdf/i.test(contentType) || extensionOf(url) === "pdf";
}

function inTechnologyScope(url) {
  const parsed = new URL(url);
  if (parsed.hostname !== "www.pwc.com") return false;
  const pathname = parsed.pathname.replace(/\/$/, "");
  return pathname === "/gx/en/issues/technology" || pathname === "/gx/en/issues/technology.html" || pathname.startsWith("/gx/en/issues/technology/");
}

function shouldCrawl(url) {
  if (!inTechnologyScope(url)) return false;
  const ext = extensionOf(url);
  return ["html", "htm"].includes(ext) || !url.match(/\.[a-z0-9]+($|\?)/i);
}

function shouldRecordAsset(url) {
  if (!inTechnologyScope(url)) return false;
  return ["pdf", "html", "htm"].includes(extensionOf(url));
}

function extractMeta(html, names) {
  for (const name of names) {
    const patterns = [
      new RegExp(`<meta[^>]+name=["']${escapeRegex(name)}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+property=["']${escapeRegex(name)}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${escapeRegex(name)}["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${escapeRegex(name)}["'][^>]*>`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return compact(match[1]);
    }
  }
  return "";
}

function cleanInline(html) {
  return compact(html.replace(/<[^>]+>/g, " "));
}

function titleFromUrl(url) {
  const last = new URL(url).pathname.split("/").filter(Boolean).pop() || "technology";
  return compact(last.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ")).replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractTitle(html, fallbackUrl) {
  const og = extractMeta(html, ["og:title", "twitter:title"]);
  if (og) return og.replace(/\s*\|\s*PwC\s*$/i, "");
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return cleanInline(h1);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (title) return cleanInline(title).replace(/\s*\|\s*PwC\s*$/i, "");
  return titleFromUrl(fallbackUrl);
}

function withoutNoiseBlocks(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<form[\s\S]*?<\/form>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ");
}

function mainHtml(html) {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
  const main = body.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  let candidate = main || body;
  candidate = withoutNoiseBlocks(candidate);
  candidate = candidate.replace(/<[^>]+(?:class|id)=["'][^"']*(?:menu|navigation|nav|breadcrumb|footer|header|cookie|search|modal|social|share|contact-card|newsletter|skip)[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi, " ");
  candidate = candidate.replace(/Closed captions settings[\s\S]{0,2500}?Playback of this video is not currently available/gi, " ");
  return candidate;
}

function textFromHtml(html) {
  const withBreaks = html
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n");
  return compact(withBreaks.replace(/<[^>]+>/g, " "));
}

function removeRepeatedChrome(text) {
  const markers = [
    "Loading Results No Match Found View All Results",
    "Skip to content Skip to footer",
    "Industries Services Issues About us Careers",
  ];
  let cleaned = text;
  for (const marker of markers) {
    const index = cleaned.indexOf(marker);
    if (index >= 0) cleaned = cleaned.slice(index + marker.length);
  }
  const contactIndex = cleaned.search(/\n?Contact us\b/i);
  if (contactIndex > 1500) cleaned = cleaned.slice(0, contactIndex);
  const legalIndex = cleaned.search(/©\s*20\d{2}|All rights reserved|Legal notices/i);
  if (legalIndex > 0) cleaned = cleaned.slice(0, legalIndex);
  return compact(cleaned);
}

function extractCleanText(html) {
  return removeRepeatedChrome(textFromHtml(mainHtml(html)));
}

function extractHeadings(html) {
  const headings = [];
  const source = mainHtml(html);
  const pattern = /<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = pattern.exec(source))) {
    const value = cleanInline(match[2]);
    if (value && !/menu|contact us|closed captions|font size/i.test(value)) headings.push({ level: match[1].toLowerCase(), text: value });
  }
  return headings.slice(0, 30);
}

function extractLinks(html, baseUrl) {
  const source = mainHtml(html);
  const links = [];
  const pattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(source))) {
    const url = normaliseUrl(match[1], baseUrl);
    const label = cleanInline(match[2]);
    if (!url || !label || /^(share|email|copy link|hide)$/i.test(label)) continue;
    links.push({ url, label });
  }
  const deduped = new Map();
  for (const link of links) {
    if (!deduped.has(link.url)) deduped.set(link.url, link);
  }
  return [...deduped.values()];
}

function extractPublishDate(html, text) {
  const meta = extractMeta(html, ["article:published_time", "date", "dcterms.date", "publishdate", "published-date"]);
  if (meta) return normaliseDate(meta);
  const time = html.match(/<time[^>]+datetime=["']([^"']+)["'][^>]*>/i)?.[1];
  if (time) return normaliseDate(time);
  const patterns = [
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\b/i,
    /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return normaliseDate(match[0]);
  }
  return null;
}

function normaliseDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).trim();
  return parsed.toISOString().slice(0, 10);
}

function sentences(text) {
  return compact(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 45 && sentence.length <= 300)
    .filter((sentence) => !/^(menu|industries|services|issues|about us|careers|closed captions|font size|share|copy link)/i.test(sentence));
}

function extractProofPoints(text) {
  const proofy = sentences(text).filter((sentence) => /\b\d+(?:\.\d+)?\s?x\b|\b\d+(?:\.\d+)?%|\b\d{3,}\b|survey|study|research|report|leaders|companies|CEOs|respondents|higher|lower|increase|decrease|growth|productivity|value/i.test(sentence));
  return uniq(proofy).slice(0, 8);
}

function extractQuotes(html, text) {
  const quotes = [];
  const pattern = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
  let match;
  while ((match = pattern.exec(mainHtml(html)))) {
    const quote = cleanInline(match[1]);
    if (quote.length > 20) quotes.push(quote);
  }
  const lineQuotes = text.match(/[“"][^”"]{40,220}[”"]/g) || [];
  return uniq([...quotes, ...lineQuotes.map((quote) => quote.replace(/^“|”$/g, ""))]).slice(0, 6);
}

function inferThemes(text, title = "") {
  const combined = `${title} ${text}`.toLowerCase();
  const themes = [];
  const checks = [
    ["AI", /\bai\b|artificial intelligence|agentic|generative/i],
    ["Data and cloud", /data|cloud|infrastructure|platform/i],
    ["Cybersecurity", /cyber|security|threat|resilien/i],
    ["Emerging tech", /emerging tech|quantum|blockchain|metaverse|automation|robot/i],
    ["Trust and governance", /trust|governance|responsible|assurance|risk|controls|ethics/i],
    ["Transformation", /reinvention|transformation|productivity|growth|value/i],
    ["Leadership", /leader|ceo|c-suite|board|executive/i],
    ["Workforce", /workforce|skills|people|talent|jobs|workers/i],
  ];
  for (const [label, regex] of checks) if (regex.test(combined)) themes.push(label);
  return themes.length ? themes : ["AI, data and tech"];
}

function inferAudience(text, title = "") {
  const combined = `${title} ${text}`.toLowerCase();
  const roles = [];
  if (/ceo|chief executive|c-suite|executive|board/.test(combined)) roles.push("CEO");
  if (/cfo|finance|roi|value|cost/.test(combined)) roles.push("CFO");
  if (/cio|cto|technology|cloud|data|platform|infrastructure/.test(combined)) roles.push("CIO / CTO");
  if (/chro|workforce|skills|people|jobs|talent/.test(combined)) roles.push("CHRO");
  if (/risk|trust|governance|security|cyber|assurance|compliance/.test(combined)) roles.push("Risk leader");
  return uniq(roles).slice(0, 6);
}

function classifyAsset(url, contentType, title, text) {
  if (isPdfLike(url, contentType)) return "PDF report";
  if (/video|episode|ted|encounters/i.test(title) || /Video\b/.test(text.slice(0, 1500))) return "Video / episode";
  if (/survey|study|report|barometer|agenda|insight/i.test(title)) return "Insight / report";
  if (url.endsWith("technology.html")) return "Hub page";
  return "Article / landing page";
}

function summaryFrom(text, description) {
  if (description) return description;
  const first = sentences(text).slice(0, 2).join(" ");
  return first.slice(0, 520);
}

function readingMinutes(text) {
  const words = compact(text).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function htmlAsset({ finalUrl, html, contentType, depth, parentUrl, linkLabel, fetchMode }) {
  const cleanText = extractCleanText(html);
  const title = extractTitle(html, finalUrl);
  const description = extractMeta(html, ["description", "og:description", "twitter:description"]);
  const publishDate = extractPublishDate(html, cleanText);
  const links = extractLinks(html, finalUrl);
  const headings = extractHeadings(html);
  return {
    id: `pwc-tech-${hash(finalUrl)}`,
    title,
    url: finalUrl,
    canonical_url: extractMeta(html, ["og:url"]) || finalUrl,
    parent_url: parentUrl || null,
    link_label: linkLabel || null,
    crawl_depth: depth,
    fetch_mode: fetchMode,
    source_group: "pwc-technology-hub",
    source_type: "PwC technology content",
    platform: new URL(finalUrl).hostname.replace(/^www\./, ""),
    format: classifyAsset(finalUrl, contentType, title, cleanText),
    language: "English",
    region: finalUrl.includes("/uk/") ? "UK" : "Global",
    published_date: publishDate,
    last_seen_date: now.slice(0, 10),
    last_crawled_date: now.slice(0, 10),
    reading_minutes: readingMinutes(cleanText),
    summary: summaryFrom(cleanText, description),
    primary_topic: inferThemes(cleanText, title)[0],
    themes: inferThemes(cleanText, title),
    audience: inferAudience(cleanText, title),
    headings,
    key_claims: extractProofPoints(cleanText).slice(0, 4),
    proof_points: extractProofPoints(cleanText),
    quotes: extractQuotes(html, cleanText),
    outbound_links: links.filter((link) => shouldRecordAsset(link.url)).slice(0, 80),
    related_offsite_links: links.filter((link) => !inTechnologyScope(link.url)).slice(0, 40),
    body_text: cleanText.slice(0, 18000),
    raw_text: cleanText.slice(0, 18000),
    metadata_status: "Needs review",
    approval_status: "Candidate - requires marketing review",
    suggested_use: "Review extracted proof and narrative fit before adding to partner kits.",
    url_status: "Accessible",
  };
}

function pdfAsset({ finalUrl, contentType, status, depth, parentUrl, linkLabel, fetchMode }) {
  const title = titleFromUrl(finalUrl);
  return {
    id: `pwc-tech-${hash(finalUrl)}`,
    title,
    url: finalUrl,
    canonical_url: finalUrl,
    parent_url: parentUrl || null,
    link_label: linkLabel || null,
    crawl_depth: depth,
    fetch_mode: fetchMode,
    source_group: "pwc-technology-hub",
    source_type: "PwC technology content",
    platform: new URL(finalUrl).hostname.replace(/^www\./, ""),
    format: "PDF report",
    language: "English",
    region: "Global",
    published_date: null,
    last_seen_date: now.slice(0, 10),
    last_crawled_date: now.slice(0, 10),
    summary: `PDF candidate discovered from PwC's AI, data and tech hub: ${title}.`,
    primary_topic: inferThemes(title)[0],
    themes: inferThemes(title),
    audience: inferAudience(title),
    headings: [],
    key_claims: [],
    proof_points: [`PDF reached with HTTP ${status}. Text extraction pending.`],
    quotes: [],
    outbound_links: [],
    related_offsite_links: [],
    body_text: "PDF reached by technology crawler. Add PDF text extraction before using claims in partner kits.",
    raw_text: "PDF reached by technology crawler. Add PDF text extraction before using claims in partner kits.",
    metadata_status: "Needs review",
    approval_status: "Candidate - PDF text extraction pending",
    extraction_note: "PDF parsing is not enabled in this dependency-free crawler.",
    url_status: status >= 200 && status < 400 ? "Accessible" : "Needs review",
    content_type: contentType,
  };
}

async function nodeFetchSource(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7",
        "accept-language": "en-GB,en;q=0.9",
        "cache-control": "no-cache",
      },
    });
    const body = Buffer.from(await response.arrayBuffer());
    return {
      response: { status: response.status, ok: response.ok, statusText: response.statusText },
      finalUrl: stripHash(response.url || url),
      contentType: response.headers.get("content-type") || "",
      body,
      fetchMode: "node",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function playwrightModule() {
  browserModulePromise ||= import("playwright");
  return browserModulePromise;
}

async function browserContext() {
  if (!browserPromise) {
    const { chromium } = await playwrightModule();
    browserPromise = chromium.launch({ headless: true });
  }
  if (!browserContextPromise) {
    const browser = await browserPromise;
    browserContextPromise = browser.newContext({
      viewport: { width: 1440, height: 1400 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      extraHTTPHeaders: {
        "accept-language": "en-GB,en;q=0.9",
        "upgrade-insecure-requests": "1",
      },
    });
  }
  return browserContextPromise;
}

async function browserFetchSource(url) {
  if (isPdfLike(url)) return nodeFetchSource(url);
  const context = await browserContext();
  const page = await context.newPage();
  try {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
    const status = response?.status() || 0;
    const headers = response?.headers() || {};
    const html = await page.content();
    return {
      response: { status, ok: status >= 200 && status < 400, statusText: response?.statusText() || "" },
      finalUrl: stripHash(page.url() || url),
      contentType: headers["content-type"] || "text/html",
      body: Buffer.from(html, "utf8"),
      fetchMode: "browser",
    };
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function fetchSource(url) {
  if (FETCH_MODE === "node") return nodeFetchSource(url);
  if (FETCH_MODE === "browser") return browserFetchSource(url);
  try {
    const browserResult = await browserFetchSource(url);
    if (browserResult.response.ok || browserResult.response.status !== 403) return browserResult;
  } catch (error) {
    if (!/Cannot find package|playwright/i.test(error.message)) throw error;
  }
  return nodeFetchSource(url);
}

async function closeBrowser() {
  if (browserContextPromise) {
    const context = await browserContextPromise;
    await context.close().catch(() => undefined);
  }
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close().catch(() => undefined);
  }
}

function seedUrlsFromSources(config) {
  const enabled = (config.sources || []).filter((source) => source.enabled !== false);
  const urls = [];
  for (const source of enabled) {
    const sourceUrls = source.urls || source.start_urls || source.startUrls || [];
    for (const url of sourceUrls) urls.push(url);
  }
  return urls.length ? urls : [DEFAULT_START_URL];
}

async function crawl() {
  let sourceConfig = { sources: [{ id: "pwc-technology-hub", urls: [DEFAULT_START_URL], enabled: true }] };
  try {
    sourceConfig = JSON.parse(await fs.readFile(SOURCE_PATH, "utf8"));
  } catch {
    // Use default seed if no source config exists.
  }

  const startUrls = seedUrlsFromSources(sourceConfig).filter(inTechnologyScope);
  const queue = startUrls.map((url) => ({ url: stripHash(url), depth: 0, parentUrl: null, linkLabel: "Seed" }));
  const seen = new Set();
  const assets = [];
  const linkGraph = [];
  const errors = [];
  const fetchModes = {};
  let fetchedPageCount = 0;
  let pdfCount = 0;

  try {
    while (queue.length && assets.length < DEFAULT_MAX_PAGES) {
      const next = queue.shift();
      if (!next?.url || seen.has(next.url) || next.depth > DEFAULT_MAX_DEPTH) continue;
      seen.add(next.url);

      try {
        const fetched = await fetchSource(next.url);
        const status = fetched.response.status;
        fetchModes[fetched.fetchMode] = (fetchModes[fetched.fetchMode] || 0) + 1;
        if (!fetched.response.ok) {
          errors.push({ url: next.url, status, message: fetched.response.statusText, fetchMode: fetched.fetchMode });
          continue;
        }

        if (isPdfLike(fetched.finalUrl, fetched.contentType)) {
          pdfCount += 1;
          assets.push(pdfAsset({ ...next, finalUrl: fetched.finalUrl, contentType: fetched.contentType, status, fetchMode: fetched.fetchMode }));
          continue;
        }

        if (!isHtmlLike(fetched.finalUrl, fetched.contentType)) continue;

        const html = fetched.body.toString("utf8");
        const asset = htmlAsset({ ...next, finalUrl: fetched.finalUrl, html, contentType: fetched.contentType, fetchMode: fetched.fetchMode });
        assets.push(asset);
        fetchedPageCount += 1;

        const discoveredLinks = extractLinks(html, fetched.finalUrl);
        for (const link of discoveredLinks) {
          const relation = inTechnologyScope(link.url) ? "in_scope" : "related_offscope";
          linkGraph.push({ from: fetched.finalUrl, to: link.url, label: link.label, relation });
          if (relation === "in_scope" && shouldCrawl(link.url) && !seen.has(link.url) && next.depth < DEFAULT_MAX_DEPTH) {
            queue.push({ url: stripHash(link.url), depth: next.depth + 1, parentUrl: fetched.finalUrl, linkLabel: link.label });
          }
        }

        await delay(REQUEST_DELAY_MS);
      } catch (error) {
        errors.push({ url: next.url, message: error.message, fetchMode: FETCH_MODE });
      }
    }
  } finally {
    await closeBrowser();
  }

  const generated = {
    generatedAt: now,
    seedUrls: startUrls,
    scope: {
      host: "www.pwc.com",
      allowedPath: "/gx/en/issues/technology.html and /gx/en/issues/technology/*",
      maxPages: DEFAULT_MAX_PAGES,
      maxDepth: DEFAULT_MAX_DEPTH,
      fetchMode: FETCH_MODE,
    },
    assets,
  };

  const graph = {
    generatedAt: now,
    nodes: assets.map((asset) => ({ id: asset.id, title: asset.title, url: asset.url, format: asset.format, depth: asset.crawl_depth })),
    edges: linkGraph,
  };

  const report = {
    lastRunAt: now,
    seedUrlCount: startUrls.length,
    discoveredUrlCount: uniq(linkGraph.filter((edge) => edge.relation === "in_scope").map((edge) => edge.to)).length,
    fetchedPageCount,
    pdfCount,
    assetCount: assets.length,
    newCandidateCount: assets.length,
    maxDepth: DEFAULT_MAX_DEPTH,
    maxPages: DEFAULT_MAX_PAGES,
    fetchMode: FETCH_MODE,
    fetchModes,
    notes: [
      "Crawler is scoped to the PwC AI, data and tech hub and child URLs under /gx/en/issues/technology/.",
      "Workflow can run with FETCH_MODE=browser to render pages with Playwright when plain Node fetch is blocked.",
      "Navigation, footer, search, social, video-control and legal boilerplate are stripped before proof extraction.",
      "Generated assets are candidates for marketing review, not auto-approved partner kit sources.",
      "PDFs are recorded and checked for availability, but PDF text extraction is pending.",
    ],
    errors,
  };

  await fs.mkdir(TECHNOLOGY_DIR, { recursive: true });
  await fs.writeFile(GENERATED_PATH, `${JSON.stringify(generated, null, 2)}\n`);
  await fs.writeFile(GRAPH_PATH, `${JSON.stringify(graph, null, 2)}\n`);
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(ROOT_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(JSON.stringify(report, null, 2));
}

await crawl();
