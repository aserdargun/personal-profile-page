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
  const stageWorldLabel = stageSummary?.querySelector("[data-stage-world-label]");
  const stageRole = stageSummary?.querySelector("[data-stage-role]");
  const stageBridge = stageSummary?.querySelector("[data-stage-bridge]");
  const stageFocus = stageSummary?.querySelector("[data-stage-focus]");
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (!timeline || steps.length === 0) return;

  const portraitTransition = initializeAsciiPortraits();

  const setActiveStep = (index) => {
    const boundedIndex = Math.max(0, Math.min(steps.length - 1, index));
    const activeStep = steps[boundedIndex];
    if (activeStep.classList.contains("is-active")) return;

    steps.forEach((step, stepIndex) => {
      step.classList.toggle("is-active", stepIndex === boundedIndex);
    });

    const progress = steps.length > 1 ? boundedIndex / (steps.length - 1) : 1;
    timeline.style.setProperty("--timeline-progress", String(progress));

    const stageData = readStageData(activeStep);
    const stageNumber = stageData.number || String(boundedIndex + 1).padStart(2, "0");
    if (stageCount) stageCount.textContent = `${stageNumber} / ${String(steps.length).padStart(2, "0")}`;
    const portraitWorld = activeStep.dataset.stagePortraitMode === "pixel-analog" ? "physical" : "digital";
    if (stageSummary) stageSummary.dataset.portraitWorld = portraitWorld;
    if (stageWorldLabel) {
      const marker = portraitWorld === "physical" ? "■" : ">_";
      stageWorldLabel.textContent = `${marker} ${stageData.worldLabel}`;
    }
    if (stageRole) stageRole.textContent = stageData.role;
    if (stageBridge) stageBridge.textContent = stageData.bridge;
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

function readPortraitScale(element, attribute = "data-portrait-scale") {
  const parsed = Number.parseFloat(element?.getAttribute?.(attribute) || "1");
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : 1;
}

function readPortraitPresentation(element, attributes = {}) {
  const modeAttribute = attributes.mode || "data-portrait-mode";
  const cellAttribute = attributes.cellSize || "data-portrait-pixel-size";
  const paletteAttribute = attributes.paletteLevels || "data-portrait-palette-levels";
  const scaleAttribute = attributes.scale || "data-portrait-scale";
  const mode = element?.getAttribute?.(modeAttribute) === "pixel-analog"
    ? "pixel-analog"
    : "ascii-depth";
  const parsedCellSize = Number.parseFloat(element?.getAttribute?.(cellAttribute) || "4");
  const parsedPaletteLevels = Number.parseInt(element?.getAttribute?.(paletteAttribute) || "5", 10);
  return {
    mode,
    nominalCellSize: Number.isFinite(parsedCellSize)
      ? Math.max(3, Math.min(14, parsedCellSize))
      : 4,
    paletteLevels: Number.isFinite(parsedPaletteLevels)
      ? Math.max(2, Math.min(5, parsedPaletteLevels))
      : 5,
    scale: readPortraitScale(element, scaleAttribute),
  };
}

const STAGE_PRESENTATION_ATTRIBUTES = {
  mode: "data-stage-portrait-mode",
  cellSize: "data-stage-pixel-size",
  paletteLevels: "data-stage-palette-levels",
  scale: "data-stage-portrait-scale",
};

function readStageData(step) {
  const picture = step?.querySelector(".timeline-step-portrait");
  const source = picture?.querySelector("source");
  const image = picture?.querySelector("img");
  const world = step?.querySelector(".portrait-story-world");
  let worldLabel = "";
  if (world) {
    const label = world.cloneNode(true);
    label.querySelector('[aria-hidden="true"]')?.remove();
    worldLabel = label.textContent.trim();
  }
  return {
    number: step?.querySelector(".timeline-index")?.textContent.trim() || "",
    role: step?.querySelector("h3")?.textContent.trim() || "",
    worldLabel,
    bridge: step?.querySelector(".portrait-story-bridge")?.textContent.trim() || "",
    webp: source?.getAttribute("srcset") || "",
    png: image?.getAttribute("src") || "",
    alt: image?.getAttribute("alt") || "",
  };
}

function createCareerPortraitRenderer({ wrap, image, presentation }) {
  if (!wrap || !image) return null;
  let currentPresentation = {
    mode: "ascii-depth",
    nominalCellSize: 4,
    paletteLevels: 5,
    scale: 1,
    ...presentation,
  };

  function applyPresentation(nextPresentation = {}) {
    currentPresentation = {
      mode: nextPresentation.mode === "pixel-analog" ? "pixel-analog" : "ascii-depth",
      nominalCellSize: Math.max(3, Math.min(14, Number(nextPresentation.nominalCellSize) || 4)),
      paletteLevels: Math.max(2, Math.min(5, Number(nextPresentation.paletteLevels) || 5)),
      scale: Number.isFinite(nextPresentation.scale) && nextPresentation.scale > 0 && nextPresentation.scale <= 1
        ? nextPresentation.scale
        : 1,
    };
    wrap.setAttribute("data-portrait-render-mode", currentPresentation.mode);
    wrap.style.setProperty("--portrait-source-scale", String(currentPresentation.scale));
    wrap.style.setProperty("--portrait-pixel-size", String(currentPresentation.nominalCellSize));
    wrap.style.setProperty("--portrait-palette-levels", String(currentPresentation.paletteLevels));
  }

  applyPresentation(currentPresentation);

  const canvas = document.createElement("canvas");
  canvas.className = "ascii-portrait-canvas";
  canvas.setAttribute("aria-hidden", "true");

  const ctx = canvas.getContext("2d", { alpha: true });
  const sourceCanvas = document.createElement("canvas");
  const sourceCtx = sourceCanvas.getContext("2d", { alpha: true, willReadFrequently: true });
  if (!ctx || !sourceCtx) return null;

  wrap.append(canvas);

  const glyphs = "@%#*+=-:.";
  const phosphorPalette = ["#24420f", "#4f7618", "#82bd1d", "#c8ff36", "#efffb8"];
  const pointer = { x: 0, y: 0, previousX: 0, previousY: 0, inside: false };
  const defaultLight = { x: 0.72, y: 0.64 };
  const light = {
    x: defaultLight.x,
    y: defaultLight.y,
    targetX: defaultLight.x,
    targetY: defaultLight.y,
  };
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let cells = [];
  let offsets = new Float32Array(0);
  let velocities = new Float32Array(0);
  let columns = 0;
  let rows = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let effectiveCellSize = 2.75;
  let currentMedia = image;
  let animationFrame = 0;
  let visible = true;
  let destroyed = false;
  let resizeObserver = null;
  let visibilityObserver = null;
  let usesWindowResize = false;

  function fitSource(media) {
    const mediaWidth = media.naturalWidth || Number.parseInt(media.getAttribute?.("width"), 10) || 640;
    const mediaHeight = media.naturalHeight || Number.parseInt(media.getAttribute?.("height"), 10) || 800;
    const sourceRatio = mediaWidth / mediaHeight;
    const frameRatio = columns / rows;
    let drawWidth = columns;
    let drawHeight = rows;
    let drawX = 0;
    let drawY = 0;

    if (sourceRatio > frameRatio) {
      drawHeight = columns / sourceRatio;
      drawY = (rows - drawHeight) / 2;
    } else {
      drawWidth = rows * sourceRatio;
      drawX = (columns - drawWidth) / 2;
    }

    const centerX = drawX + drawWidth / 2;
    const centerY = drawY + drawHeight / 2;
    drawWidth *= currentPresentation.scale;
    drawHeight *= currentPresentation.scale;
    drawX = centerX - drawWidth / 2;
    drawY = centerY - drawHeight / 2;

    sourceCtx.clearRect(0, 0, columns, rows);
    sourceCtx.drawImage(media, 0, 0, mediaWidth, mediaHeight, drawX, drawY, drawWidth, drawHeight);
  }

  function sampleMedia(media) {
    const bounds = wrap.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (currentPresentation.mode === "pixel-analog") {
      effectiveCellSize = Math.max(
        3,
        Math.min(
          currentPresentation.nominalCellSize,
          currentPresentation.nominalCellSize * (width / 290),
        ),
      );
      columns = Math.max(1, Math.ceil(width / effectiveCellSize));
      rows = Math.max(1, Math.ceil(height / effectiveCellSize));
    } else {
      effectiveCellSize = 2.75;
      columns = Math.max(78, Math.min(112, Math.round(width / effectiveCellSize)));
      rows = Math.max(28, Math.round(columns * (height / width) * 0.55));
    }
    wrap.style.setProperty("--portrait-effective-cell-size", String(effectiveCellSize));

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    sourceCanvas.width = columns;
    sourceCanvas.height = rows;

    fitSource(media);
    const pixels = sourceCtx.getImageData(0, 0, columns, rows).data;
    const sampleCount = columns * rows;
    const alphas = new Float32Array(sampleCount);
    const luminances = new Float32Array(sampleCount);
    const nextCells = [];

    for (let index = 0; index < sampleCount; index += 1) {
      const offset = index * 4;
      alphas[index] = pixels[offset + 3] / 255;
      luminances[index] = (
        pixels[offset] * 0.2126
        + pixels[offset + 1] * 0.7152
        + pixels[offset + 2] * 0.0722
      ) / 255;
    }

    function sampleAt(values, row, column) {
      const boundedRow = Math.max(0, Math.min(rows - 1, row));
      const boundedColumn = Math.max(0, Math.min(columns - 1, column));
      return values[boundedRow * columns + boundedColumn];
    }

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = row * columns + column;
        const alpha = alphas[index];
        if (alpha < 0.08) continue;

        const luminance = luminances[index];
        if (currentPresentation.mode === "pixel-analog") {
          const paletteLevels = currentPresentation.paletteLevels;
          const paletteIndex = Math.min(
            paletteLevels - 1,
            Math.floor(luminance * paletteLevels),
          );
          nextCells.push({ alpha, column, luminance, paletteIndex, row });
          continue;
        }
        const horizontalEdge = Math.abs(
          sampleAt(luminances, row, column + 1) - sampleAt(luminances, row, column - 1),
        );
        const verticalEdge = Math.abs(
          sampleAt(luminances, row + 1, column) - sampleAt(luminances, row - 1, column),
        );
        const edge = Math.min(1, (horizontalEdge + verticalEdge) * 1.8);
        const depth = Math.min(1, (1 - luminance) * 0.42 + edge * 0.9);
        const glyphIndex = Math.min(glyphs.length - 1, Math.floor(luminance * glyphs.length));
        nextCells.push({
          alpha,
          column,
          depth,
          edge,
          glyph: glyphs[glyphIndex],
          luminance,
          row,
        });
      }
    }

    cells = nextCells;
    offsets = new Float32Array(columns);
    velocities = new Float32Array(columns);
    pointer.x = width / 2;
    pointer.y = height * 0.46;
    pointer.previousX = pointer.x;
    pointer.previousY = pointer.y;
  }

  function draw() {
    if (destroyed || cells.length === 0) return;

    const cellWidth = width / columns;
    const cellHeight = height / rows;
    const fontSize = cellHeight * 0.92;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (currentPresentation.mode === "pixel-analog") {
      const palette = currentPresentation.paletteLevels === 2
        ? ["#4f7618", "#c8ff36"]
        : currentPresentation.paletteLevels === 3
          ? ["#4f7618", "#82bd1d", "#c8ff36"]
          : currentPresentation.paletteLevels === 4
            ? phosphorPalette.slice(0, 4)
            : phosphorPalette;
      ctx.imageSmoothingEnabled = false;
      for (const cell of cells) {
        const centerX = (cell.column + 0.5) * effectiveCellSize;
        const centerY = (cell.row + 0.5) * effectiveCellSize;
        const pointerRadius = Math.max(36, effectiveCellSize * 5);
        const distance = Math.hypot(centerX - pointer.x, centerY - pointer.y);
        const glow = pointer.inside ? Math.max(0, 1 - distance / pointerRadius) : 0;
        const displacementX = Math.max(-0.6, Math.min(0.6, light.x * 0.5 * glow));
        const displacementY = Math.max(-0.6, Math.min(0.6, light.y * 0.5 * glow));
        const snap = (value) => Math.round(value * dpr) / dpr;
        const paletteIndex = Math.min(
          palette.length - 1,
          cell.paletteIndex + (glow >= 0.35 ? 1 : 0),
        );
        ctx.fillStyle = palette[paletteIndex];
        ctx.globalAlpha = Math.min(1, cell.alpha * (0.72 + (1 - cell.luminance) * 0.28 + glow * 0.2));
        ctx.fillRect(
          snap(cell.column * effectiveCellSize + displacementX),
          snap(cell.row * effectiveCellSize + displacementY),
          effectiveCellSize,
          effectiveCellSize,
        );
      }
      ctx.globalAlpha = 1;
      wrap.classList.add("is-ascii-rendered");
      image.classList.add("ascii-portrait-source");
      return;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

    function getCellPosition(cell) {
      const columnX = (cell.column + 0.5) * cellWidth;
      const rowY = (cell.row + 0.5) * cellHeight;
      const verticalFalloff = pointer.inside
        ? Math.max(0, 1 - Math.abs(rowY - pointer.y) / Math.max(100, height * 0.34))
        : 0.22;
      const displacement = offsets[cell.column] * (0.24 + verticalFalloff * 0.76);
      return {
        x: columnX + displacement,
        y: rowY - Math.abs(displacement) * 0.025,
      };
    }

    function drawGlyphLayer(kind, lightX, lightY) {
      for (const cell of cells) {
        const position = getCellPosition(cell);

        if (kind === "extrusion") {
          const distance = 0.45 + cell.depth * 1.55;
          ctx.fillStyle = "#24420f";
          ctx.globalAlpha = Math.min(0.72, cell.alpha * (0.28 + cell.depth * 0.42));
          ctx.fillText(
            cell.glyph,
            position.x + lightX * distance,
            position.y + lightY * distance,
          );
          continue;
        }

        if (kind === "front") {
          const brightness = 0.46 + (1 - cell.luminance) * 0.34;
          ctx.globalAlpha = Math.min(1, cell.alpha * (brightness + 0.2));
          ctx.fillStyle = cell.luminance > 0.72 ? "#efffb8" : cell.luminance > 0.42 ? "#c8ff36" : "#82bd1d";
          ctx.fillText(cell.glyph, position.x, position.y);
          continue;
        }

        if (kind === "highlight" && cell.edge >= 0.12) {
          ctx.fillStyle = "#efffb8";
          ctx.globalAlpha = Math.min(0.68, cell.alpha * cell.edge * 0.82);
          ctx.fillText(
            cell.glyph,
            position.x - lightX * 0.38,
            position.y - lightY * 0.38,
          );
        }
      }
    }

    drawGlyphLayer("extrusion", light.x, light.y);
    drawGlyphLayer("front", light.x, light.y);
    drawGlyphLayer("highlight", light.x, light.y);

    ctx.globalAlpha = 1;
    wrap.classList.add("is-ascii-rendered");
    image.classList.add("ascii-portrait-source");
  }

  function animateMotion() {
    animationFrame = 0;
    if (destroyed || !visible || document.hidden || reduceMotion) return;

    let energy = 0;
    light.x += (light.targetX - light.x) * 0.16;
    light.y += (light.targetY - light.y) * 0.16;
    energy += Math.abs(light.targetX - light.x) + Math.abs(light.targetY - light.y);
    if (currentPresentation.mode === "ascii-depth") {
      for (let column = 0; column < columns; column += 1) {
        velocities[column] += -offsets[column] * 0.055;
        velocities[column] *= 0.89;
        offsets[column] += velocities[column];
        energy += Math.abs(offsets[column]) + Math.abs(velocities[column]);
      }
    }
    draw();

    if (energy > 0.12) {
      animationFrame = window.requestAnimationFrame(animateMotion);
    }
  }

  function scheduleMotion() {
    if (animationFrame || reduceMotion || !visible || destroyed) return;
    animationFrame = window.requestAnimationFrame(animateMotion);
  }

  function updatePointer(event) {
    if (reduceMotion) return;
    const bounds = wrap.getBoundingClientRect();
    const x = Math.max(0, Math.min(width, event.clientX - bounds.left));
    const y = Math.max(0, Math.min(height, event.clientY - bounds.top));
    light.targetX = Math.max(-1.2, Math.min(1.2, ((x / width) - 0.5) * 2.4));
    light.targetY = Math.max(-1.2, Math.min(1.2, ((y / height) - 0.5) * 2.4));
    const deltaX = x - pointer.previousX;
    const deltaY = y - pointer.previousY;
    const rawSpeed = deltaX * 0.82 + deltaY * 0.18;
    const speed = Math.max(-24, Math.min(24, Math.abs(rawSpeed) < 0.5 ? 1.2 : rawSpeed));
    const radius = Math.max(78, width * 0.3);

    pointer.x = x;
    pointer.y = y;
    pointer.inside = true;
    pointer.previousX = x;
    pointer.previousY = y;
    wrap.style.setProperty("--portrait-x", `${x}px`);
    wrap.style.setProperty("--portrait-y", `${y}px`);
    wrap.classList.add("is-pointer-active");

    if (currentPresentation.mode === "ascii-depth") {
      for (let column = 0; column < columns; column += 1) {
        const centerX = (column + 0.5) / columns * width;
        const falloff = Math.max(0, 1 - Math.abs(centerX - x) / radius);
        velocities[column] += speed * falloff * falloff;
      }
    }
    scheduleMotion();
  }

  function handlePointerLeave() {
    pointer.inside = false;
    light.targetX = defaultLight.x;
    light.targetY = defaultLight.y;
    wrap.classList.remove("is-pointer-active");
    scheduleMotion();
  }

  function handleVisibilityChange() {
    if (document.hidden && animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    } else if (!document.hidden) {
      draw();
    }
  }

  function renderMedia(media) {
    if (destroyed || !media || !media.naturalWidth || !media.naturalHeight) return;
    currentMedia = media;
    try {
      sampleMedia(media);
      draw();
    } catch {
      wrap.classList.remove("is-ascii-rendered");
      image.classList.remove("ascii-portrait-source");
    }
  }

  function setImage(media, options = {}) {
    if (options.presentation) applyPresentation(options.presentation);
    currentMedia = media;
    if (media.complete && media.naturalWidth) {
      renderMedia(media);
      return;
    }
    media.addEventListener("load", () => renderMedia(media), { once: true });
  }

  function resize() {
    if (currentMedia?.naturalWidth) renderMedia(currentMedia);
  }

  function snapshot() {
    if (!wrap.classList.contains("is-ascii-rendered")) return null;
    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    copy.getContext("2d", { alpha: true })?.drawImage(canvas, 0, 0);
    return copy;
  }

  function destroy() {
    destroyed = true;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    wrap.removeEventListener("pointerenter", updatePointer);
    wrap.removeEventListener("pointermove", updatePointer);
    wrap.removeEventListener("pointerleave", handlePointerLeave);
    wrap.removeEventListener("pointerdown", updatePointer);
    window.removeEventListener("pointerup", scheduleMotion);
    if (usesWindowResize) window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }

  wrap.addEventListener("pointerenter", updatePointer, { passive: true });
  wrap.addEventListener("pointermove", updatePointer, { passive: true });
  wrap.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  wrap.addEventListener("pointerdown", updatePointer, { passive: true });
  window.addEventListener("pointerup", scheduleMotion, { passive: true });

  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);
  } else {
    usesWindowResize = true;
    window.addEventListener("resize", resize, { passive: true });
  }

  if ("IntersectionObserver" in window) {
    visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else if (visible) {
        resize();
      }
    }, { threshold: 0.01 });
    visibilityObserver.observe(wrap);
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  setImage(image);
  return { canvas, destroy, drawStatic: draw, setImage, snapshot };
}

function initializeAsciiPortraits() {
  const mobile = window.matchMedia?.("(max-width: 900px)").matches;
  if (mobile) {
    const renderers = Array.from(document.querySelectorAll(".timeline-step-portrait"))
      .map((wrap) => {
        const step = wrap.closest("[data-timeline-step]");
        return createCareerPortraitRenderer({
          wrap,
          image: wrap.querySelector("img"),
          presentation: step
            ? readPortraitPresentation(step, STAGE_PRESENTATION_ATTRIBUTES)
            : readPortraitPresentation(wrap),
        });
      })
      .filter(Boolean);
    return {
      destroy() {
        renderers.forEach((renderer) => renderer.destroy());
      },
      setStage() {},
    };
  }

  return initializeCareerPortraitTransition();
}

function initializeCareerPortraitTransition() {
  const stage = document.querySelector("[data-career-portrait]");
  const source = stage?.querySelector("[data-career-source]");
  const image = stage?.querySelector("[data-career-image]");
  const canvas = stage?.querySelector("[data-career-transition]");
  const fallback = stage?.querySelector("[data-career-fallback]");
  const steps = Array.from(document.querySelectorAll("[data-timeline-step]"));
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (!stage || !image) return null;

  const portraitRenderer = createCareerPortraitRenderer({
    wrap: stage,
    image,
    presentation: readPortraitPresentation(steps[0], STAGE_PRESENTATION_ATTRIBUTES),
  });
  if (!source || !canvas || steps.length === 0) {
    return {
      destroy() {
        portraitRenderer?.destroy();
      },
      setStage() {},
    };
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return {
      destroy() {
        portraitRenderer?.destroy();
      },
      setStage() {},
    };
  }

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
    const portraitSnapshot = portraitRenderer?.snapshot();
    if (portraitSnapshot) return portraitSnapshot;
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
    const stageData = readStageData(nextStep);
    const webpPath = stageData.webp;
    const pngPath = stageData.png;
    const alt = stageData.alt;
    const presentation = readPortraitPresentation(nextStep, STAGE_PRESENTATION_ATTRIBUTES);
    if (!webpPath || !pngPath) return;

    const snapshot = captureCurrentPortrait();
    transitionToken += 1;
    const token = transitionToken;
    clearTransition();

    preloadPortrait(webpPath, pngPath)
      .then(({ portrait, format }) => {
        if (token !== transitionToken) return;
        stage.classList.remove("has-image-error");
        fallback?.setAttribute("aria-hidden", "true");
        if (format === "webp") source.setAttribute("srcset", webpPath);
        else source.removeAttribute("srcset");
        image.setAttribute("src", pngPath);
        image.setAttribute("alt", alt);
        portraitRenderer?.setImage(portrait, { presentation });
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
    portraitRenderer?.setImage(image, {
      presentation: readPortraitPresentation(steps[currentIndex], STAGE_PRESENTATION_ATTRIBUTES),
    });
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
    const { webp: webpPath, png: pngPath } = readStageData(step);
    if (webpPath && pngPath) preloadPortrait(webpPath, pngPath).catch(() => {});
  });

  resizeCanvas();
  return {
    destroy() {
      clearTransition();
      portraitRenderer?.destroy();
    },
    setStage,
  };
}

document.addEventListener("DOMContentLoaded", () => {
  initializeLanguageSwitch();
  initializeTimeline();
});
