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

    @media (max-width: 760px) {
      .brand-text-mark,
      .brand-text-mark img {
        width: 92px !important;
        min-width: 92px !important;
        height: 44px !important;
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
