const logoSvg = `
  <svg class="pwc-logo-inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 112" role="img" aria-label="PwC">
    <rect width="220" height="112" fill="none"></rect>
    <g transform="translate(6 12)">
      <text x="0" y="82" fill="#000000" font-family="Georgia, 'Times New Roman', serif" font-size="82" font-weight="800" font-style="italic" letter-spacing="-9">pwc</text>
      <polygon points="112,7 156,7 144,25 100,25" fill="#ff4f1f"></polygon>
      <polygon points="156,0 210,0 198,18 144,18" fill="#ff4f1f"></polygon>
    </g>
  </svg>
`;

function injectLogoStyles() {
  if (document.querySelector("#force-logo-style")) return;
  const style = document.createElement("style");
  style.id = "force-logo-style";
  style.textContent = `
    .brand { gap: 0 !important; }
    .brand-line, .brand-copy { display: none !important; }
    .pwc-mark {
      display: block !important;
      width: 172px !important;
      height: 88px !important;
      min-width: 172px !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
      background: transparent !important;
      flex: 0 0 172px !important;
    }
    .pwc-mark .pwc-text,
    .pwc-mark .block,
    .pwc-mark img {
      display: none !important;
    }
    .pwc-logo-inline {
      display: block !important;
      width: 172px !important;
      height: 88px !important;
      overflow: visible !important;
    }
    @media (max-width: 760px) {
      .pwc-mark, .pwc-logo-inline {
        width: 134px !important;
        min-width: 134px !important;
        height: 70px !important;
        flex-basis: 134px !important;
      }
    }
  `;
  document.head.append(style);
}

function forceLogo() {
  injectLogoStyles();
  const mark = document.querySelector(".pwc-mark");
  if (!mark) return;
  if (!mark.querySelector(".pwc-logo-inline")) {
    mark.setAttribute("aria-label", "PwC");
    mark.classList.add("logo-loaded");
    mark.innerHTML = logoSvg;
  }
}

let scheduled = false;
function scheduleForceLogo() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    forceLogo();
  });
}

forceLogo();
new MutationObserver(scheduleForceLogo).observe(document.body, { childList: true, subtree: true });
