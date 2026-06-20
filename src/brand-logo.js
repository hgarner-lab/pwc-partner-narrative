const logoSrc = "./assets/pwc-logo-mark.webp?v=20260620-1";

function installBrandLogoStyles() {
  document.querySelector("#brand-logo-style")?.remove();
  const style = document.createElement("style");
  style.id = "brand-logo-style";
  style.textContent = `
    .brand-text-mark {
      display: inline-flex !important;
      align-items: center !important;
      width: 112px !important;
      min-width: 112px !important;
      height: 54px !important;
      padding: 0 !important;
      background: transparent !important;
      overflow: visible !important;
      font-size: 0 !important;
      line-height: 0 !important;
      color: transparent !important;
    }

    .brand-text-mark img {
      display: block !important;
      width: 112px !important;
      height: 54px !important;
      object-fit: contain !important;
      object-position: left center !important;
    }

    .top-actions {
      align-items: stretch !important;
      gap: 18px !important;
    }

    .approval-pill,
    .edition-pill,
    .small-pill,
    .non-action-badge {
      min-height: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      color: var(--ink) !important;
      box-shadow: none !important;
      padding: 3px 0 3px 18px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: flex-start !important;
      gap: 8px !important;
      font-size: 0.78rem !important;
      font-weight: 900 !important;
      letter-spacing: 0.08em !important;
      line-height: 1.2 !important;
      text-transform: uppercase !important;
      text-decoration: none !important;
      white-space: nowrap !important;
      pointer-events: none;
      cursor: default;
      position: relative !important;
      box-sizing: border-box !important;
    }

    .approval-pill::before,
    .edition-pill::before,
    .small-pill::before,
    .non-action-badge::before {
      content: "";
      width: 4px !important;
      min-width: 4px !important;
      height: 22px !important;
      background: var(--orange);
      position: absolute !important;
      left: 0 !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      margin: 0 !important;
    }

    .approval-pill::before {
      background: var(--green) !important;
    }

    .edition-pill::before {
      background: var(--black) !important;
    }

    .approval-pill i {
      display: none !important;
    }

    .spine-panel .small-pill.non-action-note,
    .small-pill.non-action-note {
      color: var(--muted) !important;
      letter-spacing: 0.04em !important;
      text-transform: none !important;
      padding-left: 24px !important;
      position: relative !important;
    }

    .spine-panel .small-pill.non-action-note::before,
    .small-pill.non-action-note::before {
      width: 5px !important;
      min-width: 5px !important;
      height: 18px !important;
      left: 2px !important;
      top: 50% !important;
      position: absolute !important;
      transform: translateY(-50%) !important;
      margin: 0 !important;
      background: var(--orange) !important;
    }

    .spine-body {
      padding: 32px !important;
    }

    .brief-grid,
    .safety-grid,
    .coverage-strip {
      gap: 20px !important;
      margin-top: 24px !important;
    }

    .brief-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .brief-grid article:nth-child(3) {
      grid-column: 1 / -1 !important;
    }

    .safety-grid {
      grid-template-columns: 1fr !important;
    }

    .coverage-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .coverage-strip div {
      min-height: 0 !important;
    }

    .coverage-strip strong {
      font-size: 1.12rem !important;
      line-height: 1.42 !important;
    }

    .brief-grid article,
    .proof-spotlight,
    .guardrail-spotlight,
    .coverage-strip div,
    .source-proof {
      padding: 24px 26px !important;
      border-radius: 26px !important;
    }

    .brief-grid article p {
      font-size: 1.02rem !important;
      line-height: 1.58 !important;
    }

    .proof-spotlight ul,
    .guardrail-spotlight ul {
      margin-top: 18px !important;
      line-height: 1.62 !important;
    }

    .proof-spotlight li,
    .guardrail-spotlight li {
      margin-bottom: 14px !important;
    }

    .proof-spotlight h3,
    .guardrail-spotlight h3 {
      font-size: 1.45rem !important;
      line-height: 1.08 !important;
    }

    @media (min-width: 1480px) {
      .workbench {
        grid-template-columns: minmax(280px, 0.78fr) minmax(760px, 1.62fr) minmax(320px, 0.82fr) !important;
        gap: 24px !important;
      }
    }

    @media (max-width: 760px) {
      .brand-text-mark,
      .brand-text-mark img {
        width: 92px !important;
        min-width: 92px !important;
        height: 44px !important;
      }

      .top-actions {
        gap: 12px !important;
      }

      .approval-pill,
      .edition-pill,
      .small-pill,
      .non-action-badge {
        white-space: normal !important;
      }

      .spine-body {
        padding: 20px !important;
      }

      .brief-grid,
      .safety-grid,
      .coverage-strip {
        grid-template-columns: 1fr !important;
        gap: 14px !important;
        margin-top: 16px !important;
      }

      .brief-grid article:nth-child(3) {
        grid-column: auto !important;
      }

      .brief-grid article,
      .proof-spotlight,
      .guardrail-spotlight,
      .coverage-strip div,
      .source-proof {
        padding: 20px !important;
        border-radius: 22px !important;
      }
    }
  `;
  document.head.append(style);
}

function applyBrandLogo() {
  installBrandLogoStyles();
  const mark = document.querySelector(".brand-text-mark");
  if (!mark) return;
  const current = mark.querySelector("img");
  if (current && current.getAttribute("src") === logoSrc) return;
  mark.setAttribute("aria-label", "PwC");
  mark.innerHTML = `<img src="${logoSrc}" alt="PwC" />`;
}

let scheduled = false;
function scheduleBrandLogo() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    applyBrandLogo();
  });
}

applyBrandLogo();
setTimeout(applyBrandLogo, 250);
setTimeout(applyBrandLogo, 1000);
setTimeout(applyBrandLogo, 2500);
new MutationObserver(scheduleBrandLogo).observe(document.body, { childList: true, subtree: true });

document.addEventListener("click", () => setTimeout(applyBrandLogo, 0), true);
document.addEventListener("change", () => setTimeout(applyBrandLogo, 0), true);
