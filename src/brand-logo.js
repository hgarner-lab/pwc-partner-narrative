const logoSrc = "./assets/pwc-logo-mark.webp?v=20260620-1";

function installBrandLogoStyles() {
  if (document.querySelector("#brand-logo-style")) return;
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
      padding: 3px 0 3px 12px !important;
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
      position: relative;
    }

    .approval-pill::before,
    .edition-pill::before,
    .small-pill::before,
    .non-action-badge::before {
      content: "";
      width: 4px;
      min-width: 4px;
      height: 22px;
      background: var(--orange);
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
    }

    .approval-pill::before {
      background: var(--green);
    }

    .edition-pill::before {
      background: var(--black);
    }

    .approval-pill i {
      display: none !important;
    }

    .spine-panel .small-pill.non-action-note,
    .small-pill.non-action-note {
      color: var(--muted) !important;
      letter-spacing: 0.04em !important;
      text-transform: none !important;
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
new MutationObserver(scheduleBrandLogo).observe(document.body, { childList: true, subtree: true });

document.addEventListener("click", () => setTimeout(applyBrandLogo, 0), true);
document.addEventListener("change", () => setTimeout(applyBrandLogo, 0), true);
