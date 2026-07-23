(function () {
  "use strict";

  // Soft client-side gate for casual link sharing only.
  // Not real auth: public GitHub repo / direct asset URLs remain reachable.
  const STORAGE_KEY = "openresults.unlocked.v1";
  const PASS_SHA256 =
    "34c24df580a66acd9ea14b56f960fde0d3554d73d66aa3c67bb4b25a629b4e17";

  const unlocked = () => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  };

  const markUnlocked = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  async function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function hidePage() {
    document.documentElement.classList.add("openresults-gated");
    const style = document.createElement("style");
    style.id = "openresults-gate-hide";
    style.textContent =
      "html.openresults-gated body > *:not(#openresults-gate){visibility:hidden !important}";
    document.head.appendChild(style);
  }

  function showPage() {
    document.documentElement.classList.remove("openresults-gated");
    document.getElementById("openresults-gate-hide")?.remove();
    document.getElementById("openresults-gate")?.remove();
  }

  function mountGate() {
    if (document.getElementById("openresults-gate")) return;
    hidePage();

    const root = document.createElement("div");
    root.id = "openresults-gate";
    root.innerHTML = `
      <form class="gate-card" autocomplete="off">
        <p class="gate-eyebrow">OpenResults</p>
        <h1>Password required</h1>
        <p class="gate-copy">This page hosts internal research notes. Enter the shared password to continue.</p>
        <label class="gate-label" for="openresults-gate-input">Password</label>
        <input id="openresults-gate-input" class="gate-input" type="password" inputmode="numeric" autofocus required>
        <button class="gate-button" type="submit">Unlock</button>
        <p class="gate-error" id="openresults-gate-error" hidden>Incorrect password.</p>
      </form>
    `;
    document.body.appendChild(root);

    const form = root.querySelector("form");
    const input = root.querySelector("#openresults-gate-input");
    const error = root.querySelector("#openresults-gate-error");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.hidden = true;
      const candidate = String(input.value || "").trim();
      const hash = await sha256Hex(candidate);
      if (hash !== PASS_SHA256) {
        error.hidden = false;
        input.select();
        return;
      }
      markUnlocked();
      showPage();
    });
  }

  function boot() {
    if (unlocked()) return;
    if (document.body) mountGate();
    else document.addEventListener("DOMContentLoaded", mountGate, { once: true });
  }

  boot();
})();
