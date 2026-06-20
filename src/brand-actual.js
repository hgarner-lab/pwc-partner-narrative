function applyLogo() {
  const mark = document.querySelector(".pwc-mark");
  if (!mark) return;
  mark.setAttribute("aria-label", "PwC");
  mark.innerHTML = '<img class="pwc-real-logo" src="./assets/pwc-logo-clean-small.png?v=20260619-16" alt="PwC" />';
}

function installStyle() {
  if (document.querySelector("#pwc-actual-logo-style")) return;
  const style = document.createElement("style");
  style.id = "pwc-actual-logo-style";
  style.textContent = `.brand{gap:0!important;align-items:center!important}.brand-line,.brand-copy{display:none!important}.pwc-mark{display:block!important;width:156px!important;height:84px!important;min-width:156px!important;background:transparent!important;padding:0!important;overflow:visible!important;flex:0 0 156px!important}.pwc-mark .pwc-text,.pwc-mark .block,.pwc-mark svg{display:none!important}.pwc-real-logo{display:block!important;width:156px!important;height:84px!important;object-fit:contain!important;object-position:left center!important}`;
  document.head.append(style);
}

function run() {
  installStyle();
  applyLogo();
}

run();
new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
