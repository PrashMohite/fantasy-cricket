let deferredPrompt;
const installBtnId = "installAppBtn";

// Listen for install eligibility
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const btn = document.getElementById(installBtnId);
  if (btn) btn.style.display = "inline-flex";
});

// Hide button if app already installed
window.addEventListener("appinstalled", () => {
  const btn = document.getElementById(installBtnId);
  if (btn) btn.style.display = "none";
  deferredPrompt = null;
});

// Install click handler
function installApp() {
  if (!deferredPrompt) {
    alert("Install option will appear when browser allows it.\n\nTip: Use Chrome menu → Add to Home Screen.");
    return;
  }

  deferredPrompt.prompt();
  deferredPrompt.userChoice.finally(() => {
    deferredPrompt = null;
  });
}
