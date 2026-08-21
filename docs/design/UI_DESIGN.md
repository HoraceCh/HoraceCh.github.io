# Horace Website Design Authority v2

**Status:** Canonical working specification

> This document is the canonical design authority for Horace Website v2. It supersedes the earlier shadcn-style `UI_DESIGN.md`, which no longer matches production behavior.
>
> This is an **authority-only** document: it defines design direction, token roles, component boundaries, and implementation handoff. It does **not** assert that every v2 visual rule described here is already reflected in production. Known drift between this specification and the current implementation is owned by the downstream issues HC-26, HC-27, HC-28, and gated by HC-29.

---

## 1. Design thesis

Horace Website v2 is not a site-wide EdwinOS redesign.

The system is intentionally split into three layers:

### A. Horace Engineering Shell

Used by Home, Projects, About, Resume, Header, Footer and global navigation.

Character:

* restrained engineering interface;
* Vercel / Linear-like clarity;
* Sans UI + Mono metadata;
* low-radius geometry;
* hairline borders and very quiet elevation;
* evidence-first hierarchy rather than decorative storytelling.

### B. Edwin-derived Notes Reading Layer

Used only by Notes reading and Notes discovery surfaces.

Character:

* editorial long-form body typography;
* stronger chapter rhythm;
* softer reading surfaces;
* explicit knowledge hierarchy;
* Sans / Mono retained for controls, metadata, Outline, Backlinks and code.

### C. SKK Continuity Contract

Applies across both layers.

Character:

* stable shell;
* low-layout-shift navigation;
* native/history-friendly page behavior;
* small, local transitions only;
* progressive enhancement rather than client-router replacement.

The intended user transition is:

`engineering portfolio shell → editorial technical notebook`

The two surfaces must feel related, not identical.

---

## 2. Current authority conflict and supersession

The prior `docs/design/UI_DESIGN.md` described a generic shadcn-like system with 24px cards, 18px interactive pills and an all-Geist interface. Production `src/styles/global.css` no longer follows that geometry consistently: Home and many site components use 8px engineering containers, while Notes already has dedicated `--notes-*` tokens, a 760px reading column, 70ch prose and a sticky sidepane.

Therefore v2 supersedes the following stale assumptions:

* 24px is **not** the global card radius;
* 18px is **not** the universal interaction radius;
* all interface/body text does **not** share one global Sans role;
* the site is **not** a shadcn component showcase;
* destructive red is not a brand accent requirement;
* Notes should not inherit global Hero heading behavior.

Repository behavior that is already validated remains protected unless a downstream Issue explicitly changes it.

---

## 3. Global Shell contract

### 3.1 Production-neutral color baseline

Keep the current global palette as the engineering shell baseline.

#### Light

* `--bg: #f5f5f5`
* `--surface: #ffffff`
* `--text: #0a0a0a`
* `--muted: #707070`
* `--line: #e5e5e5`
* `--accent: #171717`

#### Dark

* `--bg: #08090a`
* `--surface: #0f1011`
* `--text: #ffffff`
* `--muted: #8a8f98`
* `--line: #23252a`
* `--accent: #d0d6e0`

Do not introduce a new saturated site-wide brand color during the Notes migration.

### 3.2 Shell typography

Global UI remains Sans-first:

```css
--font-ui:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;

--font-mono:
  "JetBrains Mono",
  ui-monospace,
  "SFMono-Regular",
  Consolas,
  monospace;
```

If JetBrains Mono is not locally available or safely loaded, retain the existing monospace fallback without blocking implementation.

Serif must never leak into Home, Projects, About, Resume, global navigation, buttons or generic cards.

### 3.3 Geometry

Default shell geometry:

* primary content containers/cards: **8px radius**;
* nested engineering surfaces: **6–8px**;
* pill geometry only for semantic capsules such as tags, status badges, compact filters or circular controls;
* do not use 18px/24px radius merely because an element is interactive or card-like.

Shadows remain whisper-quiet. Prefer border + tonal separation over elevation.

### 3.4 Global interaction

Hover motion:

* translation: maximum **1px**;
* use only where it already communicates clickability;
* no large card lifts;
* no scale animation on normal navigation or content cards.

---

## 4. Notes Reading Layer contract

### 4.1 Typography roles

Preferred Notes roles:

```css
--note-font-body:
  "Source Serif 4",
  "Noto Serif CJK SC",
  "Songti SC",
  Georgia,
  serif;

--note-font-ui:
  Inter,
  "Noto Sans CJK SC",
  system-ui,
  sans-serif;

--note-font-mono:
  "JetBrains Mono",
  ui-monospace,
  "SFMono-Regular",
  Consolas,
  monospace;
```

Rules:

* Serif: prose and document headings only;
* Sans: breadcrumbs, Properties labels, Outline, Backlinks, controls;
* Mono: code, code labels, compact metadata, technical path-like labels;
* do not adopt Caveat or a decorative handwriting role;
* do not require shipping font binaries in the repository;
* if a webfont strategy creates CLS, licensing or build risk, use the fallback stack first and treat webfont optimization separately.

### 4.2 Type scale

Target range for Notes:

| Role | Desktop | Mobile | Weight | Line height |
| --- | --- | --- | --- | --- |
| Note title / H1 | 42–48px | 32–36px | 600 | 1.12–1.18 |
| H2 | 24–26px | 22–24px | 600 | ~1.30 |
| H3 | 18–20px | 18px | 600 | ~1.38 |
| Body | 16–17px | 16px | 400 | 1.68–1.76 |
| Summary / lead | ~17px | 16px | 400 | 1.62–1.68 |
| Properties / metadata | 11–12px | 11px | 500–600 | ~1.35 |
| Outline H2 | ~14px | — | ~600 | ~1.45 |
| Outline H3 | ~13px | — | 450–500 | ~1.45 |

Notes H1 is a **document title**, not a product Hero.

### 4.3 Heading rhythm

* H1 must be calmer than the global site Hero scale.
* H2 uses larger preceding space and a low-contrast section separator.
* H3 is separated primarily by spacing and weight, not another rule.
* Heading anchors and `scroll-margin` behavior must remain intact.
* Do not use uppercase transformations for normal article headings.

### 4.4 Reading measure

* ordinary prose: **68–72ch**;
* current 70ch production behavior is already within the target contract;
* Note reading content column may remain approximately **710–760px**;
* code, tables, formulas, figures and images may use the full technical content width;
* do not narrow technical blocks to prose measure when it harms comprehension.

### 4.5 Reading surfaces

Callout / blockquote:

* low-saturation semantic surface;
* restrained border and/or left rail;
* 6–8px radius;
* no heavy shadow;
* no paper texture.

Code:

* preserve the existing Linear-like technical panel language;
* Mono body and language label;
* one clear border layer;
* copy control remains compact and functional;
* code should not become an editorial card.

Table:

* subtle surface distinction;
* hairline row/column separators;
* no heavy card chrome;
* preserve horizontal readability on small screens.

Properties:

* visually secondary to the document;
* quiet metadata, not a large dashboard card;
* labels favor Mono / small Sans;
* reduce unnecessary pill density.

Outline:

* H2 visually stronger than H3;
* H3 uses indentation + lower contrast;
* active state restores contrast and may use a thin rail;
* avoid large background highlight blocks.

Backlinks:

* preserve current grouping/context behavior;
* visually quieter than Outline and far quieter than body headings;
* treat as “Connections”, not a competing navigation product.

---

## 5. Notes Discovery contract

Primary hierarchy:

1. Start Here / entry context
2. Collections
3. Modules
4. Recent Notes
5. Browse
   * Category
   * Path
   * Tag
   * Type
   * Status
6. Archive

Rules:

* Collections / Modules are the main knowledge structure;
* taxonomy is auxiliary navigation;
* avoid equal-weight dashboard blocks for every discovery method;
* reduce pill-wall behavior;
* prefer rows, indentation, guides, path-like metadata and subtle counts;
* do not introduce a permanent 240px left file tree at the current content scale;
* do not require a client-side explorer/router.

A desktop-only cluster rail may be reconsidered only when public Notes grow to roughly 80–120 items and stable topic clusters justify the spatial cost.

---

## 6. Motion and Continuity contract

### Timing

* color / border / focus: **120–160ms**;
* control state: **140–180ms**;
* small panel state: **180–220ms**;
* page main-content transition: **160–190ms**;
* hover translate: **≤1px**;
* page translate: **≤4px**.

### Allowed

* opacity;
* transform;
* color;
* border-color;
* text-decoration-color;
* small state feedback.

### Forbidden

* `transition: all`;
* animated width / height / padding / margin / line-height;
* 700ms+ cascade entry sequences;
* whole-page Edwin animation recreation;
* forced smooth scrolling;
* ClientRouter introduced only for visual continuity;
* page-wide skeleton flashes;
* long 5s amber fragment feedback.

### Protected continuity

Do not regress:

* native/history-friendly navigation;
* browser Back / Forward;
* fragment navigation;
* Outline scrollspy;
* Backlinks;
* Copy Code;
* selective intent-based prefetch;
* native View Transition fallback behavior;
* `prefers-reduced-motion`.

### Architecture invariants

The following are retained engineering invariants and are not up for renegotiation by visual work:

* Astro static MPA;
* native, history-friendly links and fragments (no click interception for visual purposes);
* selective intent-based prefetch;
* progressive native View Transitions (with fallback);
* `prefers-reduced-motion` support.

No runtime or client-side router may be introduced for visual continuity reasons.

---

## 7. Responsive and layout contract

### Desktop

Keep the current two-column reading model:

`content + sticky sidepane`

The current production geometry of approximately 760px content + 260–320px sidepane is a valid engineering baseline.

### Tablet

* sidepane may reduce width or move below/into a collapsible reading-support area;
* never cause body measure to collapse into an uncomfortable narrow column;
* preserve DOM order and avoid layout shifts caused only by CSS reordering.

### Mobile

Reading order must prioritize:

1. breadcrumbs / context;
2. document title and summary;
3. article body;
4. supporting metadata / Outline / Backlinks according to existing responsive behavior.

No permanent multi-column navigation on mobile.

No horizontal overflow except inside intentionally scrollable technical blocks.

---

## 8. Accessibility contract

Must preserve or improve:

* visible `:focus-visible` treatment;
* keyboard access to Outline, Backlinks, Copy Code and collapsible sections;
* adequate light/dark contrast;
* reduced-motion support;
* semantic heading order;
* fragment destinations not hidden under sticky chrome;
* non-color-only active states where practical.

Visual softness must never reduce legibility below the current production baseline.

---

## 9. Component / ownership boundary

| Surface | Authority | Downstream owner |
| --- | --- | --- |
| Global shell tokens / geometry | HC-25 | future shell-specific issue |
| Notes typography / measure / heading rhythm | HC-25 spec | HC-26 |
| Callout / code / table / quote / Properties | HC-25 spec | HC-27 |
| Outline / Backlinks visual hierarchy | HC-25 spec | HC-27 |
| Notes discovery hierarchy | HC-25 spec | HC-28 |
| Final visual / functional gate | HC-29 contract | HC-29 |
| Publication schema / Obsidian pipeline | repository contract | out of scope |
| Admin integration | HC-10 / Admin project | out of scope |
| Project evidence content | HC-5–HC-9 | out of scope |

Implementation Issues may refine values inside these boundaries, but must not redefine the system architecture without returning to HC-25.

---

## 10. Do / Don’t

### Do

* preserve Horace’s engineering identity outside Notes;
* use Serif only where reading benefits from it;
* use spacing and hierarchy before decoration;
* keep metadata quiet and technical;
* let technical blocks remain wide enough to be useful;
* keep motion short and local;
* prefer CSS/tokens over imported Edwin CSS;
* verify light, dark and reduced-motion together.

### Don’t

* do not clone EdwinOS globally;
* do not globalize Source Serif;
* do not use Caveat;
* do not copy Edwin’s large legacy CSS / `!important` strategy;
* do not add permanent three-column navigation now;
* do not introduce a full-width search system in this phase;
* do not migrate to React / Next.js / ClientRouter for visual reasons;
* do not change publication contracts during HC-25–HC-29;
* do not turn Notes into a dashboard of equal-weight cards;
* do not use 24px rounded cards as the default Horace geometry.

### Not migrated from EdwinOS

The following are explicitly **not** migrated into Horace Website v2:

* EdwinOS site-wide design (full-site restyle);
* global Serif (site-wide Source Serif / editorial body outside Notes);
* Caveat / decorative handwriting;
* three-column Notes shell;
* heavy search / graph view / command palette;
* whole-page theatrical animation;
* ClientRouter, click interception, or any runtime/router introduced for visual purposes.

---

## 11. QA derivation checklist

A downstream QA reviewer should be able to derive at least these checks from this authority:

### Global leakage

* Notes Serif does not affect Home / Projects / About / Resume.
* Global H1/H2 remains unchanged unless explicitly authorized.
* Shell 8px engineering geometry remains intact.

### Reading

* prose stays within 68–72ch;
* H1 behaves like a document title;
* H2/H3 chapter hierarchy is visible;
* technical blocks retain usable width;
* Callout/Table/Quote are softer without becoming low-contrast.

### Sidepane

* Outline H2/H3 hierarchy is visible;
* active state is subtle and clear;
* Backlinks remain scannable and secondary;
* no focus clipping or sidepane overlap.

### Discovery

* Collections / Modules dominate taxonomy;
* no excessive pill wall;
* no permanent file-tree rail;
* all existing routes remain reachable.

### Continuity

* fragments;
* browser history;
* Outline;
* Backlinks;
* Copy Code;
* View Transition fallback;
* selective prefetch;
* reduced motion;
* build and layout stability.

---

## 12. Authority status and downstream ownership

This document is the canonical repository design authority for Horace Website v2. It is an **authority-only** deliverable: production Astro source, CSS, JS, components, config, content schema, Obsidian pipeline, and generated content are unchanged by this specification.

* HC-25 owns this authority: design direction, token roles, component boundaries, and implementation handoff.
* HC-26 owns Notes typography / measure / heading rhythm.
* HC-27 owns Notes reading surfaces and sidepane hierarchy.
* HC-28 owns Notes discovery / knowledge hierarchy.
* HC-29 owns the final visual / functional migration gate.

Known drift between this specification and the current production implementation is expected and is resolved by these downstream issues, not by this document. Implementation issues may refine values inside these boundaries, but must not redefine the system architecture without returning to HC-25.
