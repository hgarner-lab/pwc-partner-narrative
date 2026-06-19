import { clientConfig, contentAssets, messageSpine, taxonomy } from "./data.js";

const app = document.querySelector("#app");

const narratives = [
  {
    id: "human-scale-ai",
    name: "Human Scale AI",
    status: "Approved",
    updated: "Jun 19, 2026",
    outputCount: 7,
    summary: "AI makes sameness cheaper. Human judgement becomes the signal.",
    coreTruth: "Fluent content is abundant. Expert judgement is scarce.",
    tension: "AI is making competent content easier to produce, so distinct human interpretation becomes more valuable.",
    whyNow: "Clients are moving from AI pilots to choices about trust, productivity, work and value.",
    belief: "PwC helps credible people carry coherent thinking into the conversations where preference forms.",
    proofIds: ["pwc-ai-services", "pwc-ai-performance", "pwc-ai-jobs-global", "pwc-ceo-survey-ai"],
    sectorCuts: ["Financial Services", "TMT", "UK market"],
    roleCuts: ["CEO", "CIO / CTO", "CHRO", "CMO"],
    moments: ["Setting strategy", "Exploring opportunities", "Event follow-up"],
    claimsToAvoid: [
      "Do not imply AI replaces expert judgement.",
      "Do not promise guaranteed AI outcomes.",
      "Do not turn the narrative into generic AI-written copy.",
    ],
  },
  {
    id: "trust-assurance",
    name: "AI Trust and Assurance",
    status: "Approved",
    updated: "Jun 18, 2026",
    outputCount: 6,
    summary: "Trust is not a soft issue. It is the condition for AI to scale.",
    coreTruth: "AI only scales when people can trust the system, the data and the decision path.",
    tension: "More AI adoption creates more questions about accountability, controls and confidence.",
    whyNow: "Leaders are under pressure to move quickly without losing assurance or regulatory confidence.",
    belief: "PwC can help make responsible AI practical through governance, controls and clear decision rights.",
    proofIds: ["pwc-responsible-ai", "pwc-ai-services", "pwc-ai-performance"],
    sectorCuts: ["Financial Services", "TMT", "Energy"],
    roleCuts: ["Risk leader", "CIO / CTO", "CEO"],
    moments: ["Seeking help", "Delivery confidence", "Market trigger"],
    claimsToAvoid: [
      "Do not say governance slows AI down by default.",
      "Do not imply risk has been eliminated.",
      "Do not use compliance language without a source.",
    ],
  },
  {
    id: "responsible-ai",
    name: "Responsible AI",
    status: "Approved",
    updated: "Jun 17, 2026",
    outputCount: 5,
    summary: "Responsible AI turns principles into habits, controls and choices.",
    coreTruth: "Responsible AI is an operating discipline, not a slogan.",
    tension: "AI ambition is outpacing many organisations' controls, skills and governance routines.",
    whyNow: "Boards and executives need confidence that AI is useful, compliant and explainable.",
    belief: "PwC can help leaders build the governance layer that lets AI adoption move safely.",
    proofIds: ["pwc-responsible-ai", "pwc-ai-services", "pwc-ceo-survey-ai"],
    sectorCuts: ["Financial Services", "Healthcare", "Consumer Markets"],
    roleCuts: ["Risk leader", "CEO", "Transformation leader"],
    moments: ["Setting strategy", "Seeking help", "Delivery confidence"],
    claimsToAvoid: [
      "Do not present responsible AI as a checklist only.",
      "Do not claim all risks can be automated away.",
      "Do not use client examples without approval.",
    ],
  },
  {
    id: "jobs-productivity",
    name: "AI Jobs and Productivity",
    status: "Approved",
    updated: "Jun 16, 2026",
    outputCount: 7,
    summary: "AI changes work through people, skills and redesigned roles.",
    coreTruth: "Productivity gains come when work changes, not when tools are simply added.",
    tension: "AI can raise the premium on judgement, leadership and creativity even as it automates routine tasks.",
    whyNow: "Executives are asking how AI affects skills, entry roles and the future workforce.",
    belief: "PwC can help leaders redesign the human system around AI, not just deploy technology.",
    proofIds: ["pwc-ai-jobs-global", "pwc-human-skills", "pwc-ceo-survey-ai"],
    sectorCuts: ["Financial Services", "TMT", "Consumer Markets"],
    roleCuts: ["CHRO", "CEO", "CFO"],
    moments: ["Setting strategy", "Exploring opportunities", "Event follow-up"],
    claimsToAvoid: [
      "Do not frame people as the obstacle.",
      "Do not suggest productivity is automatic.",
      "Do not ignore early-career and skills implications.",
    ],
  },
  {
    id: "fs-ai",
    name: "AI in Financial Services",
    status: "Approved",
    updated: "Jun 16, 2026",
    outputCount: 6,
    summary: "AI opportunity in FS depends on trust, skills, controls and client outcomes moving together.",
    coreTruth: "In Financial Services, AI value needs confidence as much as speed.",
    tension: "The sector has strong AI demand, but adoption must work inside risk, trust and regulatory expectations.",
    whyNow: "FS leaders are moving from experimentation to applied AI across functions and client moments.",
    belief: "PwC can help FS leaders connect AI productivity, assurance and workforce change.",
    proofIds: ["pwc-fs-ai-jobs", "pwc-ai-performance", "pwc-responsible-ai"],
    sectorCuts: ["Financial Services"],
    roleCuts: ["CEO", "CFO", "Risk leader", "CIO / CTO"],
    moments: ["Setting strategy", "Delivery confidence", "Market trigger"],
    claimsToAvoid: [
      "Do not overstate sector-wide maturity.",
      "Do not separate AI value from risk and trust.",
      "Do not make regulatory claims without the approved source.",
    ],
  },
  {
    id: "tmt-ai",
    name: "AI in TMT",
    status: "Needs proof",
    updated: "Jun 16, 2026",
    outputCount: 4,
    summary: "TMT is both building AI and being reshaped by it.",
    coreTruth: "In TMT, the scarce layer is judgement about where AI value moves next.",
    tension: "The sector is closest to AI creation, but still needs clear human choices on skills, platforms and growth.",
    whyNow: "TMT leaders are facing rapid skills change, platform shifts and new expectations for AI-enabled value.",
    belief: "PwC can help TMT leaders turn AI intensity into clearer choices and trusted growth.",
    proofIds: ["pwc-tmt-ai-jobs", "pwc-ai-performance", "pwc-human-skills"],
    sectorCuts: ["TMT"],
    roleCuts: ["CEO", "CIO / CTO", "CHRO", "CMO"],
    moments: ["Exploring opportunities", "Market trigger", "Event follow-up"],
    claimsToAvoid: [
      "Do not treat TMT as one uniform market.",
      "Do not imply high AI adoption means easy value capture.",
      "Do not skip the skills and judgement story.",
    ],
  },
];

const state = {
  view: "narratives",
  selectedNarrativeId: "human-scale-ai",
  sector: "Financial Services",
  role: "CIO / CTO",
  moment: "Setting strategy",
  outputType: "LinkedIn post starter",
  style: "Field note",
  proofIndex: 0,
  proofQuery: "",
};

const navItems = [
  ["narratives", "Narratives"],
  ["build", "Build Partner Kit"],
  ["proof", "Proof Library"],
];

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function selectedNarrative() {
  return narratives.find((item) => item.id === state.selectedNarrativeId) ?? narratives[0];
}

function asset(id) {
  return contentAssets.find((item) => item.id === id) ?? contentAssets[0];
}

function narrativeProof(narrative = selectedNarrative()) {
  return narrative.proofIds.map(asset).filter(Boolean);
}

function currentProof(narrative = selectedNarrative()) {
  const proofs = narrativeProof(narrative);
  return proofs[state.proofIndex % proofs.length] ?? proofs[0] ?? contentAssets[0];
}

function proofText(item = currentProof()) {
  return item.proof_points?.[state.proofIndex % item.proof_points.length] ?? item.proof_points?.[0] ?? item.summary;
}

function sourceLink(item = currentProof()) {
  return `<a class="text-link" href="${esc(item.url)}" target="_blank" rel="noreferrer">View source</a>`;
}

function score(item) {
  return (
    item.cultural_availability_score +
    item.partner_readiness_score +
    item.proof_strength_score +
    item.message_spine_alignment +
    item.moment_readiness_score
  );
}

function options(values, selected) {
  return values.map((value) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(value)}</option>`).join("");
}

function statusTone(status) {
  if (status === "Approved") return "approved";
  if (status === "Needs proof") return "needs-proof";
  return "draft";
}

function narrativeCard(narrative) {
  const proofs = narrativeProof(narrative);
  return `
    <button class="narrative-card ${narrative.id === state.selectedNarrativeId ? "active" : ""}" data-select-narrative="${esc(narrative.id)}">
      <div class="meta-row">
        <span class="status ${statusTone(narrative.status)}">${esc(narrative.status)}</span>
        <span class="count">${proofs.reduce((sum, item) => sum + item.proof_points.length, 0)} proof points</span>
      </div>
      <h3>${esc(narrative.name)}</h3>
      <p>${esc(narrative.summary)}</p>
      <div class="meta-row soft">
        <span>${narrative.outputCount} partner outputs</span>
        <span>${esc(narrative.updated)}</span>
      </div>
    </button>
  `;
}

function brandMark() {
  return `
    <div class="pwc-mark" aria-label="PwC placeholder mark">
      <span class="pwc-text">pwc</span>
      <span class="block one"></span>
      <span class="block two"></span>
    </div>
  `;
}

function renderShell(content) {
  return `
    <main class="studio-shell">
      <header class="topbar">
        <div class="brand">
          ${brandMark()}
          <div class="brand-line"></div>
          <div class="brand-copy">
            <strong>${esc(clientConfig.productLine)}</strong>
            <span>Private workspace for approved PwC narratives</span>
          </div>
        </div>
        <div class="top-actions">
          <span class="approval-pill"><i></i> Marketing approved</span>
          <span class="edition-pill">Partner edition</span>
        </div>
      </header>

      <nav class="primary-nav" aria-label="Primary">
        ${navItems
          .map(
            ([id, label]) => `
              <button class="${state.view === id ? "active" : ""}" data-view="${id}">
                ${esc(label)}
              </button>
            `,
          )
          .join("")}
      </nav>

      ${content}
    </main>
  `;
}

function renderHero() {
  return `
    <section class="hero">
      <div>
        <span class="eyebrow">PwC Partner Narrative Kits</span>
        <h1>Build your voice from PwC's best thinking.</h1>
        <p>Choose one approved narrative. Add your sector, audience and moment. Leave with a partner-ready kit you can adapt and use with confidence.</p>
      </div>
    </section>
  `;
}

function renderNarrativeRail() {
  return `
    <aside class="panel narrative-panel">
      <div class="panel-head">
        <div>
          <span class="section-label">Step 1</span>
          <h2>Choose a narrative</h2>
        </div>
        <span class="small-pill">${narratives.length} live</span>
      </div>
      <div class="narrative-list">
        ${narratives.map(narrativeCard).join("")}
      </div>
    </aside>
  `;
}

function renderSpinePanel() {
  const narrative = selectedNarrative();
  const proofs = narrativeProof(narrative);
  return `
    <section class="panel spine-panel">
      <div class="panel-head">
        <div>
          <span class="section-label">Approved narrative spine</span>
          <h2>${esc(narrative.name)}</h2>
        </div>
        <span class="small-pill">Safe to adapt</span>
      </div>
      <div class="spine-body">
        <div class="spine-hero">
          <span class="section-label">Core truth</span>
          <h2>${esc(narrative.coreTruth)}</h2>
          <p>${esc(narrative.belief)}</p>
        </div>

        <div class="brief-grid">
          <article>
            <span class="card-label">Provocation / tension</span>
            <p>${esc(narrative.tension)}</p>
          </article>
          <article>
            <span class="card-label">Why it matters now</span>
            <p>${esc(narrative.whyNow)}</p>
          </article>
          <article>
            <span class="card-label">What PwC believes</span>
            <p>${esc(narrative.belief)}</p>
          </article>
        </div>

        <section class="safety-grid">
          <article class="proof-spotlight">
            <span class="card-label">Approved proof</span>
            <h3>${proofs.length} approved sources</h3>
            <ul>
              ${proofs
                .slice(0, 3)
                .map((item) => `<li><strong>${esc(item.title)}</strong><span>${esc(proofText(item))}</span></li>`)
                .join("")}
            </ul>
          </article>
          <article class="guardrail-spotlight">
            <span class="card-label">Claims to avoid</span>
            <h3>Keep it safe</h3>
            <ul>${narrative.claimsToAvoid.map((claim) => `<li>${esc(claim)}</li>`).join("")}</ul>
          </article>
        </section>

        <section class="coverage-strip">
          <div><span>Sector cuts</span><strong>${esc(narrative.sectorCuts.join(", "))}</strong></div>
          <div><span>Role cuts</span><strong>${esc(narrative.roleCuts.join(", "))}</strong></div>
          <div><span>Moments that Matter</span><strong>${esc(narrative.moments.join(", "))}</strong></div>
          <div><span>Proof readiness</span><strong>${Math.round(proofs.reduce((sum, item) => sum + score(item), 0) / proofs.length)}/25</strong></div>
        </section>
      </div>
    </section>
  `;
}

function renderBuilderPanel(mode = "rail") {
  return `
    <aside class="panel builder-panel ${mode === "full" ? "full" : ""}">
      <div class="panel-head">
        <div>
          <span class="section-label">${mode === "full" ? "Build Partner Kit" : "Step 2"}</span>
          <h2>Make it yours</h2>
        </div>
      </div>
      <div class="builder-body">
        <label>
          <span>Sector</span>
          <select id="sector-select">${options(taxonomy.sectors.slice(0, 5), state.sector)}</select>
        </label>
        <label>
          <span>Audience / role</span>
          <select id="role-select">${options(taxonomy.roles.slice(0, 6), state.role)}</select>
        </label>
        <label>
          <span>Client moment</span>
          <select id="moment-select">${options(taxonomy.moments, state.moment)}</select>
        </label>
        <label>
          <span>Output type</span>
          <select id="output-select">${options(taxonomy.partnerPromptTypes, state.outputType)}</select>
        </label>
        <label>
          <span>Partner style</span>
          <select id="style-select">${options(taxonomy.partnerStyles, state.style)}</select>
        </label>
        <button class="primary-button" data-build-kit>Build partner kit</button>
        <p class="human-note"><strong>Make one human edit.</strong> The kit gives you the safe structure. Add one thing only you could say before using it.</p>
      </div>
    </aside>
  `;
}

function renderNarrativesPage() {
  return `
    ${renderHero()}
    <section class="workbench">
      ${renderNarrativeRail()}
      ${renderSpinePanel()}
      ${renderBuilderPanel()}
    </section>
  `;
}

function renderBuildPage() {
  const narrative = selectedNarrative();
  return `
    <section class="build-page">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Build Partner Kit</span>
          <h1>Turn an approved narrative into partner-ready outputs.</h1>
          <p>Select the sector, role, client moment, output type and style. The kit will carry approved proof, safer language and clear guardrails.</p>
        </div>
      </div>
      <section class="build-layout">
        <div class="build-context">
          ${renderSpinePanel()}
        </div>
        ${renderBuilderPanel("full")}
      </section>
      <section class="source-stance">
        <strong>Approved sources only.</strong>
        <span>Partner perspective should come from PwC-hosted or approved public thought leadership. No public profile scraping or unapproved social monitoring is used.</span>
      </section>
    </section>
  `;
}

function draftCopy(type, narrative = selectedNarrative(), proof = currentProof()) {
  const proofLine = proofText(proof);
  const sector = state.sector;
  const role = state.role;
  const moment = state.moment.toLowerCase();
  const styleLead = {
    "Field note": "What I am hearing is",
    Boardroom: "The board-level question is",
    Reflective: "The point I keep coming back to is",
    Practical: "A practical way to look at this is",
    Direct: "The issue is simple:",
  }[state.style];

  const drafts = {
    "LinkedIn post starter": `${styleLead} that AI is making fluent content easier to produce, but expert judgement harder to recognise.\n\nFor ${sector} leaders, the useful question is not just how quickly teams can use AI. It is where trusted human judgement needs to shape the next decision.\n\nPwC proof to anchor it: ${proofLine}`,
    "Comment starter": `${styleLead} the distinction between fluency and judgement.\n\nAI can help teams move faster, but ${role} clients still need a clear view on what matters, what is risky and what is worth doing next.\n\nUseful proof: ${proofLine}`,
    "Client email starter": `Hi [Name],\n\nI thought of you while reading PwC's ${narrative.name} narrative because it connects directly to ${moment}.\n\nThe signal I would pull out is: ${proofLine}\n\nIt made me think the sharper question is where AI needs more human context, governance and judgement before it creates confidence. Worth comparing notes?`,
    "Short video prompt": `Open with the tension: AI can make output faster, but it can also make messages and decisions more generic.\n\nAdd the proof: ${proofLine}\n\nClose with the human question: what judgement would your team add that a generic system would miss?`,
    "Sales talking point": `Use this as the bridge: ${proofLine}\n\nThen ask: where is AI creating more activity without enough confidence, reuse or expert judgement?`,
    "Event follow-up": `Thank you for the conversation. One point that stayed with me was how quickly AI creates pressure to be both faster and more distinctive.\n\nA PwC proof point that connects: ${proofLine}\n\nA useful next step may be to map which moments need efficiency, which need assurance and which need expert judgement in the room.`,
    "Q&A prep": `Likely question: How do we know this is more than another AI productivity claim?\n\nAnswer path: use the approved narrative, cite one proof point and connect it to the ${role} agenda.\n\nProof: ${proofLine}`,
  };

  return drafts[type] ?? drafts["LinkedIn post starter"];
}

function kitBlocks() {
  const narrative = selectedNarrative();
  const proof = currentProof();
  return [
    ["LinkedIn post starter", draftCopy("LinkedIn post starter", narrative, proof)],
    ["Comment starter", draftCopy("Comment starter", narrative, proof)],
    ["Client email starter", draftCopy("Client email starter", narrative, proof)],
    ["Q&A prep", draftCopy("Q&A prep", narrative, proof)],
  ];
}

function actionRow() {
  return `
    <div class="kit-actions">
      <button data-copy-block>Copy</button>
      <button data-soft-action="shorter">Shorter</button>
      <button data-soft-action="human">More human</button>
      <button data-swap-proof>Swap proof</button>
      ${sourceLink()}
    </div>
  `;
}

function renderKitPage() {
  const narrative = selectedNarrative();
  const proof = currentProof();
  const proofLine = proofText(proof);
  return `
    <section class="kit-page">
      <div class="kit-heading">
        <div>
          <span class="eyebrow">Partner Kit</span>
          <h1>${esc(narrative.name)} for ${esc(state.sector)} ${esc(state.role)}s</h1>
          <p>Built from approved proof, safer language and clear guardrails. Make one human edit before use.</p>
        </div>
        <div class="kit-heading-actions">
          <button class="secondary-button" data-view="build">Adjust kit</button>
          <button class="primary-button compact" data-copy-kit>Copy all</button>
        </div>
      </div>

      <section class="kit-grid">
        <div class="draft-stack">
          ${kitBlocks()
            .map(
              ([title, body]) => `
                <article class="kit-card">
                  <span class="card-label">${esc(title)}</span>
                  <pre>${esc(body)}</pre>
                  <div class="source-proof"><strong>Source proof used</strong><span>${esc(proofLine)}</span></div>
                  <p class="safer-note"><strong>Safer language:</strong> Say "may be worth exploring" or "a useful question might be" rather than promising outcomes.</p>
                  <p class="edit-note">Make one human edit before use.</p>
                  ${actionRow()}
                </article>
              `,
            )
            .join("")}
        </div>
        <aside class="kit-side">
          <article class="proof-card">
            <span class="card-label">Proof to use</span>
            <h2>${esc(proof.title)}</h2>
            <p>${esc(proofLine)}</p>
            ${sourceLink(proof)}
          </article>
          <article class="guardrail-card">
            <span class="card-label">Guardrails</span>
            <h2>Claims to avoid</h2>
            <ul>${narrative.claimsToAvoid.map((claim) => `<li>${esc(claim)}</li>`).join("")}</ul>
          </article>
          <article class="human-card">
            <span class="card-label">Make it yours</span>
            <h2>Add one human detail</h2>
            <ul>
              <li>What I am hearing from clients</li>
              <li>A sector-specific pressure</li>
              <li>A recent conversation theme</li>
              <li>A market observation</li>
              <li>A question worth asking</li>
            </ul>
          </article>
        </aside>
      </section>
    </section>
  `;
}

function renderProofLibrary() {
  const query = state.proofQuery.trim().toLowerCase();
  const rows = contentAssets
    .filter((item) => {
      if (!query) return true;
      return [item.title, item.summary, item.primary_topic, ...(item.proof_points ?? [])].join(" ").toLowerCase().includes(query);
    })
    .sort((a, b) => score(b) - score(a));

  return `
    <section class="proof-page">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Proof Library</span>
          <h1>Approved PwC proof partners can safely use.</h1>
          <p>A practical source of approved evidence, source links and proof readiness for partner-ready kits.</p>
        </div>
      </div>
      <label class="proof-search">
        <span>Search proof</span>
        <input id="proof-search" value="${esc(state.proofQuery)}" placeholder="Search source, topic or proof point" />
      </label>
      <div class="proof-list">
        ${rows
          .map(
            (item) => `
              <article class="proof-row">
                <div>
                  <span class="card-label">${esc(item.primary_topic)} | ${esc(item.format)}</span>
                  <h2>${esc(item.title)}</h2>
                  <p>${esc(item.summary)}</p>
                  <ul>${item.proof_points.slice(0, 2).map((proof) => `<li>${esc(proof)}</li>`).join("")}</ul>
                </div>
                <aside>
                  <span>Proof readiness</span>
                  <strong>${score(item)}/25</strong>
                  <button class="secondary-button" data-use-proof="${esc(item.id)}">Use in kit</button>
                  ${sourceLink(item)}
                </aside>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderMain() {
  if (state.view === "build") return renderBuildPage();
  if (state.view === "proof") return renderProofLibrary();
  if (state.view === "kit") return renderKitPage();
  return renderNarrativesPage();
}

function render() {
  app.innerHTML = renderShell(renderMain());
}

function selectNarrative(id) {
  state.selectedNarrativeId = id;
  state.proofIndex = 0;
}

function applySelect(id, value) {
  if (id === "sector-select") state.sector = value;
  if (id === "role-select") state.role = value;
  if (id === "moment-select") state.moment = value;
  if (id === "output-select") state.outputType = value;
  if (id === "style-select") state.style = value;
}

document.addEventListener("click", (event) => {
  const narrativeButton = event.target.closest("[data-select-narrative]");
  const viewButton = event.target.closest("[data-view]");
  const buildButton = event.target.closest("[data-build-kit]");
  const swapButton = event.target.closest("[data-swap-proof]");
  const useProofButton = event.target.closest("[data-use-proof]");
  const copyKitButton = event.target.closest("[data-copy-kit]");
  const copyBlockButton = event.target.closest("[data-copy-block]");
  const softButton = event.target.closest("[data-soft-action]");

  if (narrativeButton) {
    selectNarrative(narrativeButton.dataset.selectNarrative);
  }

  if (viewButton) {
    state.view = viewButton.dataset.view;
  }

  if (buildButton) {
    state.view = "kit";
  }

  if (swapButton) {
    state.proofIndex += 1;
  }

  if (useProofButton) {
    const proofAsset = asset(useProofButton.dataset.useProof);
    const narrative = narratives.find((item) => item.proofIds.includes(proofAsset.id));
    if (narrative) state.selectedNarrativeId = narrative.id;
    state.proofIndex = Math.max(0, selectedNarrative().proofIds.indexOf(proofAsset.id));
    state.view = "build";
  }

  if (copyKitButton) {
    navigator.clipboard?.writeText(kitBlocks().map(([title, body]) => `${title}\n${body}`).join("\n\n"));
  }

  if (copyBlockButton) {
    const card = copyBlockButton.closest(".kit-card");
    navigator.clipboard?.writeText(card?.querySelector("pre")?.textContent ?? "");
  }

  if (softButton) {
    const card = softButton.closest(".kit-card");
    card?.classList.add(softButton.dataset.softAction === "human" ? "more-human" : "shorter");
  }

  if (narrativeButton || viewButton || buildButton || swapButton || useProofButton || softButton) render();
});

document.addEventListener("change", (event) => {
  applySelect(event.target.id, event.target.value);
  render();
});

document.addEventListener("input", (event) => {
  if (event.target.id !== "proof-search") return;
  state.proofQuery = event.target.value;
  render();
});

render();
