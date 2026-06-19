const sourceState = {
  loaded: false,
  youtube: null,
  youtubeReport: null,
  tech: null,
  techReport: null,
};

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "Date not captured";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

async function loadJson(path) {
  try {
    const response = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function loadSources() {
  if (sourceState.loaded) return sourceState;
  const [youtube, youtubeReport, tech, techReport] = await Promise.all([
    loadJson("./crawler/youtube/generated-videos.json"),
    loadJson("./crawler/youtube/crawl-report.json"),
    loadJson("./crawler/technology/generated-assets.json"),
    loadJson("./crawler/technology/crawl-report.json"),
  ]);
  sourceState.youtube = youtube || { assets: [] };
  sourceState.youtubeReport = youtubeReport;
  sourceState.tech = tech || { assets: [] };
  sourceState.techReport = techReport;
  sourceState.loaded = true;
  return sourceState;
}

function youtubeAssets() {
  return Array.isArray(sourceState.youtube?.assets) ? sourceState.youtube.assets : [];
}

function techAssets() {
  return Array.isArray(sourceState.tech?.assets) ? sourceState.tech.assets : [];
}

function sourceSummary(source) {
  const text = source.summary || source.description || source.body_text || "Candidate source metadata captured for review.";
  return cleanText(text).slice(0, 280);
}

function statusCard(kind, title, body, meta = "Review status") {
  return `
    <article class="proof-row source-status-card" data-source-kind="${kind}">
      <div>
        <span class="card-label">${kind === "video" ? "Video lane" : "Web crawl lane"}</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(body)}</p>
      </div>
      <aside>
        <span>Status</span>
        <strong>${escapeHtml(meta)}</strong>
      </aside>
    </article>
  `;
}

function videoRow(video) {
  const duration = video.duration_label || "Duration unavailable";
  const channel = video.channel_label || video.channel_handle || "PwC YouTube";
  const published = formatDate(video.published_at);
  return `
    <article class="proof-row video-source-row" data-source-kind="video">
      <div>
        <span class="card-label">Video candidate | ${escapeHtml(channel)}</span>
        <h2>${escapeHtml(video.title)}</h2>
        <p>${escapeHtml(sourceSummary(video))}</p>
        <ul>
          <li>Published: ${escapeHtml(published)}</li>
          <li>Duration: ${escapeHtml(duration)}</li>
          <li>Transcript status: ${escapeHtml(video.transcript_status || "Not ingested")}</li>
        </ul>
      </div>
      <aside>
        <span>Review status</span>
        <strong>Transcript needed</strong>
        <a class="text-link" href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">View video</a>
      </aside>
    </article>
  `;
}

function techRow(asset) {
  const published = formatDate(asset.published_date || asset.last_seen_date);
  const proof = Array.isArray(asset.proof_points) && asset.proof_points.length ? asset.proof_points[0] : "Candidate proof requires review.";
  return `
    <article class="proof-row web-source-row" data-source-kind="web">
      <div>
        <span class="card-label">Web crawl candidate | ${escapeHtml(asset.format || "PwC page")}</span>
        <h2>${escapeHtml(asset.title)}</h2>
        <p>${escapeHtml(sourceSummary(asset))}</p>
        <ul>
          <li>${escapeHtml(proof)}</li>
          <li>Captured: ${escapeHtml(published)}</li>
        </ul>
      </div>
      <aside>
        <span>Review status</span>
        <strong>Needs review</strong>
        <a class="text-link" href="${escapeHtml(asset.url)}" target="_blank" rel="noreferrer">View source</a>
      </aside>
    </article>
  `;
}

function sourceControlsHtml(approvedCount) {
  const videos = youtubeAssets();
  const tech = techAssets();
  const videoCount = videos.length;
  const webCount = tech.length;
  const allCount = approvedCount + videoCount + webCount;
  return `
    <section class="source-lane-panel" data-source-controls>
      <div>
        <span class="section-label">Source lanes</span>
        <h2>Approved proof plus review candidates</h2>
        <p>Approved PwC proof stays separate from scraped or API-ingested candidates. Video items need transcript or summary review before they become kit proof.</p>
      </div>
      <div class="source-filter-buttons" role="group" aria-label="Source type filters">
        <button type="button" data-source-filter="all" aria-pressed="true">All <span>${allCount}</span></button>
        <button type="button" data-source-filter="approved" aria-pressed="false">Approved proof <span>${approvedCount}</span></button>
        <button type="button" data-source-filter="web" aria-pressed="false">Web candidates <span>${webCount}</span></button>
        <button type="button" data-source-filter="video" aria-pressed="false">Video candidates <span>${videoCount}</span></button>
      </div>
    </section>
  `;
}

function enhanceProofLibrary() {
  const proofPage = document.querySelector(".proof-page");
  const proofList = document.querySelector(".proof-list");
  if (!proofPage || !proofList || proofList.dataset.sourceEnhanced === "true") return;

  proofPage.querySelector(".page-heading h1")?.replaceChildren(document.createTextNode("PwC proof and source review library."));
  proofPage.querySelector(".page-heading p")?.replaceChildren(document.createTextNode("Use approved proof directly. Keep scraped web pages and YouTube videos in review until Marketing has checked the source, summary and claims."));

  const approvedRows = [...proofList.querySelectorAll(".proof-row")];
  approvedRows.forEach((row) => {
    row.dataset.sourceKind = "approved";
    row.classList.add("approved-source-row");
  });

  proofPage.querySelector("[data-source-controls]")?.remove();
  proofList.before(document.createRange().createContextualFragment(sourceControlsHtml(approvedRows.length)));

  const fragments = [];
  const tech = techAssets();
  const videos = youtubeAssets();

  if (tech.length) {
    fragments.push(...tech.slice(0, 30).map(techRow));
  } else if (sourceState.techReport) {
    const error = sourceState.techReport.errors?.[0];
    const body = error ? `Latest crawl did not produce assets: ${error.status || ""} ${error.message || ""}` : "The technology crawler has not produced candidate assets yet.";
    fragments.push(statusCard("web", "Technology crawl has no candidates yet", body, "No assets"));
  }

  if (videos.length) {
    fragments.push(...videos.slice(0, 30).map(videoRow));
  } else if (sourceState.youtubeReport) {
    const configured = sourceState.youtubeReport.status !== "not_configured";
    fragments.push(statusCard(
      "video",
      configured ? "YouTube lane has no candidates yet" : "YouTube lane needs an API key",
      configured ? "The YouTube ingestion ran but did not produce video candidates." : "Add the YOUTUBE_API_KEY repository secret, then run the YouTube source refresh workflow.",
      configured ? "No videos" : "Not configured"
    ));
  }

  if (fragments.length) proofList.insertAdjacentHTML("beforeend", fragments.join(""));
  proofList.dataset.sourceEnhanced = "true";
  applySourceFilter("all");
}

function topVideos(limit = 3) {
  return youtubeAssets()
    .slice()
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
    .slice(0, limit);
}

function relatedVideosHtml(videos, compact = false) {
  if (!videos.length) return "";
  return `
    <section class="related-video-panel ${compact ? "compact" : ""}" data-video-context>
      <div class="panel-head-mini">
        <span class="section-label">Related video sources</span>
        <h3>${compact ? "Optional video context" : "Video context for review"}</h3>
        <p>Metadata only. Use these to watch or request transcript review, not as approved proof yet.</p>
      </div>
      <div class="video-context-list">
        ${videos.map((video) => `
          <article class="video-context-card">
            <span class="card-label">${escapeHtml(video.channel_label || "PwC YouTube")} | ${escapeHtml(video.duration_label || "Video")}</span>
            <h4>${escapeHtml(video.title)}</h4>
            <p>${escapeHtml(sourceSummary(video))}</p>
            <a class="text-link" href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">View video</a>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function enhanceNarrativeVideos() {
  const spineBody = document.querySelector(".spine-body");
  if (!spineBody || spineBody.querySelector("[data-video-context]")) return;
  const videos = topVideos(3);
  if (!videos.length) return;
  const safetyGrid = spineBody.querySelector(".safety-grid");
  if (safetyGrid) safetyGrid.insertAdjacentHTML("afterend", relatedVideosHtml(videos));
}

function enhanceKitVideoContext() {
  const kitSide = document.querySelector(".kit-side");
  if (!kitSide || kitSide.querySelector("[data-video-context]")) return;
  const videos = topVideos(1);
  if (!videos.length) return;
  kitSide.insertAdjacentHTML("beforeend", relatedVideosHtml(videos, true));
}

function applySourceFilter(filter) {
  const proofPage = document.querySelector(".proof-page");
  if (!proofPage) return;
  proofPage.dataset.sourceFilter = filter;
  proofPage.querySelectorAll("[data-source-filter]").forEach((button) => {
    const active = button.dataset.sourceFilter === filter;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("active", active);
  });
  proofPage.querySelectorAll(".proof-list [data-source-kind]").forEach((row) => {
    row.hidden = filter !== "all" && row.dataset.sourceKind !== filter;
  });
}

function fixLogo() {
  const mark = document.querySelector(".pwc-mark");
  if (!mark || mark.querySelector("img")) return;
  mark.setAttribute("aria-label", "PwC");
  mark.classList.add("logo-loaded");
  mark.innerHTML = `<img src="./assets/pwc-logo-cropped.png?v=20260619-6" alt="PwC" />`;
}

function polishNonActions() {
  const guidance = document.querySelector(".spine-panel .small-pill");
  if (guidance) {
    guidance.textContent = "Guidance note: use with guardrails";
    guidance.classList.add("non-action-note");
  }
  document.querySelectorAll(".approval-pill, .edition-pill").forEach((node) => node.classList.add("non-action-badge"));
}

function injectSourceLaneStyles() {
  if (document.querySelector("#source-lane-style")) return;
  const style = document.createElement("style");
  style.id = "source-lane-style";
  style.textContent = `
    .brand { gap: 0 !important; }
    .brand-line, .brand-copy { display: none !important; }
    .pwc-mark.logo-loaded { background: none !important; display: block !important; overflow: visible !important; }
    .pwc-mark img { display: block; width: 100%; height: 100%; object-fit: contain; object-position: left center; }
    .spine-panel .small-pill.non-action-note { border: 0 !important; background: transparent !important; border-radius: 0 !important; padding: 0 !important; min-height: 0 !important; color: var(--muted) !important; font-weight: 800; }
    .spine-panel .small-pill.non-action-note::before { content: ""; display: inline-block; width: 8px; height: 8px; margin-right: 8px; background: var(--orange); transform: translateY(-1px); }
    .non-action-badge { pointer-events: none; }
    .source-lane-panel { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; align-items: end; border: 1px solid var(--line); background: rgba(255,253,249,.78); border-radius: 28px; padding: 20px; margin: 18px 0; box-shadow: var(--shadow-soft); }
    .source-lane-panel h2 { margin: 4px 0 6px; letter-spacing: -.03em; }
    .source-lane-panel p { margin: 0; color: var(--muted); max-width: 720px; }
    .source-filter-buttons { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .source-filter-buttons button { border: 1px solid var(--line-strong); background: #fffdf9; color: var(--ink); border-radius: 999px; min-height: 38px; padding: 0 12px; font-weight: 850; }
    .source-filter-buttons button span { color: var(--muted); margin-left: 4px; }
    .source-filter-buttons button.active { background: var(--black); color: #fff; border-color: var(--black); }
    .source-filter-buttons button.active span { color: rgba(255,255,255,.72); }
    .video-source-row { border-left: 5px solid var(--orange); }
    .web-source-row { border-left: 5px solid var(--amber); }
    .source-status-card { border-style: dashed; background: #fffaf4; }
    .related-video-panel { margin-top: 18px; border: 1px solid var(--line); border-radius: 28px; padding: 20px; background: #fffaf4; }
    .related-video-panel.compact { margin-top: 14px; padding: 16px; }
    .panel-head-mini h3 { margin: 4px 0 6px; font-size: 1.2rem; letter-spacing: -.02em; }
    .panel-head-mini p { margin: 0 0 14px; color: var(--muted); }
    .video-context-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .related-video-panel.compact .video-context-list { grid-template-columns: 1fr; }
    .video-context-card { border: 1px solid var(--line); border-radius: 20px; padding: 14px; background: #fffdf9; }
    .video-context-card h4 { margin: 8px 0; font-size: 1rem; line-height: 1.18; }
    .video-context-card p { margin: 0 0 10px; color: var(--muted); font-size: .92rem; }
    @media (max-width: 860px) { .source-lane-panel { grid-template-columns: 1fr; } .source-filter-buttons { justify-content: flex-start; } }
  `;
  document.head.append(style);
}

function enhance() {
  injectSourceLaneStyles();
  fixLogo();
  polishNonActions();
  enhanceProofLibrary();
  enhanceNarrativeVideos();
  enhanceKitVideoContext();
}

let scheduled = false;
function scheduleEnhance() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    enhance();
  });
}

document.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-source-filter]");
  if (!filterButton) return;
  applySourceFilter(filterButton.dataset.sourceFilter || "all");
});

loadSources().then(() => {
  enhance();
  new MutationObserver(scheduleEnhance).observe(document.body, { childList: true, subtree: true });
});
