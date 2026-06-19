const tdaiNarratives = {
  "human-scale-ai": {
    name: "Tech-powered momentum",
    summary: "AI, data and cloud create momentum; human judgement turns it into progress people can trust.",
    coreTruth: "Technology creates momentum. Data, cloud and human judgement turn it into results.",
    tension: "Innovation is moving faster than many organisations can adapt, adopt and scale responsibly.",
    whyNow: "AI is opening new routes to reinvention and growth, but results depend on the data, cloud foundations and operating choices around it.",
    belief: "PwC helps leaders convert AI, data and technology into practical momentum: clearer choices, stronger foundations and responsible scale.",
    sectorCuts: "Financial Services, Tech, media & telecoms, UK market",
    roleCuts: "CEO, CIO / CTO, CFO, CHRO",
    moments: "Setting strategy, Scaling responsibly, Building momentum",
    claimsToAvoid: [
      "Do not frame AI as a technology deployment alone.",
      "Do not imply results are automatic without data, cloud and operating change.",
      "Do not turn the narrative into generic AI optimism."
    ]
  },
  "trust-assurance": {
    name: "Responsible scale",
    summary: "Trust, governance and assurance are what let AI move from experimentation to enterprise momentum.",
    coreTruth: "AI only scales when people can trust the system, the data and the decisions around it.",
    tension: "Leaders want speed, but unmanaged speed creates questions about accountability, controls and confidence.",
    whyNow: "As AI moves into core work, leaders need practical guardrails that support adoption rather than sitting outside it.",
    belief: "PwC can help make responsible scale operational through governance, assurance, controls and clearer decision rights.",
    sectorCuts: "Financial Services, Tech, media & telecoms, Energy",
    roleCuts: "Risk leader, CIO / CTO, CEO, CFO",
    moments: "Scaling responsibly, Delivery confidence, Market trigger",
    claimsToAvoid: [
      "Do not say governance slows AI down by default.",
      "Do not imply risk has been eliminated.",
      "Do not use regulatory or compliance language without a reviewed source."
    ]
  },
  "responsible-ai": {
    name: "Data, cloud and AI foundations",
    summary: "The quality of AI outcomes depends on the data, cloud and platform choices underneath them.",
    coreTruth: "AI performance is built on foundations: data, cloud, architecture and responsible operating models.",
    tension: "Many teams want the AI use case before they have the infrastructure, data quality or ownership to scale it.",
    whyNow: "AI is becoming embedded in how work gets done, which makes reusable foundations more valuable than isolated pilots.",
    belief: "PwC helps leaders connect AI ambition to the technical and organisational foundations needed for repeatable value.",
    sectorCuts: "Financial Services, Healthcare, Consumer Markets, Tech, media & telecoms",
    roleCuts: "CIO / CTO, Transformation leader, Risk leader, CEO",
    moments: "Setting strategy, Platform decisions, Delivery confidence",
    claimsToAvoid: [
      "Do not present responsible AI as a checklist only.",
      "Do not separate AI adoption from data and cloud foundations.",
      "Do not claim all risks or quality issues can be automated away."
    ]
  },
  "jobs-productivity": {
    name: "Human-led productivity",
    summary: "The productivity story is not just automation; it is redesigning work so people, skills and AI reinforce each other.",
    coreTruth: "Productivity gains come when work changes, not when tools are simply added.",
    tension: "AI can make teams faster, but speed without redesigned roles, skills and judgement creates shallow gains.",
    whyNow: "Executives are asking how AI changes skills, entry roles, leadership habits and workforce value creation.",
    belief: "PwC can help leaders redesign the human system around AI so productivity becomes sustainable and trusted.",
    sectorCuts: "Financial Services, Tech, media & telecoms, Consumer Markets",
    roleCuts: "CHRO, CEO, CFO, CIO / CTO",
    moments: "Workforce redesign, Exploring opportunities, Event follow-up",
    claimsToAvoid: [
      "Do not frame people as the obstacle.",
      "Do not suggest productivity is automatic.",
      "Do not ignore skills, adoption and early-career implications."
    ]
  },
  "fs-ai": {
    name: "Industry momentum: Financial Services",
    summary: "Financial Services AI needs speed, trust, data quality and controls to move together.",
    coreTruth: "In Financial Services, AI value needs confidence as much as speed.",
    tension: "Demand for AI is high, but adoption must work inside risk, trust, data and regulatory expectations.",
    whyNow: "FS leaders are moving from experimentation to applied AI across functions, workflows and client moments.",
    belief: "PwC can help FS leaders connect AI productivity, assurance, data foundations and workforce change.",
    sectorCuts: "Financial Services",
    roleCuts: "CEO, CFO, Risk leader, CIO / CTO",
    moments: "Setting strategy, Delivery confidence, Market trigger",
    claimsToAvoid: [
      "Do not overstate sector-wide maturity.",
      "Do not separate AI value from data, risk and trust.",
      "Do not make regulatory claims without the reviewed source."
    ]
  },
  "tmt-ai": {
    name: "Industry momentum: Tech, media & telecoms",
    summary: "Technology, media and telecoms companies are building AI and being reshaped by it; the scarce layer is judgement about where value moves next.",
    coreTruth: "In technology, media and telecoms, AI is close to the operating model; judgement is the scarce layer.",
    tension: "The sector may be closest to AI creation, but it still needs clear choices on growth, trust, platforms and skills.",
    whyNow: "Technology, media and telecoms leaders are facing platform shifts, skills change and new expectations for AI-enabled value.",
    belief: "PwC can help technology, media and telecoms leaders turn AI intensity into clearer choices and trusted growth.",
    sectorCuts: "Tech, media & telecoms",
    roleCuts: "CEO, CIO / CTO, CHRO, CMO",
    moments: "Exploring opportunities, Platform decisions, Market trigger",
    claimsToAvoid: [
      "Do not treat technology, media and telecoms as one uniform market.",
      "Do not imply high AI exposure means easy value capture.",
      "Do not skip the skills, trust and judgement story."
    ]
  }
};

function setText(node, value) {
  if (node && node.textContent !== value) node.textContent = value;
}

function selectedNarrativeId() {
  return document.querySelector(".narrative-card.active")?.dataset.selectNarrative || "human-scale-ai";
}

function activeUpdate() {
  return tdaiNarratives[selectedNarrativeId()] || tdaiNarratives["human-scale-ai"];
}

function patchNarrativeCards() {
  document.querySelectorAll(".narrative-card[data-select-narrative]").forEach((card) => {
    const update = tdaiNarratives[card.dataset.selectNarrative];
    if (!update) return;
    setText(card.querySelector("h3"), update.name);
    setText(card.querySelector("p"), update.summary);
  });
}

function patchBriefGrid(update) {
  document.querySelectorAll(".brief-grid article").forEach((article) => {
    const label = article.querySelector(".card-label")?.textContent || "";
    if (label.includes("Provocation")) setText(article.querySelector("p"), update.tension);
    if (label.includes("Why")) setText(article.querySelector("p"), update.whyNow);
    if (label.includes("What PwC")) setText(article.querySelector("p"), update.belief);
  });
}

function patchCoverage(update) {
  document.querySelectorAll(".coverage-strip div").forEach((item) => {
    const label = item.querySelector("span")?.textContent || "";
    if (label.includes("Sector")) setText(item.querySelector("strong"), update.sectorCuts);
    if (label.includes("Role")) setText(item.querySelector("strong"), update.roleCuts);
    if (label.includes("Moments")) setText(item.querySelector("strong"), update.moments);
  });
}

function patchClaims(update) {
  const list = document.querySelector(".guardrail-spotlight ul");
  if (!list) return;
  list.innerHTML = update.claimsToAvoid.map((claim) => `<li>${claim}</li>`).join("");
}

function patchSpine() {
  const spine = document.querySelector(".spine-panel");
  if (!spine) return;
  const update = activeUpdate();
  setText(spine.querySelector(".panel-head h2"), update.name);
  setText(spine.querySelector(".spine-hero h2"), update.coreTruth);
  setText(spine.querySelector(".spine-hero p"), update.belief);
  patchBriefGrid(update);
  patchCoverage(update);
  patchClaims(update);
  const proofLabel = spine.querySelector(".proof-spotlight .card-label");
  setText(proofLabel, "Approved TDAI proof");
}

function patchKitHeading() {
  const heading = document.querySelector(".kit-heading h1");
  if (!heading) return;
  const update = activeUpdate();
  const suffix = heading.textContent.includes(" for ") ? heading.textContent.slice(heading.textContent.indexOf(" for ")) : "";
  setText(heading, `${update.name}${suffix}`);
  const sub = document.querySelector(".kit-heading p");
  setText(sub, "Built from approved TDAI proof, safer language and clear guardrails. Make one human edit before use.");
}

function patchHero() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  setText(hero.querySelector(".eyebrow"), "PwC AI, data and tech narrative kits");
  setText(hero.querySelector("h1"), "Build your voice from PwC's technology agenda.");
  setText(hero.querySelector("p"), "Choose one AI, data and tech narrative. Add your sector, audience and moment. Leave with a partner-ready kit grounded in approved proof and clear guardrails.");
}

function patchLogo() {
  const mark = document.querySelector(".pwc-mark");
  if (!mark) return;
  mark.setAttribute("aria-label", "PwC");
  mark.classList.add("logo-loaded");
  const src = "./assets/pwc-logo.svg?v=20260619-9";
  const current = mark.querySelector("img");
  if (current) {
    if (!current.src.includes("pwc-logo.svg")) current.setAttribute("src", src);
    current.setAttribute("alt", "PwC");
  } else {
    mark.innerHTML = `<img src="${src}" alt="PwC" />`;
  }
}

function patchSourceStance() {
  const stance = document.querySelector(".source-stance span");
  setText(stance, "Partner perspective should come from PwC-hosted or approved public thought leadership. Scraped web pages and YouTube metadata remain review candidates until Marketing approves the summary and claims.");
}

function patchTdaiNarratives() {
  patchLogo();
  patchHero();
  patchNarrativeCards();
  patchSpine();
  patchKitHeading();
  patchSourceStance();
}

let scheduled = false;
function schedulePatch() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    patchTdaiNarratives();
  });
}

document.addEventListener("click", () => setTimeout(patchTdaiNarratives, 0), true);
new MutationObserver(schedulePatch).observe(document.body, { childList: true, subtree: true });
patchTdaiNarratives();
