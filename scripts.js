document.documentElement.classList.add("has-js");

const LANGUAGE_STORAGE_KEY = "portfolio-language";

function storeLanguage(language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {}
}

function initializeLanguageSwitch() {
  document.querySelectorAll("[data-language-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const language = link.getAttribute("data-language-link");
      if (language !== "tr" && language !== "en") return;

      event.preventDefault();
      storeLanguage(language);
      const destination = new URL(link.href, window.location.origin);
      destination.hash = window.location.hash;
      window.location.assign(destination.href);
    });
  });
}

function initializeTimeline() {
  const timeline = document.querySelector("[data-timeline]");
  const steps = Array.from(document.querySelectorAll("[data-timeline-step]"));
  const stageSummary = document.querySelector("[data-stage-summary]");
  const stageCount = stageSummary?.querySelector("[data-stage-count]");
  const stageRole = stageSummary?.querySelector("[data-stage-role]");
  const stageFocus = stageSummary?.querySelector("[data-stage-focus]");
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (!timeline || steps.length === 0) return;

  const portraitTransition = initializeCareerPortraitTransition();

  const setActiveStep = (index) => {
    const boundedIndex = Math.max(0, Math.min(steps.length - 1, index));
    const activeStep = steps[boundedIndex];
    if (activeStep.classList.contains("is-active")) return;

    steps.forEach((step, stepIndex) => {
      step.classList.toggle("is-active", stepIndex === boundedIndex);
    });

    const progress = steps.length > 1 ? boundedIndex / (steps.length - 1) : 1;
    timeline.style.setProperty("--timeline-progress", String(progress));

    const stageNumber = activeStep.dataset.stageNumber || String(boundedIndex + 1).padStart(2, "0");
    if (stageCount) stageCount.textContent = `${stageNumber} / ${String(steps.length).padStart(2, "0")}`;
    if (stageRole) stageRole.textContent = activeStep.dataset.stageRole || "";
    if (stageFocus) stageFocus.textContent = activeStep.dataset.stageFocus || "";
    portraitTransition?.setStage(boundedIndex);

    if (!reduceMotion && typeof stageSummary?.animate === "function") {
      stageSummary.animate(
        [
          { opacity: 0.45, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
  };

  steps.forEach((step, index) => {
    if (index === 0) step.classList.add("is-visible");
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12%", threshold: 0.08 },
    );

    const activeObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight * 0.4) - Math.abs(b.boundingClientRect.top - window.innerHeight * 0.4));

        if (visibleEntries.length > 0) {
          setActiveStep(steps.indexOf(visibleEntries[0].target));
        }
      },
      { rootMargin: "-34% 0px -48%", threshold: 0 },
    );

    steps.forEach((step) => {
      revealObserver.observe(step);
      activeObserver.observe(step);
    });
  } else {
    steps.forEach((step) => step.classList.add("is-visible"));
  }

  steps[0].classList.add("is-active");
  timeline.style.setProperty("--timeline-progress", "0");
}

function initializeCareerPortraitTransition() {
  const stage = document.querySelector("[data-career-portrait]");
  const source = stage?.querySelector("[data-career-source]");
  const image = stage?.querySelector("[data-career-image]");
  const canvas = stage?.querySelector("[data-career-transition]");
  const fallback = stage?.querySelector("[data-career-fallback]");
  const steps = Array.from(document.querySelectorAll("[data-timeline-step]"));
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (!stage || !source || !image || !canvas || steps.length === 0) return null;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return null;

  const portraitCache = new Map();
  const glyphs = "01/\\|<>{}#+*";
  let transitionFrame = 0;
  let transitionToken = 0;
  let currentIndex = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resizeCanvas() {
    const bounds = stage.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  function clearTransition() {
    if (transitionFrame) cancelAnimationFrame(transitionFrame);
    transitionFrame = 0;
    resizeCanvas();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    stage.classList.remove("is-transitioning");
  }

  function loadImage(path) {
    return new Promise((resolve, reject) => {
      const portrait = new Image();
      portrait.decoding = "async";
      portrait.onload = () => resolve(portrait);
      portrait.onerror = reject;
      portrait.src = path;
    });
  }

  function preloadPortrait(webpPath, pngPath) {
    const cacheKey = `${webpPath}|${pngPath}`;
    if (portraitCache.has(cacheKey)) return portraitCache.get(cacheKey);

    const promise = loadImage(webpPath)
      .then((portrait) => ({ portrait, format: "webp" }))
      .catch(() => loadImage(pngPath).then((portrait) => ({ portrait, format: "png" })));
    portraitCache.set(cacheKey, promise);
    return promise;
  }

  function captureCurrentPortrait() {
    if (!image.complete || !image.naturalWidth || !image.naturalHeight) return null;

    const snapshot = document.createElement("canvas");
    snapshot.width = image.naturalWidth;
    snapshot.height = image.naturalHeight;
    snapshot.getContext("2d", { alpha: true })?.drawImage(image, 0, 0);
    return snapshot;
  }

  function drawContained(media, sx, sy, sw, sh, dx, dy, dw, dh) {
    const sourceRatio = sw / sh;
    const destinationRatio = dw / dh;
    let renderWidth = dw;
    let renderHeight = dh;
    let renderX = dx;
    let renderY = dy;

    if (sourceRatio > destinationRatio) {
      renderHeight = dw / sourceRatio;
      renderY += (dh - renderHeight) / 2;
    } else {
      renderWidth = dh * sourceRatio;
      renderX += (dw - renderWidth) / 2;
    }

    ctx.drawImage(media, sx, sy, sw, sh, renderX, renderY, renderWidth, renderHeight);
  }

  function drawMatrixTransition(snapshot, progress, elapsed) {
    const columns = width < 250 ? 10 : 18;
    const rows = Math.max(22, Math.round(height / 15));
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    const sourceCellWidth = snapshot.width / columns;
    const sourceCellHeight = snapshot.height / rows;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    for (let column = 0; column < columns; column += 1) {
      const columnDelay = ((column * 7) % 11) / 30;
      for (let row = 0; row < rows; row += 1) {
        const rowProgress = row / rows;
        const localProgress = (progress * 1.38) - rowProgress - columnDelay;
        if (localProgress <= 0) {
          ctx.globalAlpha = 1;
          drawContained(
            snapshot,
            column * sourceCellWidth,
            row * sourceCellHeight,
            sourceCellWidth + 1,
            sourceCellHeight + 1,
            column * cellWidth,
            row * cellHeight,
            cellWidth + 1,
            cellHeight + 1,
          );
        } else if (localProgress < 0.34) {
          ctx.globalAlpha = Math.max(0, 1 - localProgress * 3.1);
          drawContained(
            snapshot,
            column * sourceCellWidth,
            row * sourceCellHeight,
            sourceCellWidth + 1,
            sourceCellHeight + 1,
            column * cellWidth,
            row * cellHeight + localProgress * 42,
            cellWidth + 1,
            cellHeight + 1,
          );
        }
      }
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#c8ff36";
    ctx.shadowColor = "rgba(200, 255, 54, 0.5)";
    ctx.shadowBlur = 5;
    ctx.font = `700 ${Math.max(9, Math.min(13, cellWidth * 0.72))}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let column = 0; column < columns; column += 1) {
      const streamOffset = ((column * 7) % 11) / 30;
      const streamHead = (progress * 1.38) - streamOffset;
      for (let trail = 0; trail < 5; trail += 1) {
        const row = Math.floor((streamHead * rows) - trail);
        if (row < 0 || row >= rows) continue;
        const glyphIndex = Math.floor(elapsed / 42 + column * 5 + row * 3) % glyphs.length;
        ctx.globalAlpha = Math.max(0.16, 1 - trail * 0.2) * (1 - progress * 0.35);
        ctx.fillText(glyphs[glyphIndex], (column + 0.5) * cellWidth, (row + 0.5) * cellHeight);
      }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function animateTransition(snapshot, token) {
    resizeCanvas();
    stage.classList.add("is-transitioning");
    const duration = window.matchMedia?.("(max-width: 900px)").matches ? 420 : 680;
    const startedAt = performance.now();

    const drawFrame = (now) => {
      if (token !== transitionToken) return;
      const progress = Math.min(1, (now - startedAt) / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      drawMatrixTransition(snapshot, easedProgress, now - startedAt);

      if (progress < 1) {
        transitionFrame = requestAnimationFrame(drawFrame);
      } else {
        transitionFrame = 0;
        ctx.clearRect(0, 0, width, height);
        stage.classList.remove("is-transitioning");
      }
    };

    transitionFrame = requestAnimationFrame(drawFrame);
  }

  function setStage(index, options = {}) {
    const boundedIndex = Math.max(0, Math.min(steps.length - 1, index));
    if (boundedIndex === currentIndex && !options.immediate) return;

    const nextStep = steps[boundedIndex];
    const webpPath = nextStep.getAttribute("data-stage-image-webp");
    const pngPath = nextStep.getAttribute("data-stage-image-png");
    const alt = nextStep.getAttribute("data-stage-image-alt") || "";
    if (!webpPath || !pngPath) return;

    const snapshot = captureCurrentPortrait();
    transitionToken += 1;
    const token = transitionToken;
    clearTransition();

    preloadPortrait(webpPath, pngPath)
      .then(({ format }) => {
        if (token !== transitionToken) return;
        stage.classList.remove("has-image-error");
        fallback?.setAttribute("aria-hidden", "true");
        if (format === "webp") source.setAttribute("srcset", webpPath);
        else source.removeAttribute("srcset");
        image.setAttribute("src", pngPath);
        image.setAttribute("alt", alt);
        currentIndex = boundedIndex;

        if (!reduceMotion && !options.immediate && snapshot) {
          animateTransition(snapshot, token);
        }
      })
      .catch(() => {
        if (token !== transitionToken) return;
        stage.classList.add("has-image-error");
        fallback?.setAttribute("aria-hidden", "false");
      });
  }

  image.addEventListener("load", () => {
    stage.classList.remove("has-image-error");
    fallback?.setAttribute("aria-hidden", "true");
  });
  image.addEventListener("error", () => {
    stage.classList.add("has-image-error");
    fallback?.setAttribute("aria-hidden", "false");
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      if (!transitionFrame) resizeCanvas();
    }).observe(stage);
  }

  steps.slice(1).forEach((step) => {
    const webpPath = step.getAttribute("data-stage-image-webp");
    const pngPath = step.getAttribute("data-stage-image-png");
    if (webpPath && pngPath) preloadPortrait(webpPath, pngPath).catch(() => {});
  });

  resizeCanvas();
  return { setStage };
}

document.addEventListener("DOMContentLoaded", () => {
  initializeLanguageSwitch();
  initializeTimeline();
});
