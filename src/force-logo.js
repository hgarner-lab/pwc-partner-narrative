function injectLogoStyles() {
  if (document.querySelector("#force-logo-style")) return;
  const style = document.createElement("style");
  style.id = "force-logo-style";
  style.textContent = `
    .brand {
      gap: 0 !important;
      align-items: center !important;
    }
    .brand-line,
    .brand-copy {
      display: none !important;
    }
    .pwc-mark {
      display: block !important;
      width: 156px !important;
      height: 84px !important;
      min-width: 156px !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
      background: transparent !important;
      flex: 0 0 156px !important;
    }
    .pwc-mark .pwc-text,
    .pwc-mark .block,
    .pwc-mark svg:not(.pwc-real-logo-svg) {
      display: none !important;
    }
    .pwc-real-logo {
      display: block !important;
      width: 156px !important;
      height: 84px !important;
      object-fit: contain !important;
      object-position: left center !important;
    }
    @media (max-width: 760px) {
      .pwc-mark {
        width: 126px !important;
        min-width: 126px !important;
        height: 68px !important;
        flex-basis: 126px !important;
      }
      .pwc-real-logo {
        width: 126px !important;
        height: 68px !important;
      }
    }
  `;
  document.head.append(style);
}

function forceLogo() {
  injectLogoStyles();
  const mark = document.querySelector(".pwc-mark");
  if (!mark) return;
  mark.setAttribute("aria-label", "PwC");
  mark.classList.add("logo-loaded");
  const src = "./assets/pwc-logo-clean-small.png?v=20260619-11";
  const current = mark.querySelector("img.pwc-real-logo");
  if (current) {
    if (!current.getAttribute("src")?.includes("pwc-logo-clean-small")) current.setAttribute("src", src);
    return;
  }
  mark.innerHTML = `<img class="pwc-real-logo" src="${src}" alt="PwC" />`;
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
