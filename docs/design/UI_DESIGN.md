# Horace Website Design Authority v3

**Status:** Canonical repository design authority — principles approved with conditions.

This document supersedes Design Authority v2 after the authority-promotion QA gate passes and its exact-scope commit is created. During draft review, v2 remains authoritative. Promotion changes design authority, not production behavior: it does not assert that every rule below is implemented or authorize deployment.

The approved Horace × Edwin research informs this authority; the research report, reference sites, component catalogs, and historical implementation Issues are not competing specifications. Future Linear reconciliation must point to this repository file and its approved commit. This document does not depend on mutable Issue statuses.

## 1. Design thesis and authority vocabulary

> Horace Website is an engineering and knowledge interface whose identity is defined by real technical work, semantic hierarchy, task-appropriate spatial composition, restrained surfaces, and bounded progressive interaction.

The site remains recognizably Horace. EdwinOS, React Bits, ThreeUI, Vercel, Linear, and other references may inform individual principles; none becomes its theme or architecture by default. Unity comes from typography roles, spacing logic, hierarchy, interaction states, responsive priorities, surfaces, continuity, and evidence discipline. Different tasks need not share a layout or typeface.

Use these authority categories explicitly in implementation contracts:

| Category | Meaning | Permission |
| --- | --- | --- |
| Canonical principle | Approved intent or invariant in this document | Guides a separately authorized, scoped implementation; not permission for arbitrary edits |
| Protected baseline | Existing validated behavior or numerical range retained here | Preserve unless a subsequent approved decision explicitly replaces it |
| Component source | External example or code considered under section 11 | Does not determine Horace's design, dependency, or runtime choices |
| Runtime implementation | Concrete code, hydration, dependencies, and lifecycle ownership | Must satisfy this authority and the implementation Issue's approved scope |
| Implementation candidate | An unresolved way of satisfying a principle | `IMPLEMENTATION EVIDENCE REQUIRED`; not frozen and not authorized for production |

A principle's approval does not approve every implementation that could express it. A component-level exception cannot silently override architecture invariants. Resolve conflicts through `design_system_curator` and, for architecture/runtime changes, `project_architect`, with independent `qa_build_reviewer` review and explicit human approval.

Significant provenance labels used below are `EXISTING HORACE`, `EDWIN-DERIVED`, `SKK-DERIVED`, `EXTERNAL REFERENCE`, and `NEW SYNTHESIS`. They explain rationale, not precedence or permission.

## 2. Layer model

| Layer | Scope and responsibilities | Boundary |
| --- | --- | --- |
| A — Horace Identity & Engineering Foundations | Global palette, semantic type roles, geometry, spacing rhythm, focus, states, metadata language, accessibility, engineering identity | Engineering Shell remains the identity and shared UI owner; external themes do not replace it |
| B — Task-Specific Composition | Global principle with page-specific width, density, content hierarchy, browse/reading arrangement, support rails, indexes, responsive prioritization | Home, Projects, details, discovery, Archive, and Search can use different compositions |
| C — Notes Reading System | Notes-specific Serif role, prose measure, chapter rhythm, technical blocks, Outline, Backlinks, Properties, reading support | Does not impose Notes typography or a sidepane on ordinary shell surfaces |
| D — Continuity & Progressive Interaction | Cross-cutting stable shell, native navigation, progressive View Transitions, local feedback, truthful loading, reduced motion, minimal layout shift | Browser owns document navigation/history; components own bounded local state |

Provenance: A and C retain `EXISTING HORACE`; C also incorporates `EDWIN-DERIVED` reading principles. B is `NEW SYNTHESIS` informed by both systems. D preserves `SKK-DERIVED` and `EXISTING HORACE` contracts.

The Engineering Shell / Notes Reading Layer distinction survives as domain ownership. The former restriction of all Edwin-derived ideas to Notes does not: semantic hierarchy, task entry, disclosure, and useful supporting space apply globally. Their global applicability does not globalize Serif, import Edwin CSS, or require identical layouts.

## 3. Architecture and content invariants

Visual work must preserve:

- **Astro static MPA**, statically deployable without a site-wide application runtime.
- Native links and fragments, stable URLs and heading IDs, browser Back / Forward, and normal new-tab/link behavior. Do not intercept navigation for visual continuity.
- Progressive **native View Transitions** with normal navigation fallback; no client-side router for visual effects.
- Selective, intent-based prefetch through existing Astro capabilities; no indiscriminate page or search-index preloading.
- `prefers-reduced-motion`, usable content without animation, and minimal layout shift.
- **Pagefind** as the search engine; existing real-language indexing/query contexts, publication eligibility, and deterministic result coordination remain protected. UI quality work does not authorize engine replacement or language forcing.
- Publication/content boundaries: stable IDs/slugs, visibility and discoverability, homepage selection, canonical Note routes, generated headings, source text, assets, safe links, and Backlinks.
- Existing Obsidian sync, schema, generated content, and Website consumer contracts. Do not change inclusion rules to populate a visual layout.
- Website/Admin separation. Authentication, publication orchestration, durable ledger, provider writes, and Admin behavior are outside design implementation scope.
- Current image geometry, startup layout protections, Outline, Backlinks, Copy Code, and bounded fragment feedback.

Prefer build-time derivation of stable content, indexes, Backlinks, and asset metadata. Preserve existing implementations before proposing equivalent new infrastructure. UI libraries are eligible under section 11 only within these invariants; a local island does not turn the MPA into a SPA.

## 4. Identity and foundations

### 4.1 Palette and surfaces

Provenance: `EXISTING HORACE`.

Retain the engineering palette as a protected baseline:

| Token | Light | Dark |
| --- | --- | --- |
| `--bg` | `#f5f5f5` | `#08090a` |
| `--surface` | `#ffffff` | `#0f1011` |
| `--text` | `#0a0a0a` | `#ffffff` |
| `--muted` | `#707070` | `#8a8f98` |
| `--line` | `#e5e5e5` | `#23252a` |
| `--accent` | `#171717` | `#d0d6e0` |

Use tone, borders, and hierarchy before elevation. A surface must communicate grouping, interaction, or technical context. Neither every paragraph nor every navigation choice needs a card. Muted text must remain legible on its actual surface in both themes; transparency must not invalidate contrast. Saturated site-wide rebranding, paper textures, and imported vendor palettes are not part of v3 approval.

Keep current logo and identity assets. Public presentation must distinguish verified work, work in progress, learning systems, plans, and limitations. Never fabricate achievements, publications, experiments, demos, or personal contributions to fill a composition.

Scoped exception: the approved Home v2 Header/brand successor may use the refined outlined two-tone H. and its supplied light, dark and monochrome variants under section17.1. This exception applies to the shared Header's identity asset only. It does not replace the live Homepage H1, authorize favicon or metadata rollout, change global palette tokens or approve an artistic symbol exploration. Other identity uses retain their current baseline unless separately scoped.

### 4.2 Geometry, spacing, and states

Retain primary engineering containers at **8px radius**, nested surfaces at **6–8px**, and semantic capsules for tags, status, compact filters, pill-shaped action controls, or circular controls. A rounded control is not a reason to make all content cards 18px/24px. A new exception needs a functional role and scoped design approval.

Use the existing 8px-based spacing rhythm as a foundation, not a rule that every optical adjustment must be a multiple of eight. Related content should be closer than unrelated sections. Avoid accumulated Hero padding, repeated introductions, and empty rails that delay real content. Space must establish hierarchy or support a task.

Focus, hover, active, disabled, loading, empty, and failure states belong to the component's contract. Do not rely solely on color for location or state. Ordinary hover translation stays at most **1px**; avoid large lifts or scaling of navigation and content cards.

## 5. Semantic typography

Provenance: `EXISTING HORACE` + `EDWIN-DERIVED` + `NEW SYNTHESIS`.

Typography is assigned by meaning before page name. Establish a clear hierarchy without freezing new pixel values for every role:

| Role | Responsibility and appropriate surfaces | Family and escalation limit |
| --- | --- | --- |
| Identity | Horace name/identity entrance | Sans by default; may be the strongest display treatment, without displacing early work |
| Display | A deliberate, limited landing introduction | Sans by default; reserved emphasis, not the default for every H1 |
| Entity Title | Project and Note/document names | Sans for Projects, Serif for Note reading; below Hero emphasis; long names must wrap and remain scannable |
| Index Heading | Projects, Notes discovery, Collections, Archive and group headings | Sans; hierarchy by level, not repeated Hero-scale declarations |
| Navigation | Global, breadcrumb, Outline, Backlinks and local route controls | Sans; clear location/focus, stable metrics; no decorative display treatment |
| UI Body | Explanations, summaries outside Notes, interface guidance | Sans; readable at narrow widths and zoom, subordinate to task entry |
| Long-form Prose | Sustained Note reading | Serif primarily; body and chapter hierarchy serve reading rather than branding |
| Metadata | Dates, maturity, type, supporting properties | Small Sans or Mono where useful; secondary but not illegible; avoid duplicated status labels |
| Technical Label | Paths, identifiers, code-language labels | Mono where distinction helps; preserve identifier spelling and avoid forced decorative casing |
| Code | Inline code and code blocks | Mono; preserve text, whitespace, selection, copying, and local overflow |
| Caption | Figure, table, diagram explanation and attribution | Readable supporting Sans, or a consistent reading-context role; remain adjacent to the referenced content |
| Control / Button | Action labels, Search and interactive controls | Sans; functional weight, readable hit area, stable state changes |

Project titles and index titles must not automatically inherit Hero/display scale. Responsive adaptation must lower excessive emphasis and accommodate long English, Chinese, and mixed names without clipping, forced truncation, or hiding essential meaning. Do not shrink metadata to compensate for an overcrowded composition. Heading semantics must remain correct regardless of visual size.

Global UI remains Sans-first (Inter/system Sans); technical roles use JetBrains Mono/system Mono. Notes prose uses the existing Source Serif 4 / Noto Serif CJK SC / Songti SC / Georgia / Serif fallback intent. Named font stacks are not evidence that font files are delivered. Shipping font binaries is not required; validate actual fallback metrics, language glyphs, loading failure, licensing, and layout stability before a separate font-loading change.

Serif remains primarily a Notes long-form reading role. Shared typography principles do not authorize Serif on Home, Projects, About, Resume, navigation, or controls. A future evidence-backed, explicitly approved expansion can redefine a particular role; this document does not impose v2's absolute permanent ban on all such future evaluation. Decorative handwriting, including Caveat, is not an approved default role.

Protected Notes baseline ranges remain: body **16–17px**, line height **1.68–1.76**; document H1 **42–48px desktop / 32–36px mobile**, H2 **24–26px / 22–24px**, H3 **18–20px / approximately 18px**. These are retained reading targets, not new breakpoints or mandatory pixel equivalence across fallback fonts. Preserve legibility and chapter hierarchy; any departure needs scoped evidence and approval.

## 6. Task-specific spatial composition

> **Task determines width.**

Provenance: `NEW SYNTHESIS`, informed by `EXISTING HORACE` and `EDWIN-DERIVED` spatial roles.

| Spatial role | Purpose | Constraint |
| --- | --- | --- |
| Reading Measure | Continuous prose | Preserve **68–72ch**, with current approximately 70ch as the protected baseline; small screens use the available width without forcing this minimum |
| Technical Width | Code, tables, formulas, diagrams, figures and images | May exceed prose measure within the technical content area when comprehension requires it; preserve intentional local scrolling where necessary |
| Browse Canvas | Projects, discovery, Archive, lists/indexes and selected Home sections | May use substantially more horizontal space than prose for comparison, scanning and meaningful grouping |
| Support Rail | Outline, metadata, context, navigation, justified filters | Allocate to a real supporting task; do not add blank or redundant rails merely to fill a screen |

The current Notes content column of roughly **710–760px**, with **260–320px** support where space permits, remains a valid protected composition baseline. Those are not minimum widths on small screens, not an assertion that they fit every viewport, and not a site-wide grid mandate.

Do not force all surfaces into one `max-width`, or replace a single global limit with another universal number. In particular, v3 does not freeze a `1080px → 1440px` change. Browse width, prose measure, technical width, gutters, and support width must be evaluated separately. A wider canvas must improve a real task without lengthening all paragraphs or squeezing the reading column.

Each implementation contract must explain the task, available content, width roles, hierarchy, responsive transformations, and the evidence that the space is useful. Inspect both first-viewport access and sustained reading. Distinguish useful hierarchy, reading breathing room, structural constraints, and genuinely unused space rather than treating every margin as waste.

## 7. Information disclosure and surface contracts

Provenance: `NEW SYNTHESIS` + `EDWIN-DERIVED` + `EXISTING HORACE`.

> **Task entry before repeated explanation.**

Each major surface must answer: Where am I? What can I do here? What is the primary content? What supporting context is optional? Introductory context is useful when it adds information; repeated labels, summaries, and explanations must not push actual destinations unnecessarily below the fold.

| Surface | Primary task and composition authority | Protected boundary |
| --- | --- | --- |
| Home | Identity first, Selected Work early, evidence/projects before decorative storytelling; concise paths into deeper content | Truthful maturity, real selection/links and identity; reducing repeated identity/focus statements is valid intent, not an exact redesign |
| Projects | Scan inspectable work and distinguish projects, learning systems and plans | Publication selection, maturity and limitations; do not fabricate evidence or inflate categories |
| Project Detail | Understand purpose, contribution, decisions, results, limitations and supporting artifacts | Entity Title scale; metadata supports the narrative; no mandatory Notes-style sidepane |
| Notes Discovery | Enter Collections, Modules, individual Notes and recent work directly | Knowledge hierarchy remains primary; taxonomy is auxiliary; preserve routes, membership, counts and canonical flat Note URLs |
| Archive | Scan the complete eligible static index in a deterministic order | Compact lists/rows may improve scanning; do not silently change membership/order or impose Edwin's chronological cover wall |
| Search | Find eligible public content, judge relevance and navigate | Pagefind and language/publication contracts; dialog behavior is local enhancement |
| About / Resume / Contact | Background, audience-appropriate summary, and clear contact routes | Confirmed facts and distinct page purposes; content ownership is separate from visual foundations |
| Links / legacy routes / 404 | Reach relationships, compatible destinations and recovery paths | Preserve useful URLs and recovery links; implementation details should not dominate visitor-facing copy |

Discovery may use short entry context, Collections, Modules, Recent Notes, auxiliary Browse/Explore and Archive without reproducing a rigid stack of equal-weight explanation blocks. Preserve the main/auxiliary distinction; no permanent file-tree rail or client-side explorer is authorized by v3. Reconsider a navigation rail only with actual stable topic clusters, content scale and usage evidence; an old item-count threshold is not automatic approval.

**Homepage: `IMPLEMENTATION EVIDENCE REQUIRED`.** No exact Homepage v3 composition is frozen. Reconcile the HC-40 contract evidence, HC-57 candidate evidence and responsive baselines before approving a successor composition. Recover the original contract or obtain explicit approval for a successor that identifies the rules it replaces. This authority neither integrates the HC-57 candidate nor changes its gate result; it makes no assumption about its current Issue status.

## 8. Notes Reading System

Provenance: `EXISTING HORACE` + `EDWIN-DERIVED`.

- Notes are article-first. Serif serves prose and document headings; Sans serves navigation/controls; Mono serves code and compact technical metadata.
- A Note H1 is a document title. H2 has stronger preceding space and a quiet separator; H3 relies primarily on spacing, indentation where appropriate, and weight. Preserve heading IDs, anchors, semantic order and scroll margins; no uppercase transformations on normal article headings.
- Preserve the reading measure and technical exceptions in section 6. Do not narrow a useful code block, table or diagram to paragraph measure or globally widen prose to consume a screen.
- Callout/blockquote surfaces remain low-saturation with restrained border/rail, **6–8px** radius and no heavy shadow or paper texture. Code retains a clear technical panel, readable syntax, truthful language labels and functional copy feedback. Tables use subtle headers/dividers and usable local overflow.
- Properties are secondary, quiet supporting metadata; optional context should not dominate the document. Outline distinguishes H2/H3, communicates the active location without excessive chrome, and preserves scrollspy and focus behavior. Backlinks retain grouping and context, remain scannable, and do not compete with the main document.
- Preserve the desktop content + sticky **reading sidepane** model where it fits; this does not authorize a sticky global Header. At narrower widths, substitute an accessible collapsible Outline near the beginning of reading and move optional supporting material appropriately. Keep breadcrumbs, title/summary and body priority; do not bury the only orientation aid after a long article.
- Responsive substitutes must not create duplicate focusable/announced navigation or conflicting active states. Preserve keyboard activation, heading focus after selection, collapse behavior and logical reading order.
- Preserve native fragment navigation and bounded target identification feedback. Existing conditional nearest scrolling for a promoted target that remains outside the viewport is distinct from forced page-wide smooth scrolling; reduced motion uses immediate positioning. No rewritten URLs/history/heading IDs or imported Edwin scrolling runtime.
- Preserve original code/Notes text and publication artifacts. Resolve summary repetition through an approved presentation/content-owner decision, not a silent rewrite of generated source.

## 9. Header, Search, and continuity

### 9.1 Header principles

Global navigation must be easy to locate; Search must be discoverable; the current location must be understandable. Chrome and content should remain visually related without compromising legibility. Focused controls and fragment destinations must remain visible. Small-screen navigation must work with touch, keyboard, zoom and long labels.

Sticky Header, drawer conversion, Progressive Glass, multi-layer backdrop blur, and new or expanded runtime geometry measurement are **implementation candidates**, not authorized changes. Preserve current validated focus/current-link reveal and deferred startup measurements; do not misread this restriction as an instruction to remove existing accessibility behavior. A future Issue may propose a bounded experiment only with explicit approval, a fallback, measured cost and fragment/focus evidence.

Progressive Glass is `EXTERNAL REFERENCE` inspiration documented in the Edwin research; gradual visual separation is not a requirement to reproduce its layers, blur values, height or DOM injection.

The owner-selected Home v2 Header successor is the scoped exception in section17.2. Existing Header behavior is the migration baseline; the selected future presentation is A+C Minimal Progressive Glass, enhanced desktop v2 and the accepted mobile direction. Sticky access, glass material and mobile disclosure are authorized for that bounded successor only after its readiness exits and exact-candidate evidence. This exception does not authorize automatic Edwin layer/capsule/geometry import or unrelated Header experiments.




### 9.2 Search experience

Keep Pagefind and its existing retrieval/publication boundaries. The Search owner must provide:

- Safe, readable titles and excerpts with useful, controlled highlight rendering; upstream markup is not trusted for unrestricted DOM insertion. Search content must not execute code or pollute accessible names with serialization details.
- A discoverable native route/trigger and a useful non-JavaScript route to browse eligible content.
- Accessible dialog naming, labeled input, keyboard entry/result navigation/activation, visible focus, Escape/close behavior and appropriate focus restoration.
- Truthful loading, empty, success and failure states; recoverable timeouts/retries; bounded listeners, polling and pending work; protection against stale/out-of-order responses.
- Responsive results and controls usable with the virtual keyboard, safe areas, zoom and local scrolling; restore background scrolling correctly after closing.
- Reduced-motion support and readable light/dark states. Search presentation does not change which content is eligible for publication or retrieval.

Individual defects and candidate patches belong to implementation follow-up, not the normative authority or historical release records. A dialog need not adopt a vendor command palette or a new router.

### 9.3 Motion and navigation baseline

Provenance: `SKK-DERIVED` + `EXISTING HORACE`.

Preserve current short, local, functional, interruptible interaction. Retained ranges are **120–160ms** for color/border/focus, **140–180ms** for control state, **180–220ms** for small panels, **≤1px** ordinary hover translation and **≤4px** page translation. The validated native main-content transition uses **110ms exit / 180ms enter**; v2's generic **160–190ms** page range is not a requirement to lengthen the exit.

Use opacity/transform for movement and explicit color/border/text-decoration transitions for local feedback. Do not use `transition: all`, animated layout dimensions/spacing/line-height, page-wide skeleton flashes, long cascade entrances, theatrical whole-page recreation, or forced smooth scrolling. Bounded reading feedback is not a page entrance animation.

Third-party animation does not override these rules. A proposed duration/effect outside them must explain its comprehension benefit, interruption and reduced-motion behavior, then receive scoped approval before adoption. Major motion effects remain evidence-gated. Without motion support or with reduced-motion preference, essential content, location and actions must remain usable.

## 10. Accessibility, responsiveness, and performance

### 10.1 Accessibility

External components are not presumed accessible. Preserve or improve semantic structure, heading order, accessible names, keyboard support, visible focus, screen-reader behavior, light/dark contrast, forced-colors compatibility, non-color-only location/state cues, reduced motion, zoom/reflow, touch, and fallback states as applicable. Optional visuals must not become the sole explanation of engineering evidence or the only navigation mechanism. Visual polish cannot override accessibility.

### 10.2 Responsive evidence

For each affected surface, state what will **shrink, collapse, substitute, reprioritize, hide, or scroll**, and why. Preserve logical DOM/focus order; hidden content must not contain the only available action. No permanent multi-column mobile navigation. Avoid unintended document-level horizontal overflow; deliberate local navigation/technical scrolling must remain operable and must not hide focus.

Validation viewports include **320, 390, 430, 768, 1280/1366, 1440**, plus a large desktop when width changes warrant it. These are QA sampling points, **not newly approved CSS breakpoints**. Test light/dark, reduced motion, keyboard/touch, zoom/reflow and the affected breakpoint boundaries. New exact widths and responsive breakpoints require candidate evidence and an approved scoped specification; retain the current implementation until then.

### 10.3 Performance

> **UI quality is judged after interaction cost, accessibility, and layout stability—not before them.**

Preserve existing repository budgets and validated layout/startup protections. Do not invent universal new budgets here or treat historical benchmark scores as current production proof. Future Issues may establish measured, task-specific budgets with environment, baseline, candidate, limits and fallback recorded.

For library-derived or otherwise significant interaction, evaluate as relevant: JS added, hydration, initial render, LCP impact, CLS, INP, layout/paint, GPU/WebGL work, idle CPU, loading strategy and mobile fallback. Measure against a comparable baseline; distinguish actual speed from perceived continuity. Do not add heavy runtime for decoration that can be expressed in CSS or small local JS. Stable content should remain available before optional enhancement loads or if it fails.

## 11. External UI component and library adoption policy

Provenance: `NEW SYNTHESIS` + `EXTERNAL REFERENCE`.

External libraries and component sources **are allowed for evaluation and scoped adoption**. They are subordinate to this authority, repository architecture and task permissions. Inclusion in this section is not a dependency approval, an installation instruction, or permission to change production. Other reputable sources may be evaluated by the same rules; named vendors receive no exemption.

### 11.1 Adoption levels

Classify each pattern and its actual implementation separately. Do not label copied source as “reference only,” or hide imported runtime dependencies under “source adaptation.” Where an adaptation retains external runtime packages, record the source level and apply Level 4 review to those dependencies as well. The isolated framework runtime expressly considered at Level 3 is reviewed through the Level 3 architecture gate; additional full UI/runtime libraries also require Level 4.

| Level | Approach | Admission requirements |
| --- | --- | --- |
| **0 — Reference Only** | Study visuals, motion, interaction or composition; import no source | Preferred for conceptual value; identify the principle and reference, not a mandate to imitate |
| **1 — Native Reimplementation** | Express the principle through Astro, HTML, CSS, minimal vanilla JS and existing utilities | Preferred when cleanly feasible; Horace owns semantics, states, lifecycle and QA; no hidden framework/dependency import |
| **2 — Source Adaptation** | Adapt a selected component into Horace-owned code | Review the specific source license and attribution, minimize/remove dependencies, preserve accessibility, add reduced-motion support where needed, record upstream identity and significant changes; no blind vendor paste |
| **3 — Isolated Framework Island** | A locally hydrated component through an explicitly approved Astro integration | Meaningful UX benefit that cannot reasonably be reproduced natively; local hydration only; measured bundle/hydration cost; accessibility and reduced-motion fallback; no navigation/runtime dependency for the rest of the static site |
| **4 — Runtime Dependency** | Install a full external UI/runtime library | Separate architecture decision and explicit approval covering exact capability, native alternatives, bundle/hydration/layout/paint cost, accessibility, mobile behavior, reduced motion, maintenance, dependency security, license and failure fallback |

Level 3 is an **evaluation path**, not current approval for React or `@astrojs/react`. It requires a scoped architecture/integration decision and human approval before adding packages or retaining an implementation. Essential page content and navigation remain static and independently usable. Isolated React must not authorize site-wide React, Next.js, ClientRouter, or a global client lifecycle.

Level 4 is the highest-cost option, not the automatic default. A library's popularity, demo quality, or existing dependency in its own repository does not justify its adoption here. Evaluate exact direct/transitive dependencies and ownership; preserve a practical fallback/removal path.

### 11.2 Selection matrix

This matrix supports judgment; it is not an automatic algorithm or approval gate by itself. Runtime dependencies still require the applicable level review.

| Question | Native | Adapt source | Island | Reject |
| --- | --- | --- | --- | --- |
| Can CSS/HTML solve it cleanly? | Prefer | — | — | — |
| Needs small local JS? | Prefer | Possible | — | — |
| Needs React-specific lifecycle? | — | Possible if dependence can be removed | Consider | — |
| Needs WebGL / Three? | — | — | Consider isolated capability | Possible |
| Pure decoration with high runtime cost? | — | — | — | Prefer |
| Improves engineering storytelling? | Possible | Possible | Consider | — |
| Materially harms reduced-motion/accessibility? | — | — | — | Prefer |

A WebGL capability need not require React; choose the smallest justified implementation, then apply the actual source/runtime levels. “Consider” always retains evidence and approval requirements.

### 11.3 React Bits

Candidate references: [React Bits repository](https://github.com/DavidHDev/react-bits) and [component catalog](https://reactbits.dev/).

Use React Bits as an interaction/animation reference, source-level inspiration, or a selectively evaluated component. Review individual components, not the catalog as one approved package. A simple hover/text treatment should use scoped CSS or small JS when React adds no essential capability.

Inspect any proposed GSAP, Motion, Three.js, React Three Fiber, physics, Lenis, postprocessing or gesture dependency individually. Do not assume these dependencies are required by every component or should be installed together. Before source adaptation, review the actual component/version license and any additional terms, preserve required notices/attribution, and record the decision. This authority does not grant a blanket license clearance.

### 11.4 ThreeUI and WebGL

Candidate references: [ThreeUI repository](https://github.com/MengTo/threeui) and [ThreeUI site](https://threeui.com/).

Evaluate ThreeUI for spatial composition, technical visualization, isolated visual storytelling, or explicitly approved hero experiments. Three.js/WebGL is justified only when spatial or interactive content materially helps understanding: robotics visualization, mechanism exploration, inspectable 3D project evidence or selected engineering demonstrations are possible cases, not pre-approved surfaces.

Ordinary navigation, buttons, project lists/cards, decorative page backgrounds and normal Notes reading normally do not justify WebGL. Do not introduce ThreeUI simply to decorate text or navigation. Inspect the exact source/version and license; catalog visibility does not establish redistribution rights.

Every proposed WebGL surface must specify a meaningful static fallback, reduced-motion strategy, keyboard/accessibility treatment, mobile fallback, loading/error strategy and explicit measured performance budget. Include resource cleanup and idle behavior; the essential engineering explanation must survive unsupported WebGL, loading failure or disabled enhancement. All ThreeUI/WebGL production surfaces remain `IMPLEMENTATION EVIDENCE REQUIRED`.

### 11.5 Provenance and component acceptance record

Before adopting external code or an externally derived pattern, record:

- Component / pattern and the user task it serves.
- Source project and source URL.
- Source version or commit when practical.
- License, relevant terms, and required attribution/notices; for Level 0, note no code imported and any reused-asset licensing separately.
- Adoption level, including any additional runtime-dependency level.
- Horace adaptation and significant changes; rejected native alternatives where relevant.
- Direct/transitive dependencies and local ownership/maintenance responsibility.
- Accessibility, keyboard, fallback and reduced-motion notes.
- Performance/loading notes, measurements or the required evidence plan.
- QA owner, scope, acceptance criteria and approval record.

Keep provenance with the component's implementation evidence or documentation. A reference-study record can be brief; runtime adoption needs complete evidence. Neither an upstream update nor its suggested installation command authorizes package changes. Review future upstream changes against the adapted Horace contract rather than blindly resynchronizing vendor code.

## 12. Evidence-gated decisions — not frozen

All rows below are **`IMPLEMENTATION EVIDENCE REQUIRED`**. Canonical principles are approved; these concrete choices are not. An explicitly authorized investigation may compare candidates; this authority alone does not authorize retained UI changes, dependencies, integration or release.

| Candidate | Required decision evidence |
| --- | --- |
| Sticky Header | Task/navigation benefit, viewport height, focus and fragment visibility, scroll/paint cost, fallback |
| Drawer Header / major navigation substitution | Discoverability, keyboard/touch/screen-reader behavior, current location, focus lifecycle and no-JS routes |
| Progressive Glass / multi-layer backdrop blur | Contrast over actual content, layering, paint/GPU cost, reduced-motion relevance, simpler/static alternative |
| New or expanded Header runtime geometry measurement | Necessity over CSS/native behavior, startup/layout impact, lifecycle owner and no focus/scroll regression |
| New exact site-wide max width or width-role values | Separate browse/prose/technical/support geometry, actual content, narrow/large-screen comparison; no universal replacement assumed |
| New precise responsive breakpoints | Evidence on both sides of the threshold, long labels, zoom/reflow, touch and keyboard |
| Exact Homepage v3 composition | Reconciled prior contract and candidate evidence, real content/selection, mobile/tablet/desktop baselines and approved successor scope |
| HC-57 candidate integration | Its own candidate identity, recoverable evidence, independent QA and explicit integration decision; no presumed status |
| React runtime / framework integration | Level 3 or 4 review as applicable, explicit architecture approval, measured isolated cost and static fallback |
| ThreeUI / WebGL surfaces | Engineering comprehension benefit, source/runtime review, fallback and measured budget from section 11 |
| Major motion effects | Comprehension benefit, bounded/interruptible lifecycle, accessibility and measured cost |
| Production release | Separate authorized implementation, exact candidate QA and normal protected release process |

Evidence gaps do not invalidate the approved principles or prevent independently scoped quality work. Search experience fixes can be separate from visual migration, provided they preserve existing retrieval/architecture contracts and have their own authorization and QA. Do not bundle unresolved Header/Home experiments into such fixes.

## 13. Component responsibilities and implementation handoff

This document owns design authority; responsibilities below identify implementation boundaries without assigning obsolete Issue states or permanently binding future work to completed Issues.

| Area | Current responsibility anchors | Handoff requirements |
| --- | --- | --- |
| Foundations / composition | `src/styles/global.css`, `src/layouts/Layout.astro` | Role-based selectors/tokens, clear cascade ownership; preserve SEO, language, theme startup and skip link |
| Header / navigation | `src/components/Header.astro`, `Footer.astro`, `ThemeToggle.astro` | Native links, current/focused location, discoverable Search and theme; no implicit Header experiment |
| Search | `SearchDialog.astro`, `src/scripts/searchDialog.ts`, `pagefindSearch.ts`, `src/pages/search/` | Safe results, focus/state/lifecycle, language and publication contracts |
| Home | `src/pages/index.astro`, Home-scoped styles | Approved composition contract, factual selection, prior candidate/contract reconciliation |
| Projects / identity content | `src/pages/projects/`, `ProjectCard.astro`, relevant content pages | Separate presentation owner from verified content/evidence owner |
| Notes discovery / Archive | `src/pages/notes/` discovery routes, `NoteModuleTree.astro`, `NoteList.astro` | Hierarchy, deterministic membership/order, useful density, routes preserved |
| Notes reading | `src/pages/notes/[slug].astro`, `src/components/notes/`, `noteFragmentHighlight.ts` | Preserve measure, Outline, Properties, Backlinks, Copy Code, IDs and fragment ownership |
| Publication / Admin | Existing publication, pipeline and consumer contracts | Protected; outside visual scope, requires separate authorized ownership |
| QA | Existing `tests/ui/`, publication contracts and PR validation | Semantic/behavioral evidence plus geometry/rendered checks appropriate to the delta |

Prefer refactoring current components and narrowly scoped variants over parallel replacement systems. Use one retained-diff writer for shared surfaces, especially `global.css`, Layout/Header and the Search coordinator. Do not simultaneously integrate an older candidate and redesign the same selectors under separate scopes. Existing component paths are ownership anchors, not permission to modify every listed file.

Each future implementation Issue must state: relevant v3 sections, user task, exact files/owner, protected behavior, proposed implementation versus unresolved candidates, content provenance, dependency/adoption level, responsive transformations, accessibility/performance criteria, validation evidence and rollback/fallback. Architecture exceptions and evidence-gated decisions need explicit approval; ordinary scoped implementation need not re-decide the design thesis or reread the whole research package.

## 14. QA derivation and promotion gates

For authority changes: review the complete document and diff for internal contradictions, provenance/permission confusion, unsupported numerical freezes, retained obsolete prohibitions and protected invariants. Check exact changed-file scope and `git diff --check`; obtain independent semantic QA. An authority-only change does not require a website build unless unexpected source/build changes occur; such scope drift must be resolved rather than hidden by a build.

For subsequent UI changes, derive checks from the actual delta:

- **Foundations:** correct type roles; long titles remain scannable; palette contrast, geometry and real font fallback; no accidental Serif/display leakage.
- **Spatial composition:** browse, prose, technical and support widths evaluated independently; 68–72ch retained as the unconstrained reading target; no narrow-screen overflow or empty rails justified only by screen size.
- **Reading/discovery:** readable chapter hierarchy, intact content/IDs, usable technical blocks, logical mobile Outline, Backlinks/context, publication membership/counts and reachable routes.
- **Header/Search:** keyboard/touch discovery, current location, dialog naming/focus/close/scroll restoration, controlled highlights, loading/empty/error/retry, out-of-order queries and no result eligibility drift.
- **Continuity:** native links, fragment destinations, repeated/invalid/cross-page fragments as relevant, Back / Forward, Outline, Copy Code, selective prefetch and View Transition fallback.
- **Accessibility/performance:** light/dark, reduced motion, screen-reader semantics, zoom/reflow, fallback, layout stability and comparable cost evidence for added interaction.
- **External components:** recorded source/license/level, required approvals, local runtime boundary, cleanup, fallback and measured budgets where applicable.

Use source contracts to protect invariants, not as a substitute for behavior. Extend the existing PR `Validate` tests where appropriate; do not create duplicate deployment gates merely because deploy and PR workflows have different responsibilities. Changes to tests must trace to an approved semantic rule, not simply mirror candidate constants or remove failures.

Evidence must identify the source/candidate commit, route, viewport, theme/motion, environment, observed result and skipped checks with reasons. Rendered evidence must be independently readable; historical screenshots/benchmarks do not prove a new candidate. Missing evidence blocks the affected decision, not an unrelated scoped task. Final semantic verdicts are `PASS`, `PASS WITH WARNINGS`, `FAIL`, or `BLOCKED`; only explicitly non-blocking warnings permit an authorized exact-scope commit.

## 15. Supersession and provenance

v2 established the Engineering Shell, dedicated Notes reading roles/measure, restrained geometry and SKK continuity. v3 preserves those validated architecture, content, accessibility and reading foundations.

v3 refines typography into semantic roles, makes width task-specific, separates global principles from Notes composition, formalizes truthful disclosure/Search behavior, and permits evaluated external components under explicit adoption levels.

v3 supersedes the permanent Notes-only scope for transferable principles, the assumption of one universal page width, phase-specific prohibitions on full-width Search, a blanket interpretation banning any isolated framework evaluation, and obsolete Issue-based implementation ordering. It does not supersede native MPA/history, Pagefind, prose measure, content boundaries, or unresolved Homepage/Header evidence gates. v2's strict “no Serif outside Notes” becomes a protected default with an explicit future evidence/approval path, not an immediate expansion.

Historical v2 and completed implementation scopes remain in Git/Issue history. Do not rewrite completed Issue history or convert this document into a release changelog. A later Linear reconciliation task may use this v3 commit as current authority while preserving historical notices and recovering prior evidence; it cannot infer production changes from authority promotion.

Evidence provenance:

- `EXISTING HORACE`: retained v2 at repository commit `2073311a16fa7cfdf1314429ca54ee052a1cd54b`, existing repository contracts and validated behavior.
- `EDWIN-DERIVED`: structural/reading/governance mechanisms evaluated against [Edwin repository](https://github.com/SPIRAL-EDWIN/edwinjing_blog_personal-website/tree/12c180ac0efbc88720b52b37a3dd11edddf661e4), not wholesale CSS/runtime import. Material-native mechanisms must not be presented as Edwin-authored design.
- `SKK-DERIVED`: continuity contracts already adapted into Horace; preserve their native-navigation constraints.
- `EXTERNAL REFERENCE`: individually identified upstream sources, including the catalogs in section 11; no blanket source/license/runtime approval. Edwin's Progressive Glass reference is externally adapted as documented in its component specification.
- `NEW SYNTHESIS`: approved Horace × Edwin WP1–WP8 conclusions in `horace-edwin-research-report.md` / `horace-edwin-v3-research.zip` (research window 2026-09-16–19), followed by the user's **APPROVED WITH CONDITIONS** authority-promotion decision. These external research artifacts are background evidence; the operative rules and unresolved decisions are contained here.

For the approved Home v2 Header/brand successor only, the direction is selected under section17; the applicable rows above retain their implementation-evidence requirements. Selection does not itself prove contrast, focus/fragment clearance, reflow, fallback, paint cost or platform behavior. Other candidates retain their original status.

## 16. Home v2 scoped successor — 2026-10-19

Provenance: explicit owner Home v2 reconstruction authorization, HC-225/226 regional reconciliation and the Hero Ink Bleed register. This exception applies only to Home. The accepted regional direction is stated in this section: full-viewport Editorial Ink Hero, Recent News, Selected Works B, Honors A, and a minimal editorial Footer, with shared heading alignment. The earlier HC-225/226 working handoff and regional decision register are external historical evidence, not committed documents in this repository. This self-contained direction does not establish reference freeze, implementation or acceptance; those remain gated.

For Home only, the successor order is **full-viewport Editorial Ink Hero → Recent News → Selected Works B → Honors A → minimal editorial Footer**. Only Hero owns a viewport and must grow with content/zoom. Lower sections use natural height, continuous flow and native scrolling. News, Works and Honors headings share one left edge; content widths may differ. This supersedes older Home order/composition choices, automatic import of HC-219/220 typography/backgrounds and a mandatory early Works peek. It does not change other pages or global typography.

Hero uses oversized bold Sans “Horace Chan.”, semantic DOM copy/actions and a recognizable right-side portrait. Subtitle Serif, exact copy/type values, crops and source layers remain unresolved. Preserve face/glasses/portrait core. The accepted motion direction is localized reversible ink spreading at hair/shoulder/perimeter edges; no downward drift, particles exploding/falling, facial fade or effect-driven text movement. Static HC-228 and motion HC-230 remain separate. This is a scoped evaluation/implementation path after HC-226 readiness, not accepted numerical motion parameters or production artwork. HC-230 requires actual down/up recordings, 0/25/50/75/100% keyframes, measured cost/fallbacks, owner parameter review and independent exact-candidate QA before acceptance. Ordinary controls retain §9.3 limits.

News follows HC-229 News v1: verified event dates descending, green date metadata, latest four initially, accessible in-place older-entry disclosure, mobile metadata stacking and no-JS access; fewer verified records is valid. Works B uses equal editorial image/text rows and verified canonical eligible identities. Honors A is a compact year/title/detail index with quiet separators. Minimal Home Footer is explicit opt-in. No extra Education, Research Interests, Approach or Explore panels; preserve their appropriate destinations/background facts elsewhere.

All remaining v3 principles stay binding: static MPA, Header/Search and unrelated pages, native links/history/fragments, publication/schema/generated ownership, truthful facts, both themes, reduced-motion/no-JS/failure usability and accessibility. No dependencies/frameworks, global font reset or deployment change is authorized. Integrated aligned-v2 is secondary evidence, never a replacement for regional owner decisions. Composition images cannot replace semantic HTML or prove likeness/motion. HC-226 must ingest actual required references and obtain independent spec review before product edits. HC-227 content/assets, HC-232 independent acceptance, owner visual/motion acceptance and the separate HC-122 final gate are not waived. No release authorization is conveyed.

## 17. Home v2 Header and brand successor

Provenance: explicit owner A+C Minimal Progressive Glass selection, enhanced desktop v2 and accepted mobile direction, the refined two-tone H. baseline, HC-121 evidence/exception record and HC-234/235 exact-scope contracts. This section is a bounded successor to the shared Header presentation; Home-specific states remain Home-specific. It does not grant release permission or waive independent exact-candidate acceptance.

### 17.1 Refined Header identity

HC-234 may ingest the supplied outlined H. mark and optional wordmark, with light (#171A18/#47765A), dark (#F1F3F0/#9FC8AD) and monochrome variants, only after its dependency, provenance/license and asset-validation gates. The original ZIP, individual file hashes, SVG safety/viewBox checks, actual small-size renders and intended usage map must be recoverable.

Use a native Home link with an accessible name equivalent to "Horace Chan — Home"; a redundant inner graphic is decorative. Preserve intrinsic dimensions/aspect ratio and avoid layout shift. The Homepage identity remains real semantic HTML. No favicon/manifest/head-metadata change, global palette reset, unreviewed artistic mark or font runtime is implied. Keep source-version uncertainty explicit; outlined paths do not establish the generating font version or license handling by themselves.


### 17.2 Minimal Progressive Glass Header

HC-235 owns the shared Header implementation after HC-121 decision readiness, HC-234 asset readiness and the existing HC-228/229/231 predecessor exits. The selected information structure is a native H. Home link, directly visible About/Projects/Notes/Resume links on desktop, discoverable Search and the existing theme control. Links and Contact remain reachable through valid secondary/Footer navigation; routes and content are not deleted. Preserve current-location semantics for nested routes and visible keyboard focus.

Home alone may start clear or near-clear over its approved Hero. Scrolling changes to a readable glass surface with a cool near-white light material or dark green-grey material, visible edge separation and restrained shadow. Other routes start readable immediately. Navigation remains reachable; do not copy a reference site's automatic hide/reveal behavior. Bounded state changes must not shift layout or repeatedly measure geometry on scroll. Derive and document the actual trigger from Horace's composition. Remove the prototype49px toolbar, offsets, mode switches, section-search and forced smooth scrolling.

Enhanced desktop v2 is the visual comparison target. Its blur27px/saturation150%/contrast1.025 and local geometry are source reference parameters, not site-wide tokens or performance proof. Prefer native CSS with the smallest justified local JavaScript; use a sufficiently opaque fallback without backdrop-filter. Do not use blur alone to claim foreground separation. Verify actual composited contrast over imagery and prose in both themes. Ordinary controls retain section9.3 motion limits; reduced motion requires stable usable states.

Small-screen navigation must preserve the accepted visual direction and provide coherent disclosure or modal semantics, touch/keyboard access and a real no-JS path to navigation. Explicitly define open/close, Escape, outside interaction, link activation, resize, search coordination and focus restoration. Trap focus only for a true modal; never leave focus in hidden content. Keep SearchDialog/Pagefind and ThemeToggle responsibilities, native /search/ fallback, Ctrl/Cmd+K, theme persistence/system preference, query/language/publication boundaries and native navigation/history intact. HC-123 retains its separately owned Search defect. On the assembled Home v2 document only, the accepted mobile panel also retains Recent News → #recent-news, Selected Works → #selected-works and Honors → #honors alongside four core routes. Other routes omit that local group; the Home opt-in is enabled only when actual unique section targets are present. Preserve native fragment/history behavior and accessible enhancement/no-JS behavior under the versioned HC-235 mobile-region contract. HC-235 owns Header link/disclosure/focus behavior; HC-237 owns final route composition and target verification; accepted section IDs remain with their regional component owners.

Preserve or demonstrate equivalent current/focus reveal without a document-scroll jump. Sticky geometry must clear skip links, focused controls, fragments and heading targets, including native zoom and safe areas. The new Header rechecks HC-231's accepted reflow behavior after its owner completes that gate; it must not reset the inherited repair.

The owner's conditional Header library permission remains valid: a smallest sufficient local library may be considered and locally integrated within HC-235 only if a concrete native/existing-capability gap, selected version/license, cost, measured benefit, lifecycle, maintenance and reduced-motion/no-JS/no-backdrop fallback are recorded before manifest/lockfile changes. Tool failure is not a demonstrated native-runtime limitation. No named library is preapproved or mandatory; no app-wide router/framework migration is authorized. This permission does not transfer to HC-230.

Before component completion, record exact candidate/diff/assets and independent component review, both-theme top/News/Works/internal-route captures, reflow/native zoom, navigation/Search/theme/focus/fragment behavior, fallback and measured interaction cost. Chromium and Safari/WebKit availability and missing required checks must be explicit. HC-237 owns final actual-route assembly, HC-232 independent integrated acceptance and HC-233/HC-122 later handoff/final gate; do not create a circular prerequisite on downstream completion. Normal protected release authorization remains separate.

Transcribed 2026-10-22 for HC-235 from accepted HC-121 R2 plus dated AP-1 and independent decision acceptance. Sections 16 and 17/17.1 preserve their accepted predecessor lineage.

The shared Header successor in section17.2 may use a lightly rounded broad navigation strip and its scoped panel/control geometry. Enhanced-reference desktop17px and mobile13px radii are comparison inputs, not new global container tokens; actual values and responsive thresholds require recorded rendered evidence. The ordinary8px and6–8px container defaults continue elsewhere.

Owner-directed HC-235 desktop correction, 2026-10-23: the initial navigation must not obscure portrait hair. The Header may reserve its own desktop space above the unchanged Hero while retaining a clear or near-clear full-width strip. Clear-top and scrolled states keep identical bar/control dimensions and positions; only material changes. Route links and icon controls use consistent rounded interaction surfaces with visible keyboard focus. Preserve accepted mobile clearance/layout, Hero internals and the native-zoom/independent acceptance gates above. This bounded correction supersedes the R3 desktop overlay/control-island solution only.


### 17.4 Home-only desktop crown clearance amendment — 2026-10-24

Owner approved the left-contained Header composition together with the diagnosed Hero crown correction. Only explicit Home v2 data-home-v2=true above850 CSS px may group existing desktop navigation/actions beside the brand and fit the backing bar to that group. The previous broad-strip requirement is superseded only for this branch. Use the existing cascade without new important overrides. Preserve control dimensions, labels, destinations, interactions, theme/search engines, one Header reservation, all<=850 and non-Home layouts. Preserve -72px/54%/66% portrait geometry and all RGB/mask pixels. Restore the finite upper72px Hero strip, retaining horizontal and bottom containment; remove HC230’s duplicated base clip. No composition workaround may shift/shrink the portrait. Container spacing may be bounded by measured motion clearance while preserving each control’s hit area.

Verify both themes, normal/reduced/no-JS/failure, short/intermediate/breakpoint layouts, navigation/focus/menu/Search/theme and actual forward/reverse motion clearance. Native-menu200 remains a technical acceptance requirement and cannot be substituted by viewport/DPR/CSS zoom. The isolated combined fixture is not HC237 route assembly. HC230 fallback equivalence, cost and bottom continuity remain separate. Exact combined candidate adoption requires its recorded manifest and fresh independent review. No dependency or release authorization.

### 17.5 Owner-directed Frost and continuous-curvature candidate — 2026-10-25

Owner authorized adapting the actual React Bits Glass Surface Frost material in HC235 and Apple-inspired G2 decorative corners. Owner subsequently rejected imposed green tint and solid-looking experimental backing; current candidate uses the pinned official neutral Frost parameters as the comparison baseline. This is bounded Header material/corner authorization, not independent acceptance of an experimental successor. Accepted R5a remains recoverable and accepted.

Adapt only the rectangular SVG displacement/filter mechanism, Frost inset reflection/sheen and neutral white/black backgroundOpacity.28, displace3, distortion-180 with RGB offsets0/10/20, map blur11, borderWidth.07, brightness50/opacity.93 and saturation1. Retain full MIT + Commons Clause notice and exact upstream version/cost/lifecycle evidence. No React/WebGL/framework installation is implied. Actual painted refraction/frost and composited contrast must be demonstrated; CSS.supports/computed filter URLs do not prove working paint. If navigation readability needs adjustment, document the measured reason before deviating from this selected baseline.

Decorative backing and feedback-fill paths may use two symmetric cubic segments per corner, with zero curvature at straight joins and matching first/second derivatives at the midpoint. This provides an Apple-inspired G2 construction, not Apple's proprietary exact geometry. SVG coordinates are quantized to.001 CSS px. Keep native visible focus outlines, uncropped hit areas and ordinary rounded no-JS/unsupported-mask fallback; do not falsely call that fallback G2.

Preserve17.1 brand lineage,17.2 native navigation/Search/theme/disclosure/fragment/history/focus/noJS and availability gates,17.4 Home-only left composition and single90/78reservation, portrait/Hero/motion/assets and all unrelated authority. No Gooey/menu motion here; its future decision remains HC224. This candidate still requires actual visual/contrast/native200/fallback/performance evidence and fresh-context independent acceptance before integration. HC237 assembly and HC230 acceptance remain separate.

Measured HC235 navigation adaptation: retain the selected Frost optical parameters and.28 tint; apply only filtered-backdrop tonal bounds (light contrast.5/brightness1.8; dark brightness.4) after actual portrait-menu samples failed the text contrast target. Matched text-hidden final menu center bands measured minimum6.83 light/7.81 dark; JPEG resampling and conservative region sampling are disclosed in the packet and do not certify every engine/glyph. Exclude the enhanced-ready bar from the legacy parent backdrop rule so descendants sample the page rather than an opaque/backdrop root. Foreground text and focus remain outside the filter.

Owner-directed HC235 R8 edge refinement,2026-10-25: remove the accumulated bright parent top stripe and uniform1.5px rim from the enhanced plane. Use a.75px directional G2 rim with the pinned Frost light/dark gradient opacity distribution, native fine inset colors(black.15light/white.35dark), retained broad inner reflection and neutral low-alpha outer shadows. Preserve backing/control/G2/portrait/reservation geometry, tonal bounds and all navigation/fallback behavior. Existing accepted source layout is not changed to compensate for inherited Home whitespace. This is a bounded material revision, not new component/native200 acceptance.

Scoped HC235 R9 stability correction (2026-10-26): Header theme feedback must keep its position; do not inherit the global upward hover transform. Keep existing glass/feedback planes composited across hover rather than toggling their painted background. Outer fallback shadow corner extents match the existing G2 mask extents (desktop28/mobile22/panel24); this does not alter the G2 path mathematics, Header/control geometry or native focus outline. Honor-hover intermittent backdrop movement remains subject to matched runtime observation; static geometry alone is not paint stability proof.


HC235 native200 menu correction, 2026-10-27: retain the approved stationary outer Frost/G2 navigation panel while an inner links-only region scrolls in short windows. Preserve outer panel/bar/control geometry and native disclosure/route/fragment behavior. Provide at least8px local focus-reveal clearance so the2px outline plus3px offset remains visible for all links through Honors. Preserve ordinary no-JS flow and solid/reduced-transparency fallbacks. Exact successor needs affected rendered/native200 evidence and independent acceptance; prior R9 proof does not accept changed source.
