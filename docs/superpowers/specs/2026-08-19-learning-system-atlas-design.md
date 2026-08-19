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

## Guiding questions

Each stop of the loop carries one guiding question; the chain reads as a
single descending path that ends where it started:

1. `aia` — “What exists?”
2. `gpu` — “How does compute work?”
3. `llm` — “How do models run?”
4. `usl` — “How do models learn/change?”
5. `cld` — “How do I operate this at scale?”
6. `aia` (return) — “Where does this technology fit?”

TR: “Neler var?”, “Hesaplama nasıl çalışır?”, “Modeller nasıl
çalıştırılır?”, “Modeller nasıl öğrenir/değişir?”, “Bunu ölçekte nasıl
işletirim?”, “Bu teknoloji nereye oturur?”

## Depth plan · study order vs investment priority

Study order (how the tracks build on each other):

`aia → gpu → llm → usl → cld`

- `aia` is a **living map/index**, never “done”; it is kept current
  instead of being finished.
- `gpu` is the **foundation**: CPU vs GPU → GPU architecture → VRAM →
  memory bandwidth → CUDA/Tensor cores → precisions (FP32/FP16/BF16/FP8/
  INT8/INT4) → matrix multiplication → CUDA kernels → FlashAttention →
  KV cache → quantization → multi-GPU → tensor parallelism. One track
  feeds the next three.
- `llm` is the **main project**: model → architecture → precision →
  memory calculator → runtime → inference engine → serving → API →
  benchmark, with the engine field: Ollama · llama.cpp · vLLM · SGLang ·
  TensorRT-LLM · Transformers · MLX.
- `usl` comes after serving on purpose — from running models to changing
  them: pretrained model → dataset → tokenization → LoRA → QLoRA → SFT →
  DPO → GRPO → evaluation → merged model → LLM runtime.
- `cld` is **production, last**: model → vLLM → Docker → GPU instance →
  cloud GPU → load balancer → autoscaling → API. Once you know what you
  deploy, infrastructure stops being abstract.

Investment priority (depth beats order):

`llm 30% → gpu 25% → usl 20% → cld 15% → aia 10%`

The current center of gravity is the `gpu + llm` pair, where the
hardware meets the runtime. Cross-feed edges: `gpu → llm`,
`usl → llm`, and `llm → gpu` (inference pressure exposes the
hardware limits).

## Page contract

- New `<section class="learning-system" id="learning">` placed after the
  career journey section and before the signal strip, on all three pages.
- Contents: intro (kicker, heading, description), the localized ASCII flow
  diagram as decorative `<pre class="learning-diagram" aria-hidden="true">`
  (the diagram carries the `CLD → AIA` return edge), the study-order strip
  `<div class="learning-study">` with five `code + role` items in
  `aia → gpu → llm → usl → cld` order, and a four-stage
  `<ol class="learning-flow">`:
  - Stage 01 · Orient — one `aia` node card (living-index note + atlas
    topic chain).
  - Stage 02 · Build — `<ul class="learning-tracks">` with `gpu`, `llm`
    (hub), `usl` node cards, followed by a feed line naming
    `gpu → llm`, `usl → llm`, and `llm → gpu`.
  - Stage 03 · Converge — one `cld` node card (cloud-last note +
    deployment chain).
  - Stage 04 · Return — one dashed `aia` return card carrying the closing
    question, then the loop line.
- Every node card carries its guiding question
  (`<p class="learning-question">`), and every card except the return card
  carries a study-order badge (`<span class="learning-order">`) plus its
  topic chains (`<p class="learning-topics">`).
- After the learning section, before `</main>`, the page carries
  `<section class="learning-invest">`: a weighted five-segment bar
  (llm 30, gpu 25, usl 20, cld 15, aia 10) plus a note separating study
  order from depth priority.
- Every node card carries the three-letter code badge, a title, a short
  learning outcome, and a live-destination link
  `<a class="learning-node-link" href="https://<code>.aserdargun.com/" target="_blank" rel="noreferrer"><code>.aserdargun.com <span aria-hidden="true">↗</span></a>`.
- Node order is fixed: `aia`, `gpu`, `llm`, `usl`, `cld`, `aia`
  (learning flow order with the return edge, distinct from the
  application-map table order).
- Primary navigation gains a `#learning` link on all three pages.

## Localization

| Key | EN | TR |
| --- | --- | --- |
| Kicker | Learning system · AI Ecosystem Atlas | Öğrenme sistemi · AI Ekosistem Atlası |
| Heading | The atlas is a learning system. | Atlas bir öğrenme sistemidir. |
| Stage 01 | Orient | Yönünü bul |
| Stage 02 | Build · three parallel tracks | İnşa et · üç paralel rota |
| Stage 03 | Converge | Birleştir |
| Stage 04 | Return | Dönüş |
| Diagram labels | Hardware / Runtime / Serving / Training / AI Infrastructure | Donanım / Runtime / Servis / Eğitim / AI Altyapısı |

TR/EN external links must stay identical (same five subdomain URLs), and the
diagram is localized while remaining `aria-hidden` (the visible node cards
carry the accessible copy).

## Validation contract (`tools/validate-site.mjs`)

- Asset cache version bumps to `20260819-learning-atlas`.
- `#learning` joins the expected anchor list.
- Per locale (en, tr, and root): the section, its aria relationships, the
  localized kicker/heading, the diagram `<pre>`, node codes in order
  `aia, gpu, llm, usl, cld, aia`, exact node-link markup and order, the
  three feed markers, the six guiding questions in order, the study-order
  strip codes and localized roles, all topic chains verbatim, four stage
  labels, and the nav link are asserted.
- The investment section is asserted separately: segment codes
  `llm, gpu, usl, cld, aia`, localized percentage labels, and flex-basis
  weights `30/25/20/15/10`.

## Boundaries

- No changes to `scripts.js`: the section is static HTML/CSS.
- The existing application-map table, career timeline, and portrait systems
  are untouched.
- Deployment stays automatic: merge to `main` publishes through the Azure
  Static Web Apps workflow.
