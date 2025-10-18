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

  const wizard = document.querySelector("[data-wizard]");
  if (!wizard) return;

  const steps = Array.from(wizard.querySelectorAll(".wizard-step"));
  const progressBar = document.querySelector(".wizard-progress__bar");
  const progressItems = Array.from(document.querySelectorAll("[data-progress-step]"));
  const liveRegion = wizard.querySelector("[data-live-region]");
  const summaryFields = Array.from(wizard.querySelectorAll("[data-summary-field]"));
  const summaryActions = wizard.querySelector("[data-summary-actions]");
  const radioGroups = {
    symptom: wizard.querySelectorAll('input[name="symptom"]'),
    suction: wizard.querySelectorAll('input[name="suction"]'),
    fluid: wizard.querySelectorAll('input[name="fluid"]')
  };

  const totalSteps = steps.length;
  const stepMeta = steps.map((step, index) => ({
    index,
    hash: `#step-${index + 1}`,
    label:
      step.querySelector(".wizard-step__title")?.textContent.trim() ||
      `Step ${index + 1}`
  }));

  const answerLabels = {
    symptom: {
      noise: "Severe inlet noise",
      "low-flow": "Abrupt flow collapse",
      vibration: "High vibration at casing"
    },
    suction: {
      "below-limit": "Below NPSH limit",
      unstable: "Unstable / oscillating",
      normal: "Within expected range"
    },
    fluid: {
      gas: "Foaming / entrained gas",
      debris: "Suspended solids present",
      clear: "Clear, no visible issues"
    }
  };

  const state = {
    index: 0,
    answers: {
      symptom: null,
      suction: null,
      fluid: null
    }
  };

  const clampIndex = (index) =>
    Math.min(Math.max(index, 0), totalSteps - 1);

  const parseHash = () => {
    const hash = window.location.hash;
    const match = hash.match(/^#step-(\d+)$/);
    if (!match) return 0;
    const parsed = Number.parseInt(match[1], 10) - 1;
    return Number.isNaN(parsed) ? 0 : clampIndex(parsed);
  };

  const syncHash = (index) => {
    const targetHash = stepMeta[index]?.hash;
    if (!targetHash) return;
    if (window.location.hash === targetHash) return;
    history.replaceState(null, "", targetHash);
  };

  const toggleError = (key, shouldShow) => {
    const errorNode = wizard.querySelector(`[data-error-for="${key}"]`);
    if (!errorNode) return;
    errorNode.hidden = !shouldShow;
  };

  const buildRecommendations = ({ symptom, suction, fluid }) => {
    if (!symptom || !suction || !fluid) {
      return [
        "Complete all prior steps to generate a targeted action plan."
      ];
    }

    const suggestions = new Set();

    switch (symptom) {
      case "noise":
        suggestions.add(
          "Throttle the discharge slightly to raise system pressure and monitor noise response."
        );
        break;
      case "low-flow":
        suggestions.add(
          "Inspect discharge piping for restrictions or valves that may be choking flow."
        );
        break;
      case "vibration":
        suggestions.add(
          "Check pump mounting hardware, coupling alignment, and bearing condition."
        );
        break;
      default:
        break;
    }

    switch (suction) {
      case "below-limit":
        suggestions.add(
          "Increase suction head: open upstream valves, boost supply pressure, or raise tank level."
        );
        break;
      case "unstable":
        suggestions.add(
          "Eliminate upstream turbulence by smoothing suction piping and removing sharp elbows near the pump."
        );
        break;
      case "normal":
        suggestions.add(
          "Suction looks acceptable; focus on impeller condition and NPSH margin checks."
        );
        break;
      default:
        break;
    }

    switch (fluid) {
      case "gas":
        suggestions.add(
          "Install deaeration or a gas separation drum to strip entrained air before the pump."
        );
        break;
      case "debris":
        suggestions.add(
          "Flush the suction line and add a finer strainer to keep particulates out of the impeller."
        );
        break;
      case "clear":
        suggestions.add(
          "Fluid quality looks good; continue monitoring for entrainment during load changes."
        );
        break;
      default:
        break;
    }

    if (symptom === "noise" && suction === "below-limit") {
      suggestions.add(
        "Reduce pump speed or raise supply level to immediately restore NPSH margin and halt cavitation."
      );
    }

    if (fluid === "debris" || fluid === "gas") {
      suggestions.add(
        "Schedule an impeller inspection for pitting or erosion caused by cavitation or contamination."
      );
    }

    suggestions.add(
      "Trend vibration, noise, and suction readings over the next 24 hours to confirm resolution."
    );

    return Array.from(suggestions);
  };

  const renderSummary = () => {
    summaryFields.forEach((field) => {
      const key = field.dataset.summaryField;
      if (!key) return;
      const value = state.answers[key];
      field.textContent =
        (value && answerLabels[key]?.[value]) || "—";
    });

    summaryActions.innerHTML = "";
    buildRecommendations(state.answers).forEach((action) => {
      const item = document.createElement("li");
      item.textContent = action;
      summaryActions.appendChild(item);
    });
  };

  const updateProgress = (index) => {
    const progressPercent =
      totalSteps > 0 ? Math.round(((index + 1) / totalSteps) * 100) : 100;
    progressBar?.setAttribute("aria-valuenow", String(index + 1));
    progressBar?.setAttribute(
      "aria-valuetext",
      `Step ${index + 1} of ${totalSteps}`
    );
    progressBar?.style.setProperty("--progress", `${progressPercent}%`);

    progressItems.forEach((item, itemIndex) => {
      item.classList.toggle("is-active", itemIndex === index);
      item.classList.toggle("is-complete", itemIndex < index);
    });
  };

  const announceStep = (index) => {
    if (!liveRegion) return;
    const label = stepMeta[index]?.label ?? `Step ${index + 1}`;
    liveRegion.textContent = `Now on step ${index + 1} of ${totalSteps}: ${label}.`;
  };

  const showStep = (targetIndex, { announce = true } = {}) => {
    const nextIndex = clampIndex(targetIndex);
    if (state.index === nextIndex) {
      if (announce) {
        announceStep(nextIndex);
      }
      // Ensure summary stays current when revisiting the final step.
      if (nextIndex === totalSteps - 1) {
        renderSummary();
      }
      return;
    }

    state.index = nextIndex;

    steps.forEach((step, index) => {
      const isActive = index === nextIndex;
      step.hidden = !isActive;
      step.setAttribute("aria-hidden", String(!isActive));
      if (isActive) {
        window.requestAnimationFrame(() => step.focus());
      }
    });

    wizard
      .querySelectorAll('[data-action="back"]')
      .forEach((button) => {
        button.disabled = nextIndex === 0;
      });

    wizard
      .querySelectorAll('[data-action="next"]')
      .forEach((button) => {
        button.disabled = nextIndex >= totalSteps - 1;
      });

    updateProgress(nextIndex);
    syncHash(nextIndex);

    if (nextIndex === totalSteps - 1) {
      renderSummary();
    }

    if (announce) {
      announceStep(nextIndex);
    }
  };

  const validateStep = (index) => {
    if (index === 0) {
      const selected = wizard.querySelector('input[name="symptom"]:checked');
      toggleError("symptom", !selected);
      if (!selected) return false;
      state.answers.symptom = selected.value;
    } else if (index === 1) {
      const selected = wizard.querySelector('input[name="suction"]:checked');
      toggleError("suction", !selected);
      if (!selected) return false;
      state.answers.suction = selected.value;
    } else if (index === 2) {
      const selected = wizard.querySelector('input[name="fluid"]:checked');
      toggleError("fluid", !selected);
      if (!selected) return false;
      state.answers.fluid = selected.value;
    }

    renderSummary();
    return true;
  };

  const resetWizard = () => {
    Object.keys(state.answers).forEach((key) => {
      state.answers[key] = null;
    });

    Object.values(radioGroups).forEach((group) => {
      group.forEach((input) => {
        input.checked = false;
      });
    });

    wizard
      .querySelectorAll(".wizard-error")
      .forEach((errorNode) => {
        errorNode.hidden = true;
      });

    renderSummary();
    showStep(0, { announce: true });
  };

  wizard.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const { action } = actionButton.dataset;

    if (action === "next") {
      if (validateStep(state.index)) {
        showStep(state.index + 1);
      }
    } else if (action === "back") {
      showStep(state.index - 1);
    } else if (action === "reset") {
      resetWizard();
    }
  });

  wizard.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== "radio") return;

    const { name, value } = target;
    if (!Object.prototype.hasOwnProperty.call(state.answers, name)) return;

    state.answers[name] = value;
    toggleError(name, false);
    renderSummary();
  });

  window.addEventListener("hashchange", () => {
    const targetIndex = parseHash();
    if (targetIndex !== state.index) {
      showStep(targetIndex);
    }
  });

  // Initialise wizard to hash or first step.
  const initialIndex = parseHash();
  state.index = clampIndex(initialIndex);

  steps.forEach((step, index) => {
    const isActive = index === state.index;
    step.hidden = !isActive;
    step.setAttribute("aria-hidden", String(!isActive));
  });

  wizard
    .querySelectorAll('[data-action="back"]')
    .forEach((button) => {
      button.disabled = state.index === 0;
    });

  wizard
    .querySelectorAll('[data-action="next"]')
    .forEach((button) => {
      button.disabled = state.index >= totalSteps - 1;
    });

  updateProgress(state.index);
  renderSummary();
  syncHash(state.index);
  announceStep(state.index);
  window.requestAnimationFrame(() => {
    steps[state.index]?.focus();
  });
})();
