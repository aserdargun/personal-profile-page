# Learning System Atlas — Design

**Date:** 2026-08-19
**Status:** Approved
**Scope:** Express the AI Ecosystem Atlas plan as a learning system on `aserdargun.com` (root, `/en/`, `/tr/`).

## Input plan

The ecosystem atlas plan is a directed graph over the five three-letter application codes:

```text
                     AIA
              AI Ecosystem Atlas
                     │
       ┌─────────────┼─────────────┐
       │             │             │
       ▼             ▼             ▼
      GPU ────────► LLM ◄──────── USL
 Hardware          Runtime         Training
       │           Serving           │
       │             │               │
       └─────────────┼───────────────┘
                     ▼
                    CLD
               AI Infrastructure
```

- `AIA` fans out to `GPU`, `LLM`, and `USL`.
- `GPU` (hardware) and `USL` (training) both feed `LLM` (runtime serving).
- `GPU`, `LLM`, and `USL` converge on `CLD` (AI infrastructure).

## Learning-system expression

The same graph, read as a learning system instead of a product map:

1. **Orient — `aia`.** The atlas is the entry point and the compass. Before
   investing time, the learner compares AI products and developer ecosystems
   with evidence and picks the tracks worth building.
2. **Build — three parallel tracks.** Each track is a live application that is
   itself the study material:
   - `gpu` — **Hardware track** (GPU Kernel Engineering — Kernel Atlas):
     learn the machine the models run on — CUDA, Triton, GPU memory,
     profiling, kernel optimization across a 12-week atlas.
   - `llm` — **Serving track** (LLM Runtime & Serving Atlas): learn to ship
     models — runtime and serving solutions across seven architectural
     layers. This is the **hub**: hardware and training both feed it.
   - `usl` — **Training track** (Unsloth Studio Learning): learn to adapt
     models — Unsloth, LoRA, QLoRA, dataset engineering, and evaluation.
   - Feed edges carry learning dependencies: `gpu → llm` (hardware decides
     what you can serve) and `usl → llm` (the models you train become what
     you serve).
3. **Converge — `cld`.** All tracks end in infrastructure decisions:
   the Cloud Provider Cost Comparison turns the stack into a deployable
   choice — pre-tax USD costs of cloud services available from Türkiye.
4. **Loop back.** Evidence and results from every track flow back into the
   atlas, so the map the learner started with becomes the record of what
   they can now build. This feedback edge is what makes the atlas a
   *system* rather than a static map.

## Page contract

- New `<section class="learning-system" id="learning">` placed after the
  career journey section and before the signal strip, on all three pages.
- Contents: intro (kicker, heading, description), the localized ASCII flow
  diagram as decorative `<pre class="learning-diagram" aria-hidden="true">`,
  and a three-stage `<ol class="learning-flow">`:
  - Stage 01 · Orient — one `aia` node card.
  - Stage 02 · Build — `<ul class="learning-tracks">` with `gpu`, `llm`
    (hub), `usl` node cards, followed by a feed line naming
    `gpu → llm` and `usl → llm`.
  - Stage 03 · Converge — one `cld` node card plus a closing loop line.
- Every node card carries the three-letter code badge, a title, a short
  learning outcome, and a live-destination link
  `<a class="learning-node-link" href="https://<code>.aserdargun.com/" target="_blank" rel="noreferrer"><code>.aserdargun.com <span aria-hidden="true">↗</span></a>`.
- Node order is fixed: `aia`, `gpu`, `llm`, `usl`, `cld` (learning
  flow order, distinct from the application-map table order).
- Primary navigation gains a `#learning` link on all three pages.

## Localization

| Key | EN | TR |
| --- | --- | --- |
| Kicker | Learning system · AI Ecosystem Atlas | Öğrenme sistemi · AI Ekosistem Atlası |
| Heading | The atlas is a learning system. | Atlas bir öğrenme sistemidir. |
| Stage 01 | Orient | Yönünü bul |
| Stage 02 | Build · three parallel tracks | İnşa et · üç paralel rota |
| Stage 03 | Converge | Birleştir |
| Diagram labels | Hardware / Runtime / Serving / Training / AI Infrastructure | Donanım / Runtime / Servis / Eğitim / AI Altyapısı |

TR/EN external links must stay identical (same five subdomain URLs), and the
diagram is localized while remaining `aria-hidden` (the visible node cards
carry the accessible copy).

## Validation contract (`tools/validate-site.mjs`)

- Asset cache version bumps to `20260819-learning-atlas`.
- `#learning` joins the expected anchor list.
- Per locale (en, tr, and root): the section, its aria relationships, the
  localized kicker/heading, the diagram `<pre>`, node codes in order
  `aia, gpu, llm, usl, cld`, exact node-link markup and order, the
  `gpu → llm` / `usl → llm` feed markers, and the nav link are asserted.

## Boundaries

- No changes to `scripts.js`: the section is static HTML/CSS.
- The existing application-map table, career timeline, and portrait systems
  are untouched.
- Deployment stays automatic: merge to `main` publishes through the Azure
  Static Web Apps workflow.
