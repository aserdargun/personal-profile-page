(() => {
  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    const toggleBackToTop = () => {
      if (window.scrollY > 240) {
        backToTop.classList.add("is-visible");
      } else {
        backToTop.classList.remove("is-visible");
      }
    };

    toggleBackToTop();
    window.addEventListener("scroll", toggleBackToTop, { passive: true });
  }

  const viewerRoot = document.querySelector("[data-viewer]");
  if (!viewerRoot) return;

  const canvas = viewerRoot.querySelector("[data-canvas]");
  const viewport = viewerRoot.querySelector("[data-viewport]");
  if (!canvas || !viewport) {
    return;
  }
  const tooltip = viewerRoot.querySelector("[data-tooltip]");
  const tooltipLabel = viewerRoot.querySelector("[data-tooltip-label]");
  const tooltipDetail = viewerRoot.querySelector("[data-tooltip-detail]");
  const liveRegion = viewerRoot.querySelector("[data-live-region]");
  const scaleDisplay = document.querySelector("[data-scale-display]");
  const components = Array.from(viewerRoot.querySelectorAll("[data-component]"));

  const diagramWidth = Number.parseFloat(viewport?.dataset.diagramWidth || "1200");
  const diagramHeight = Number.parseFloat(viewport?.dataset.diagramHeight || "600");

  const state = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    minScale: 0.5,
    maxScale: 2.8,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    translateStart: { x: 0, y: 0 },
    activeComponent: null,
    tooltipTimer: 0
  };

  const clampScale = (value) =>
    Math.min(state.maxScale, Math.max(state.minScale, value));

  const clampTranslation = () => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const diagramPixelWidth = diagramWidth * state.scale;
    const diagramPixelHeight = diagramHeight * state.scale;
    const margin = 90;

    if (diagramPixelWidth <= rect.width) {
      state.translateX = (rect.width - diagramPixelWidth) / 2;
    } else {
      const minX = rect.width - diagramPixelWidth - margin;
      const maxX = margin;
      state.translateX = Math.min(maxX, Math.max(minX, state.translateX));
    }

    if (diagramPixelHeight <= rect.height) {
      state.translateY = (rect.height - diagramPixelHeight) / 2;
    } else {
      const minY = rect.height - diagramPixelHeight - margin;
      const maxY = margin;
      state.translateY = Math.min(maxY, Math.max(minY, state.translateY));
    }
  };

  const applyTransform = ({ clamp = true } = {}) => {
    if (clamp) {
      clampTranslation();
    }
    viewport.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
    if (scaleDisplay) {
      scaleDisplay.textContent = `${Math.round(state.scale * 100)}%`;
    }
  };

  const centerDiagram = () => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const diagramPixelWidth = diagramWidth * state.scale;
    const diagramPixelHeight = diagramHeight * state.scale;
    state.translateX = (rect.width - diagramPixelWidth) / 2;
    state.translateY = (rect.height - diagramPixelHeight) / 2;
  };

  const resetView = ({ announce = true } = {}) => {
    hideTooltip();
    state.scale = 1;
    centerDiagram();
    applyTransform({ clamp: false });
    if (announce && liveRegion) {
      liveRegion.textContent = "View reset to 100 percent scale.";
    }
  };

  const getCanvasCenter = () => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  const zoomAtPoint = (factor, clientX, clientY) => {
    const targetScale = clampScale(state.scale * factor);
    if (Math.abs(targetScale - state.scale) < 0.001) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;
    const originX = (pointerX - state.translateX) / state.scale;
    const originY = (pointerY - state.translateY) / state.scale;

    state.scale = targetScale;
    state.translateX = pointerX - originX * state.scale;
    state.translateY = pointerY - originY * state.scale;

    applyTransform();
    if (liveRegion) {
      liveRegion.textContent = `Zoom ${Math.round(state.scale * 100)} percent.`;
    }
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const factor = direction > 0 ? 1.1 : 1 / 1.1;
    zoomAtPoint(factor, event.clientX, event.clientY);
  };

  const startPan = (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    state.isPanning = true;
    state.panStart = { x: event.clientX, y: event.clientY };
    state.translateStart = { x: state.translateX, y: state.translateY };
    canvas.classList.add("is-panning");
    canvas.setPointerCapture(event.pointerId);
  };

  const movePan = (event) => {
    if (!state.isPanning) {
      return;
    }

    const deltaX = event.clientX - state.panStart.x;
    const deltaY = event.clientY - state.panStart.y;
    state.translateX = state.translateStart.x + deltaX;
    state.translateY = state.translateStart.y + deltaY;
    applyTransform();
  };

  const endPan = (event) => {
    if (!state.isPanning) {
      return;
    }

    state.isPanning = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    canvas.classList.remove("is-panning");
  };

  const showTooltip = (component, { updateLiveRegion = true } = {}) => {
    if (!tooltip || !tooltipLabel || !tooltipDetail) {
      return;
    }

    window.clearTimeout(state.tooltipTimer);

    components.forEach((node) => {
      node.classList.toggle("is-active", node === component);
    });
    state.activeComponent = component;

    const label = component.dataset.componentLabel || "Component";
    const detail = component.dataset.componentDetail || "";

    tooltipLabel.textContent = label;
    tooltipDetail.textContent = detail;
    tooltip.hidden = false;

    const componentRect = component.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const left = componentRect.left + componentRect.width / 2 - canvasRect.left;
    let top = componentRect.top - canvasRect.top;
    let flip = false;

    if (top < 120) {
      top = componentRect.bottom - canvasRect.top + 28;
      flip = true;
    }

    tooltip.style.setProperty("--tooltip-left", `${left}px`);
    tooltip.style.setProperty("--tooltip-top", `${top}px`);
    tooltip.classList.toggle("is-flip", flip);

    requestAnimationFrame(() => {
      tooltip.classList.add("is-visible");
    });

    if (updateLiveRegion && liveRegion) {
      liveRegion.textContent = `${label}. ${detail}`;
    }
  };

  const hideTooltip = () => {
    if (!tooltip) {
      return;
    }

    tooltip.classList.remove("is-visible", "is-flip");
    state.activeComponent?.classList.remove("is-active");
    state.activeComponent = null;

    window.clearTimeout(state.tooltipTimer);
    state.tooltipTimer = window.setTimeout(() => {
      tooltip.hidden = true;
    }, 200);
  };

  const handleComponentFocus = (event) => {
    showTooltip(event.currentTarget);
  };

  const handleComponentPointerOver = (event) => {
    showTooltip(event.currentTarget, { updateLiveRegion: false });
  };

  const handleComponentBlur = () => {
    hideTooltip();
  };

  const handleComponentPointerOut = (event) => {
    const component = event.currentTarget;
    if (component.contains(document.activeElement)) {
      return;
    }
    hideTooltip();
  };

  const handleComponentKeydown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showTooltip(event.currentTarget, { updateLiveRegion: true });
    }
  };

  const handleKeyboardNavigation = (event) => {
    if (event.altKey || event.metaKey || event.ctrlKey) {
      return;
    }

    const panStep = event.shiftKey ? 120 : 70;
    const zoomFactor = event.shiftKey ? 1.2 : 1.1;

    switch (event.key) {
      case "ArrowUp": {
        event.preventDefault();
        state.translateY += panStep;
        applyTransform();
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        state.translateY -= panStep;
        applyTransform();
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        state.translateX += panStep;
        applyTransform();
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        state.translateX -= panStep;
        applyTransform();
        break;
      }
      case "+":
      case "=": {
        event.preventDefault();
        const { x, y } = getCanvasCenter();
        zoomAtPoint(zoomFactor, x, y);
        break;
      }
      case "-":
      case "_": {
        event.preventDefault();
        const { x, y } = getCanvasCenter();
        zoomAtPoint(1 / zoomFactor, x, y);
        break;
      }
      case "0": {
        event.preventDefault();
        resetView();
        break;
      }
      default:
        break;
    }
  };

  const handleControlClick = (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const { x, y } = getCanvasCenter();

    if (action === "zoom-in") {
      zoomAtPoint(1.1, x, y);
    } else if (action === "zoom-out") {
      zoomAtPoint(1 / 1.1, x, y);
    } else if (action === "reset-view") {
      resetView();
    }
  };

  const handleResize = () => {
    applyTransform();
  };

  canvas.addEventListener("wheel", handleWheel, { passive: false });
  canvas.addEventListener("pointerdown", (event) => {
    if (!event.target.closest("[data-component]")) {
      hideTooltip();
    }
    startPan(event);
  });
  canvas.addEventListener("pointermove", movePan);
  canvas.addEventListener("pointerup", endPan);
  canvas.addEventListener("pointercancel", endPan);
  canvas.addEventListener("pointerleave", (event) => {
    if (state.isPanning) {
      endPan(event);
    }
  });

  viewerRoot.addEventListener("keydown", handleKeyboardNavigation);
  viewerRoot.addEventListener("click", handleControlClick);

  components.forEach((component) => {
    component.addEventListener("focus", handleComponentFocus);
    component.addEventListener("mouseenter", handleComponentPointerOver);
    component.addEventListener("mouseleave", handleComponentPointerOut);
    component.addEventListener("blur", handleComponentBlur);
    component.addEventListener("keydown", handleComponentKeydown);
  });

  window.addEventListener("resize", handleResize);

  resetView({ announce: false });
})();
