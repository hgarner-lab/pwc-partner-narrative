import fs from "node:fs/promises";
import crypto from "node:crypto";

const SOURCES_PATH = new URL("../crawler/youtube/sources.json", import.meta.url);
const OUTPUT_DIR = new URL("../crawler/youtube/", import.meta.url);
const GENERATED_PATH = new URL("../crawler/youtube/generated-videos.json", import.meta.url);
const REPORT_PATH = new URL("../crawler/youtube/crawl-report.json", import.meta.url);

const API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY || "";
const MAX_VIDEOS_PER_CHANNEL = Number.parseInt(process.env.MAX_YOUTUBE_VIDEOS || "50", 10);
const now = new Date().toISOString();

const defaultSources = {
  channels: [
    {
      id: "pwc-global",
      label: "PwC Global",
      handle: "PwC",
      url: "https://www.youtube.com/@PwC/videos",
      enabled: true,
    },
    {
      id: "pwc-uk",
      label: "PwC UK",
      handle: "PwCUK",
      url: "https://www.youtube.com/@PwCUK/videos",
      enabled: true,
    },
  ],
};

function hash(value, length = 10) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, length);
}

function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isoDurationToSeconds(duration) {
  const match = String(duration || "").match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const hours = Number.parseInt(match[1] || "0", 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  const seconds = Number.parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function secondsToLabel(seconds) {
  if (seconds == null) return "Duration unavailable";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function inferThemes(title, description, tags = []) {
  const combined = `${title} ${description} ${tags.join(" ")}`.toLowerCase();
  const themes = [];
  const checks = [
    ["AI", /\bai\b|artificial intelligence|agentic|generative/i],
    ["Data and cloud", /data|cloud|infrastructure|platform|analytics/i],
    ["Cybersecurity", /cyber|security|threat|resilien/i],
    ["Emerging tech", /emerging tech|quantum|blockchain|metaverse|automation|robot/i],
    ["Trust and governance", /trust|governance|responsible|assurance|risk|controls|ethics/i],
    ["Transformation", /reinvention|transformation|productivity|growth|value|innovation/i],
    ["Leadership", /leader|ceo|c-suite|board|executive|agenda/i],
    ["Workforce", /workforce|skills|people|talent|jobs|workers/i],
  ];
  for (const [label, regex] of checks) if (regex.test(combined)) themes.push(label);
  return themes.length ? themes : ["AI, data and tech"];
}

function inferAudience(title, description, tags = []) {
  const combined = `${title} ${description} ${tags.join(" ")}`.toLowerCase();
  const roles = [];
  if (/ceo|chief executive|c-suite|executive|board|leader/.test(combined)) roles.push("CEO");
  if (/cfo|finance|roi|value|cost|growth/.test(combined)) roles.push("CFO");
  if (/cio|cto|technology|cloud|data|platform|infrastructure|cyber/.test(combined)) roles.push("CIO / CTO");
  if (/chro|workforce|skills|people|jobs|talent/.test(combined)) roles.push("CHRO");
  if (/risk|trust|governance|security|cyber|assurance|compliance/.test(combined)) roles.push("Risk leader");
  return [...new Set(roles)].slice(0, 6);
}

function safeNumber(value) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readSources() {
  try {
    return JSON.parse(await fs.readFile(SOURCES_PATH, "utf8"));
  } catch {
    return defaultSources;
  }
}

async function youtubeGet(path, params) {
  const url = new URL(`${API_BASE}/${path}`);
  for (const [key, value] of Object.entries({ ...params, key: API_KEY })) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "PwC Partner Narrative Kits YouTube metadata ingestor",
    },
  });
  const json = await response.json();
  if (!response.ok) {
    const message = json?.error?.message || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }
  return json;
}

async function resolveChannel(source) {
  const handle = String(source.handle || "").replace(/^@/, "");
  let response;
  if (source.channelId) {
    response = await youtubeGet("channels", { part: "snippet,contentDetails,statistics", id: source.channelId });
  } else {
    response = await youtubeGet("channels", { part: "snippet,contentDetails,statistics", forHandle: handle });
  }
  const channel = response.items?.[0];
  if (!channel) throw new Error(`Could not resolve channel ${source.label || source.handle}`);
  return channel;
}

async function fetchUploads(uploadPlaylistId) {
  const items = [];
  let pageToken = null;
  while (items.length < MAX_VIDEOS_PER_CHANNEL) {
    const response = await youtubeGet("playlistItems", {
      part: "snippet,contentDetails",
      playlistId: uploadPlaylistId,
      maxResults: Math.min(50, MAX_VIDEOS_PER_CHANNEL - items.length),
      pageToken,
    });
    items.push(...(response.items || []));
    pageToken = response.nextPageToken;
    if (!pageToken) break;
  }
  return items;
}

async function fetchVideoDetails(videoIds) {
  const details = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const response = await youtubeGet("videos", {
      part: "snippet,contentDetails,statistics,status",
      id: batch.join(","),
      maxResults: 50,
    });
    details.push(...(response.items || []));
  }
  return details;
}

function assetFromVideo(video, channelSource, channel) {
  const snippet = video.snippet || {};
  const contentDetails = video.contentDetails || {};
  const statistics = video.statistics || {};
  const status = video.status || {};
  const videoId = video.id;
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const description = compact(snippet.description || "");
  const tags = snippet.tags || [];
  const seconds = isoDurationToSeconds(contentDetails.duration);
  const themes = inferThemes(snippet.title, description, tags);
  return {
    id: `youtube-${hash(videoId)}`,
    video_id: videoId,
    title: snippet.title || "Untitled video",
    url,
    channel_id: channel.id,
    channel_label: channelSource.label,
    channel_handle: channelSource.handle ? `@${String(channelSource.handle).replace(/^@/, "")}` : null,
    channel_url: channelSource.url,
    source_group: "youtube-pwc-channels",
    source_type: "YouTube metadata",
    platform: "YouTube",
    format: "Video",
    language: snippet.defaultAudioLanguage || snippet.defaultLanguage || "unknown",
    region: channelSource.region || "Global / UK",
    published_at: snippet.publishedAt || null,
    last_seen_date: now.slice(0, 10),
    last_crawled_date: now.slice(0, 10),
    duration_iso: contentDetails.duration || null,
    duration_seconds: seconds,
    duration_label: secondsToLabel(seconds),
    description,
    summary: description ? description.slice(0, 600) : "YouTube video metadata captured. Transcript not available in this ingestion lane.",
    thumbnails: snippet.thumbnails || {},
    tags,
    category_id: snippet.categoryId || null,
    statistics: {
      view_count: safeNumber(statistics.viewCount),
      like_count: safeNumber(statistics.likeCount),
      comment_count: safeNumber(statistics.commentCount),
    },
    privacy_status: status.privacyStatus || null,
    embeddable: status.embeddable ?? null,
    license: status.license || null,
    primary_topic: themes[0],
    themes,
    audience: inferAudience(snippet.title, description, tags),
    proof_points: [
      "Video metadata only. Do not quote claims until a transcript or approved summary has been reviewed.",
    ],
    transcript_status: "Not ingested",
    transcript_note: "Captions/transcripts require authorised access or supplied transcript files before claim extraction.",
    approval_status: "Candidate - metadata only",
    metadata_status: "Needs review",
    suggested_use: "Use as a discoverable video source and candidate for transcript review, not as an approved proof point yet.",
  };
}

async function run() {
  const sources = await readSources();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  if (!API_KEY) {
    const report = {
      lastRunAt: now,
      status: "not_configured",
      channelCount: (sources.channels || []).filter((channel) => channel.enabled !== false).length,
      fetchedVideoCount: 0,
      assetCount: 0,
      notes: [
        "Set a repository secret named YOUTUBE_API_KEY to enable YouTube Data API ingestion.",
        "This lane captures video metadata only and does not download video, audio or transcripts.",
      ],
      errors: ["Missing YOUTUBE_API_KEY"],
    };
    await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    await fs.writeFile(GENERATED_PATH, `${JSON.stringify({ generatedAt: now, assets: [] }, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const enabledChannels = (sources.channels || []).filter((channel) => channel.enabled !== false);
  const assets = [];
  const channels = [];
  const errors = [];

  for (const source of enabledChannels) {
    try {
      const channel = await resolveChannel(source);
      const uploadPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadPlaylistId) throw new Error(`No uploads playlist found for ${source.label}`);
      const uploadItems = await fetchUploads(uploadPlaylistId);
      const videoIds = uploadItems.map((item) => item.contentDetails?.videoId).filter(Boolean);
      const videos = await fetchVideoDetails(videoIds);
      channels.push({
        id: source.id,
        label: source.label,
        handle: source.handle ? `@${String(source.handle).replace(/^@/, "")}` : null,
        channel_id: channel.id,
        title: channel.snippet?.title || source.label,
        url: source.url,
        uploads_playlist_id: uploadPlaylistId,
        published_at: channel.snippet?.publishedAt || null,
        subscriber_count: safeNumber(channel.statistics?.subscriberCount),
        video_count: safeNumber(channel.statistics?.videoCount),
        captured_video_count: videos.length,
      });
      for (const video of videos) assets.push(assetFromVideo(video, source, channel));
    } catch (error) {
      errors.push({ channel: source.label || source.handle || source.id, message: error.message });
    }
  }

  const generated = {
    generatedAt: now,
    sourceGroup: "youtube-pwc-channels",
    ingestionMode: "YouTube Data API metadata only",
    channels,
    assets,
  };

  const report = {
    lastRunAt: now,
    status: errors.length ? "completed_with_errors" : "completed",
    channelCount: enabledChannels.length,
    resolvedChannelCount: channels.length,
    fetchedVideoCount: assets.length,
    assetCount: assets.length,
    maxVideosPerChannel: MAX_VIDEOS_PER_CHANNEL,
    notes: [
      "Uses the YouTube Data API for metadata instead of scraping youtube.com HTML.",
      "Does not download video or audio.",
      "Does not ingest transcripts or captions without authorised access or supplied transcript files.",
      "Generated video records are candidates for review, not approved proof points.",
    ],
    errors,
  };

  await fs.writeFile(GENERATED_PATH, `${JSON.stringify(generated, null, 2)}\n`);
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

await run();
