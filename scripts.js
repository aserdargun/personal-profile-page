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

  const setActiveStep = (index) => {
    const boundedIndex = Math.max(0, Math.min(steps.length - 1, index));
    const activeStep = steps[boundedIndex];
    if (activeStep.classList.contains("is-active")) return;

    steps.forEach((step, stepIndex) => {
      step.classList.toggle("is-active", stepIndex === boundedIndex);
    });

    const progress = steps.length > 1 ? boundedIndex / (steps.length - 1) : 1;
    timeline.style.setProperty("--timeline-progress", String(progress));

    if (stageCount) stageCount.textContent = `${String(boundedIndex + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
    if (stageRole) stageRole.textContent = activeStep.dataset.stageRole || "";
    if (stageFocus) stageFocus.textContent = activeStep.dataset.stageFocus || "";

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

function initializePortrait() {
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
  let animationRunning = false;
  let portraitVisible = true;
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
    if (!portraitVisible || document.hidden) {
      animationRunning = false;
      animationFrame = 0;
      return;
    }

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
        const displacement = ((offsets[column] * (0.28 + pointerFalloff * 0.72) + idle) * pinning) + dragX;
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

  function startAnimation() {
    if (animationRunning || !portraitVisible || document.hidden) return;
    animationRunning = true;
    animationFrame = window.requestAnimationFrame(draw);
  }

  function stopAnimation() {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    animationRunning = false;
  }

  function start() {
    resize();
    wrap.classList.add("is-interactive");
    startAnimation();
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

  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(wrap);
  } else {
    window.addEventListener("resize", resize, { passive: true });
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        portraitVisible = entry.isIntersecting;
        if (portraitVisible) {
          resize();
          startAnimation();
        } else {
          stopAnimation();
        }
      },
      { threshold: 0.01 },
    ).observe(wrap);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAnimation();
    else startAnimation();
  });

  if (image.complete && image.naturalWidth) start();
  else image.addEventListener("load", start, { once: true });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeLanguageSwitch();
  initializeTimeline();
  initializePortrait();
});
