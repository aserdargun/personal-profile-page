// Flag JS support for progressive enhancements
document.documentElement.classList.add("has-js");

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

// BACK-TO-TOP VISIBILITY
document.addEventListener("DOMContentLoaded", () => {
  const backToTop = document.querySelector(".back-to-top");
  if (!backToTop) return;

  const toggleVisibility = () => {
    if (window.scrollY > 200) backToTop.classList.add("is-visible");
    else backToTop.classList.remove("is-visible");
  };

  toggleVisibility();
  window.addEventListener("scroll", toggleVisibility, { passive: true });
});

// MOBILE NAV TOGGLE
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menu-toggle");
  const navList = document.getElementById("primary-nav");
  if (!toggle || !navList) return;

  const closeMenu = () => {
    navList.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      navList.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");
    }
  });

  const handleEscape = (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      toggle.focus();
    }
  };
  toggle.addEventListener("keydown", handleEscape);
  navList.addEventListener("keydown", handleEscape);

  navList.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (toggle.getAttribute("aria-expanded") === "true") closeMenu();
    });
  });

  if (typeof window.matchMedia === "function") {
    const mediaQuery = window.matchMedia("(min-width: 721px)");
    const handleChange = (event) => {
      if (event.matches) closeMenu();
    };
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleChange);
    }
  }

  closeMenu();
});

// INTERACTIVE ASCII PORTRAIT
// A lightweight, image-sliced cloth effect inspired by moving type curtains.
document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.querySelector("[data-portrait-effect]");
  const image = wrap?.querySelector(".portrait-ascii");
  const canvas = wrap?.querySelector(".portrait-canvas");
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (!wrap || !image || !canvas || reduceMotion) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const columns = 30;
  const rows = 28;
  const offsets = new Float32Array(columns);
  const velocities = new Float32Array(columns);
  const pointer = {
    x: 0,
    y: 0,
    previousX: 0,
    previousY: 0,
    inside: false,
  };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let animationFrame = 0;
  let dragging = false;
  let dragAnchorX = 0;
  let dragAnchorY = 0;

  function resize() {
    const rect = wrap.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const imageRatio = image.naturalWidth / image.naturalHeight;
    const frameRatio = width / height;

    if (imageRatio > frameRatio) {
      sourceHeight = image.naturalHeight;
      sourceWidth = sourceHeight * frameRatio;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
      sourceY = 0;
    } else {
      sourceWidth = image.naturalWidth;
      sourceHeight = sourceWidth / frameRatio;
      sourceX = 0;
      sourceY = 0;
    }

    if (sourceHeight > image.naturalHeight) {
      sourceHeight = image.naturalHeight;
      sourceWidth = sourceHeight * frameRatio;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
    }

    pointer.x = width / 2;
    pointer.y = height * 0.46;
    pointer.previousX = pointer.x;
    pointer.previousY = pointer.y;
  }

  function updatePointer(event) {
    const rect = wrap.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const deltaX = x - pointer.previousX;
    const deltaY = y - pointer.previousY;

    pointer.x = x;
    pointer.y = y;
    pointer.inside = true;
    wrap.style.setProperty("--portrait-x", `${x}px`);
    wrap.style.setProperty("--portrait-y", `${y}px`);
    wrap.classList.add("is-pointer-active");

    const speed = Math.max(-22, Math.min(22, deltaX * 0.82 + deltaY * 0.16));
    const radius = Math.max(110, width * 0.28);

    for (let column = 0; column < columns; column += 1) {
      const centerX = ((column + 0.5) / columns) * width;
      const distance = Math.abs(centerX - x);
      if (distance >= radius) continue;

      const falloff = 1 - distance / radius;
      const verticalWeight = 0.35 + Math.min(1, y / height) * 0.75;
      velocities[column] += speed * falloff * falloff * verticalWeight;
    }

    pointer.previousX = x;
    pointer.previousY = y;
  }

  function draw(time) {
    const stripWidth = width / columns;
    const rowHeight = height / rows;
    const sourceStripWidth = sourceWidth / columns;
    const sourceRowHeight = sourceHeight / rows;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.filter = "contrast(1.34) brightness(0.86) saturate(0.82)";

    for (let column = 0; column < columns; column += 1) {
      velocities[column] += -offsets[column] * 0.045;
      velocities[column] *= 0.92;
      offsets[column] += velocities[column];

      const idle = Math.sin(time * 0.00072 + column * 0.46) * 0.75;
      const columnCenter = (column + 0.5) * stripWidth;

      for (let row = 0; row < rows; row += 1) {
        const rowProgress = row / Math.max(1, rows - 1);
        const rowCenter = (row + 0.5) * rowHeight;
        const pointerFalloff = pointer.inside
          ? Math.max(0, 1 - Math.abs(rowCenter - pointer.y) / Math.max(170, height * 0.28))
          : 0.28;
        const pinning = Math.pow(rowProgress, 0.9);
        const dragRadius = Math.max(230, width * 0.48);
        const dragDistance = Math.hypot(columnCenter - pointer.x, rowCenter - pointer.y);
        const dragFalloff = dragging
          ? Math.pow(Math.max(0, 1 - dragDistance / dragRadius), 1.65)
          : 0;
        const dragX = (pointer.x - dragAnchorX) * 0.34 * dragFalloff;
        const dragY = (pointer.y - dragAnchorY) * 0.13 * dragFalloff * pinning;
        const displacement =
          ((offsets[column] * (0.28 + pointerFalloff * 0.72) + idle) * pinning) + dragX;
        const lift = Math.abs(displacement) * 0.025 * pinning;

        ctx.drawImage(
          image,
          sourceX + column * sourceStripWidth,
          sourceY + row * sourceRowHeight,
          sourceStripWidth + 1,
          sourceRowHeight + 1,
          column * stripWidth + displacement,
          row * rowHeight - lift + dragY,
          stripWidth + 1.3,
          rowHeight + 1.3,
        );
      }
    }

    animationFrame = window.requestAnimationFrame(draw);
  }

  function start() {
    resize();
    wrap.classList.add("is-interactive");
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(draw);
  }

  wrap.addEventListener("pointerenter", (event) => {
    pointer.previousX = event.clientX - wrap.getBoundingClientRect().left;
    pointer.previousY = event.clientY - wrap.getBoundingClientRect().top;
    updatePointer(event);
  });
  wrap.addEventListener("pointermove", updatePointer, { passive: true });
  wrap.addEventListener("pointerleave", () => {
    pointer.inside = false;
    dragging = false;
    wrap.classList.remove("is-pointer-active", "is-dragging");
  });
  wrap.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") event.preventDefault();
    updatePointer(event);
    dragging = true;
    dragAnchorX = pointer.x;
    dragAnchorY = pointer.y;
    if (event.pointerType !== "touch") wrap.setPointerCapture?.(event.pointerId);
    wrap.classList.add("is-dragging");
  });
  window.addEventListener("pointerup", (event) => {
    if (dragging) {
      const release = Math.max(-30, Math.min(30, (pointer.x - dragAnchorX) * 0.09));
      const radius = Math.max(130, width * 0.3);
      for (let column = 0; column < columns; column += 1) {
        const centerX = ((column + 0.5) / columns) * width;
        const falloff = Math.max(0, 1 - Math.abs(centerX - pointer.x) / radius);
        velocities[column] += release * falloff * falloff;
      }
    }
    dragging = false;
    if (wrap.hasPointerCapture?.(event.pointerId)) wrap.releasePointerCapture(event.pointerId);
    wrap.classList.remove("is-dragging");
  }, { passive: true });
  image.addEventListener("dragstart", (event) => event.preventDefault());
  window.addEventListener("resize", resize, { passive: true });

  if (image.complete && image.naturalWidth) start();
  else image.addEventListener("load", start, { once: true });
});
