const selectionKey = "pwc-partner-kit-selection";

const outputGuidance = {
  "LinkedIn post starter": "Open with a recognisable market tension, add one approved proof point, add one partner observation, and end with a question worth answering.",
  "Comment starter": "Do not say 'great post'. Add one useful angle, one practical implication, or one question that makes the issue feel live.",
  "Short video prompt": "Keep it to one tension, one proof point and one practical question. It should feel like a partner talking for 30 to 45 seconds, not reading a script.",
  "Client email starter": "Keep it short, specific and low-friction. Connect the proof to a client moment, then ask one easy question.",
  "Event follow-up note": "Reference the conversation, use one proof point, and offer a practical next step rather than a broad follow-up meeting.",
  "Sales talking point": "Use proof as a bridge into diagnosis. Avoid pitching; ask where the issue shows up in the client's world.",
  "Q&A prep": "Anticipate the sceptical question. Answer with one proof point, one guardrail and one safer phrase."
};

const outputLabels = Object.keys(outputGuidance);

function readStoredSelection() {
  try {
    return JSON.parse(sessionStorage.getItem(selectionKey) || "{}");
  } catch {
    return {};
  }
}

function readSelectionFromDom() {
  const existing = readStoredSelection();
  return {
    sector: document.querySelector("#sector-select")?.value || existing.sector || "Financial Services",
    role: document.querySelector("#role-select")?.value || existing.role || "CIO / CTO",
    moment: document.querySelector("#moment-select")?.value || existing.moment || "Setting strategy",
    outputType: document.querySelector("#output-select")?.value || existing.outputType || "LinkedIn post starter",
    style: document.querySelector("#style-select")?.value || existing.style || "Field note"
  };
}

function storeSelection() {
  sessionStorage.setItem(selectionKey, JSON.stringify(readSelectionFromDom()));
}

function text(value) {
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

function proofLineFromPage() {
  return text(document.querySelector(".proof-card p")?.textContent || document.querySelector(".source-proof span")?.textContent || "Use the approved PwC source shown in this kit.");
}

function sourceHrefFromPage() {
  return document.querySelector(".proof-card .text-link")?.getAttribute("href") || document.querySelector(".kit-card .text-link")?.getAttribute("href") || "#";
}

function narrativeNameFromPage() {
  const heading = document.querySelector(".kit-heading h1")?.textContent || "PwC narrative";
  return heading.split(" for ")[0].trim();
}

function styleLead(style) {
  return {
    "Field note": "One thing I am hearing from clients",
    Boardroom: "The board-level question",
    Reflective: "The point I keep coming back to",
    Practical: "A practical way to look at this",
    Direct: "The issue is simple"
  }[style] || "One thing I am hearing from clients";
}

function draftFor(type, selection, proofLine, narrative) {
  const sector = selection.sector;
  const role = selection.role;
  const moment = String(selection.moment || "client moment").toLowerCase();
  const lead = styleLead(selection.style);

  const drafts = {
    "LinkedIn post starter": `${lead}: AI is making fluent output easier to produce, but expert judgement harder to recognise.\n\nFor ${sector} leaders, the useful question is not simply how quickly teams can use AI. It is where human judgement, governance and context need to shape the decision.\n\nPwC proof to anchor it: ${proofLine}\n\nWhat is the one decision in your organisation where speed matters, but judgement matters more?`,
    "Comment starter": `${lead} is the gap between fluency and judgement.\n\nAI can help teams move faster, but ${role} clients still need to know what matters, what is risky and what is worth doing next.\n\nThe proof I would connect to this: ${proofLine}`,
    "Short video prompt": `Open with the tension:\nAI can make teams faster, but it can also make messages and decisions more generic.\n\nAdd the proof:\n${proofLine}\n\nMake it personal:\nIn ${sector}, I am seeing leaders ask where AI needs more human context, not less.\n\nClose with the question:\nWhat judgement would your team add that a generic system would miss?`,
    "Client email starter": `Hi [Name],\n\nI thought of you while reading PwC's ${narrative} narrative because it connects directly to ${moment}.\n\nThe signal I would pull out is: ${proofLine}\n\nIt made me think the sharper question is where AI needs more human context, governance and judgement before it creates confidence.\n\nWorth comparing notes?`,
    "Event follow-up note": `Thanks again for the conversation. One point that stayed with me was how quickly AI creates pressure to be both faster and more distinctive.\n\nA PwC proof point that connects: ${proofLine}\n\nA useful next step may be to map which moments need efficiency, which need assurance and which need expert judgement in the room.`,
    "Sales talking point": `Use this as the bridge:\n${proofLine}\n\nThen ask:\nWhere is AI creating more activity without enough confidence, reuse or expert judgement?\n\nListen for:\n- unclear ownership\n- weak governance\n- generic output\n- pressure to prove value\n\nSafer phrasing:\nIt may be worth pressure-testing where AI needs more human context before it scales further.`,
    "Q&A prep": `Likely question:\nHow do we know this is more than another AI productivity claim?\n\nAnswer path:\nStart with the approved PwC narrative, cite one proof point, then connect it to the ${role} agenda.\n\nProof to use:\n${proofLine}\n\nSafe answer starter:\nI would not treat this as a simple productivity story. The more useful question is where AI changes the work, the controls and the human judgement needed around it.`
  };

  return drafts[type] || drafts["LinkedIn post starter"];
}

function selectedOutputCardHtml(selection) {
  const outputType = selection.outputType || "LinkedIn post starter";
  const proofLine = proofLineFromPage();
  const narrative = narrativeNameFromPage();
  const sourceHref = sourceHrefFromPage();
  const draft = draftFor(outputType, selection, proofLine, narrative);
  return `
    <article class="kit-card selected-output-card" data-output-type="${escapeHtml(outputType)}">
      <div class="selected-output-head">
        <span class="card-label">${escapeHtml(outputType)}</span>
        <span class="output-pill">Built for ${escapeHtml(selection.style || "Field note")}</span>
      </div>
      <div class="best-practice-note"><strong>Best-practice shape</strong><span>${escapeHtml(outputGuidance[outputType] || outputGuidance["LinkedIn post starter"])}</span></div>
      <pre>${escapeHtml(draft)}</pre>
      <div class="source-proof"><strong>Source proof used</strong><span>${escapeHtml(proofLine)}</span></div>
      <p class="safer-note"><strong>Safer language:</strong> Use "may be worth exploring", "a useful question might be" or "it may be worth pressure-testing" rather than promising outcomes.</p>
      <p class="edit-note">Make one human edit before use.</p>
      <div class="kit-actions">
        <button data-copy-block>Copy</button>
        <button data-soft-action="shorter">Shorter</button>
        <button data-soft-action="human">More human</button>
        <button data-swap-proof>Use another proof</button>
        <a class="text-link" href="${escapeHtml(sourceHref)}" target="_blank" rel="noreferrer">View source</a>
      </div>
    </article>
  `;
}

function sentencesFrom(value) {
  return text(value).match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((item) => item.trim()).filter(Boolean) || [];
}

function shortenCopy(card) {
  const pre = card.querySelector("pre");
  if (!pre) return;
  const proof = text(card.querySelector(".source-proof span")?.textContent);
  const sentences = sentencesFrom(pre.textContent);
  const first = sentences[0] || "AI is making fluent output easier to produce, but expert judgement harder to recognise.";
  const second = sentences.find((sentence) => /question|useful|leaders|clients|proof|judgement/i.test(sentence) && sentence !== first) || sentences[1] || "The useful question is where human judgement needs to shape the next decision.";
  pre.textContent = `${first}\n\n${second}\n\nProof to use: ${proof}`;
  markCard(card, "Shorter version applied.");
}

function humaniseCopy(card) {
  const pre = card.querySelector("pre");
  if (!pre) return;
  const proof = text(card.querySelector(".source-proof span")?.textContent);
  const current = text(pre.textContent);
  const humanLine = "The way I would put it is this:";
  const fieldLine = "I am seeing clients move past the question of whether AI can create more output. The harder question is where human judgement still needs to shape what happens next.";
  const question = "That feels like the conversation worth having.";
  pre.textContent = `${humanLine}\n\n${fieldLine}\n\nThe proof I would use: ${proof}\n\n${question}`;
  pre.dataset.previousCopy = current;
  markCard(card, "More human version applied.");
}

function markCard(card, message) {
  card.querySelector(".interaction-note")?.remove();
  const note = document.createElement("p");
  note.className = "interaction-note";
  note.textContent = message;
  card.querySelector(".kit-actions")?.before(note);
}

async function copyText(value) {
  try {
    await navigator.clipboard?.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function showCopied(button, label = "Copied") {
  const original = button.textContent;
  button.textContent = label;
  button.classList.add("copied");
  setTimeout(() => {
    button.textContent = original;
    button.classList.remove("copied");
  }, 1300);
}

function upgradeKitPage() {
  const stack = document.querySelector(".draft-stack");
  if (!stack || !document.querySelector(".kit-page")) return;
  const selection = readStoredSelection();
  const outputType = outputLabels.includes(selection.outputType) ? selection.outputType : "LinkedIn post starter";
  const signature = [outputType, selection.sector, selection.role, selection.moment, selection.style, proofLineFromPage()].join("|");
  if (stack.dataset.upgradedSignature === signature) return;
  stack.dataset.upgradedSignature = signature;
  stack.innerHTML = selectedOutputCardHtml({ ...selection, outputType });
}

function polishLabels() {
  document.querySelectorAll(".coverage-strip span, .proof-row aside span").forEach((node) => {
    if (node.textContent.trim() === "Proof readiness") node.textContent = "Source strength";
  });
  document.querySelectorAll("p").forEach((node) => {
    node.textContent = node.textContent.replace("proof readiness", "source strength");
  });
}

function injectStyles() {
  if (document.querySelector("#kit-interactions-style")) return;
  const style = document.createElement("style");
  style.id = "kit-interactions-style";
  style.textContent = `
    .selected-output-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .output-pill { display: inline-flex; min-height: 30px; align-items: center; border: 1px solid var(--line); border-radius: 999px; padding: 0 10px; color: var(--muted); font-size: .78rem; font-weight: 800; white-space: nowrap; }
    .best-practice-note { border: 1px solid rgba(255, 79, 31, .26); border-radius: 18px; background: #fff3ea; padding: 13px 14px; margin: 0 0 14px; }
    .best-practice-note strong, .best-practice-note span { display: block; }
    .best-practice-note span { margin-top: 4px; color: var(--muted); line-height: 1.42; }
    .interaction-note { margin: 12px 0 0; color: var(--green); font-weight: 900; }
    .kit-actions button.copied, .primary-button.copied, .secondary-button.copied { background: var(--green) !important; border-color: var(--green) !important; color: #fff !important; }
  `;
  document.head.append(style);
}

function polish() {
  injectStyles();
  polishLabels();
  upgradeKitPage();
}

document.addEventListener("change", (event) => {
  if (["sector-select", "role-select", "moment-select", "output-select", "style-select"].includes(event.target.id)) {
    setTimeout(storeSelection, 0);
  }
}, true);

document.addEventListener("click", async (event) => {
  const buildButton = event.target.closest("[data-build-kit]");
  const copyKitButton = event.target.closest("[data-copy-kit]");
  const copyBlockButton = event.target.closest("[data-copy-block]");
  const softButton = event.target.closest("[data-soft-action]");

  if (buildButton) storeSelection();

  if (copyKitButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const copy = [...document.querySelectorAll(".kit-card")]
      .map((card) => `${text(card.querySelector(".card-label")?.textContent)}\n${card.querySelector("pre")?.textContent || ""}`)
      .join("\n\n");
    await copyText(copy);
    showCopied(copyKitButton);
  }

  if (copyBlockButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const card = copyBlockButton.closest(".kit-card");
    await copyText(card?.querySelector("pre")?.textContent || "");
    showCopied(copyBlockButton);
  }

  if (softButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const card = softButton.closest(".kit-card");
    if (softButton.dataset.softAction === "shorter") shortenCopy(card);
    if (softButton.dataset.softAction === "human") humaniseCopy(card);
    showCopied(softButton, "Updated");
  }
}, true);

new MutationObserver(polish).observe(document.body, { childList: true, subtree: true });
polish();
