---
title: AI Retrieval Tool · AI 检索力
description: A browser-based academic search-strategy builder that expands bilingual keywords, drafts database-oriented Boolean queries, compares model outputs, and checks query structure.
id: ai-retrieval-tool
slug: ai-retrieval-tool
published: true
date: 2026-06-23
status: in-progress
category: AI Workflow
role: Solo developer
timeframe: June 2026-present
portfolioArea: ai-workflow
maturity: in-progress
visibility: public
order: 1
stack:
  - React 19
  - TypeScript
  - Vite 6
  - Tailwind CSS 4
tools:
  - React 19
  - TypeScript
  - Vite 6
  - Tailwind CSS 4
  - Recharts and D3
  - i18next
  - Google GenAI SDK
  - OpenAI-compatible APIs
problem: Turning a research question into a reproducible database search strategy requires concept decomposition, bilingual terminology, Boolean grouping, and platform-specific syntax checks.
contribution: Designed and implemented the public browser-based workflow for research-intent input, keyword expansion, model-assisted query drafting and comparison, structural validation, and supporting research guides.
outcome: The public GitHub Pages app provides editable query drafts, a Boolean logic visualization, a database-link directory, and a portable offline URL-reference export; formal retrieval-quality benchmarking has not been established.
evidence:
  - label: Live application
    url: https://horacech.github.io/Information-Retrieval-Tool/
    type: demo
  - label: Source code and README
    url: https://github.com/HoraceCh/Information-Retrieval-Tool
    type: repository
  - label: User guide
    url: https://github.com/HoraceCh/Information-Retrieval-Tool/blob/main/docs/USER_GUIDE.md
    type: documentation
  - label: Developer guide
    url: https://github.com/HoraceCh/Information-Retrieval-Tool/blob/main/docs/DEVELOPMENT.md
    type: documentation
  - label: Speech provider architecture
    url: https://github.com/HoraceCh/Information-Retrieval-Tool/blob/main/docs/SPEECH_PROVIDERS.md
    type: documentation
tags:
  - Academic search
  - Boolean queries
  - Keyword expansion
  - Multi-model AI
  - TypeScript
featured: true
links:
  github: https://github.com/HoraceCh/Information-Retrieval-Tool
  demo: https://horacech.github.io/Information-Retrieval-Tool/
---

## Purpose

AI Retrieval Tool (AI 检索力) helps researchers translate natural-language questions into **inspectable and editable academic search strategies**. It assists with the preparation of search expressions; it is not an academic database, literature crawler, or paper-download service.

## How it works

1. **Describe a research question** and select the target academic, patent, or standards database.
2. **Inspect bilingual keywords**, synonyms, abbreviations, and concept groups suggested by the model.
3. **Generate and compare Boolean queries**, with field-code and syntax hints tailored to the selected search target.
4. **Review the structure** using bracket, quotation-mark, operator, and missing-field checks plus a visual Boolean logic tree.
5. **Edit and execute the query manually** in the target database, recording the final expression for reproducibility.

The application provides guidance for targets including CNKI, Wanfang, Web of Science, Scopus, Ei Compendex, IEEE Xplore, and patent-search platforms. The scope and current syntax of each platform must still be verified against its official documentation.

## Implemented capabilities

- **Multi-provider, bring-your-own-key model access:** presets for Gemini, DeepSeek, SiliconFlow, Kimi, GLM, Qwen, OpenAI, and OpenRouter, plus custom OpenAI-compatible endpoints.
- **Dual-model comparison:** compare generated keywords and query strategies side by side.
- **Reusable search templates:** research-oriented frameworks including general academic, engineering, PICO, patent, recall-oriented, and precision-oriented strategies.
- **Query validation and visualization:** conservative checks for common Boolean-expression structural errors, with a visual representation of the query logic.
- **Database and resource directory:** links to official academic, patent, and standards platforms, plus a standalone HTML export for offline searching of the built-in URL directory.
- **Local workflow tools:** browser-local history, feedback/refinement records, performance statistics, and introductory guidance.
- **Speech input:** a Gemini transcription path and selectable OpenAI, Deepgram, and local Whisper adapter contracts. Non-Gemini options require a separately configured trusted proxy; the static site does not provide hosted transcription backends or an in-browser Whisper runtime.

The project also publishes standalone guides on [academic literature search](https://horacech.github.io/Information-Retrieval-Tool/guides/academic-literature-search/), [Boolean search](https://horacech.github.io/Information-Retrieval-Tool/guides/boolean-search/), and [keyword expansion](https://horacech.github.io/Information-Retrieval-Tool/guides/keyword-expansion/).

## Role and engineering focus

I developed the browser-first retrieval workflow, using React, TypeScript, and Vite to combine model-provider configuration, keyword and query generation, validation feedback, and research-resource navigation. The tool is published with source code, usage documentation, and a public demonstration.

## Current state and limitations

The app is publicly accessible and remains under development. Its structural validator checks a defined subset of formatting and operator issues; **a passing check does not certify** database-specific field codes, proximity or truncation semantics, search recall, or compatibility with a platform's current grammar.

The tool does not retrieve, index, or host literature. Model requests go directly from the browser to the selected service provider, and user-provided API keys are stored in browser localStorage without application-level encryption. Users should avoid shared devices and sensitive inputs and review provider-specific privacy and billing terms.

The offline HTML export is a portable **URL reference directory**, not an offline AI query engine: links and AI generation still require network access, and custom file entries store filenames rather than embedding the files themselves.

Further evidence is still needed for retrieval-quality benchmarks, representative database-tested search cases, and comparisons between model drafts and researcher-edited final queries.
