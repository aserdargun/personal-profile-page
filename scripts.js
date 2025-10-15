// THEME TOGGLE (remembers preference)
(function () {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  const STORAGE_KEY = "theme"; // 'light' | 'dark' | null (system)

  function getStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }
  function storeTheme(value) {
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      root.setAttribute("data-theme", theme);
      btn?.setAttribute("aria-pressed", String(theme === "dark"));
      btn?.setAttribute("title", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    } else {
      root.removeAttribute("data-theme"); // follow system
      // Infer current system to set aria-pressed meaningfully
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      btn?.setAttribute("aria-pressed", String(prefersDark));
      btn?.setAttribute("title", prefersDark ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Initialize from storage
    applyTheme(getStoredTheme());

    // React to system changes when following system
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (!getStoredTheme()) applyTheme(null);
      });
    }

    // Toggle click: cycle between dark and light (explicit)
    btn?.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      storeTheme(next);
      applyTheme(next);
    });
  });
})();

// CONTACT FORM (progressive enhancement, accessible status)
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form || !status) return;

  form.addEventListener("submit", (e) => {
    if (!form.checkValidity()) {
      e.preventDefault();
      form.reportValidity();
      status.textContent = "Please fill out all required fields.";
      status.setAttribute("role", "alert");
      return;
    }
    // Simulate success (replace with real submit/XHR if needed)
    e.preventDefault();
    status.textContent = "Thanks! Your message has been sent.";
    status.setAttribute("role", "status");
    form.reset();
  });
});
