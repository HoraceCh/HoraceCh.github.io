---
title: AI_RETRIEVAL_X / Information-Retrieval-Tool
description: A TypeScript/Vite tool that drafts Boolean search queries for academic databases such as CNKI, Web of Science, PubMed, and Ei Compendex.
date: 2026-06-23
status: in-progress
category: AI Workflow
role: Solo developer
timeframe: June 2026-present
portfolioArea: ai-workflow
maturity: in-progress
visibility: public
order: 1
tools:
  - TypeScript
  - Vite
  - multi-model API support
  - academic database search syntax
  - AI-assisted workflow design
problem: Academic database search often requires translating an open research question into database-specific Boolean queries, which is slow to do repeatedly by hand.
contribution: Designed and implemented the public TypeScript/Vite tool, including the query-generation workflow and database-oriented prompt structure.
outcome: Public repository exists and the tool is usable as an early AI-assisted retrieval workflow; examples, evaluation notes, and limitations are still being documented.
evidence:
  - label: Public repository
    url: https://github.com/HoraceCh/Information-Retrieval-Tool
    type: repository
tags:
  - TypeScript
  - Vite
  - academic retrieval
  - literature search
featured: true
links:
  github: https://github.com/HoraceCh/Information-Retrieval-Tool
---

## Purpose

Turn natural-language research needs into structured Boolean search queries for academic databases such as CNKI, Web of Science, PubMed, and Ei Compendex.

## Problem

Academic retrieval is usually a translation problem: a broad research need has to become a set of precise keyword groups, Boolean operators, synonyms, and database-specific query formats. The tool is meant to reduce the first-pass friction while keeping the search process inspectable.

## Role and Contribution

I built the public TypeScript/Vite project and focused on the workflow structure: how a user describes the search need, how the model drafts candidate queries, and how those queries can be adapted for common academic databases.

## Current State

This is the current anchor project because it has a public repository and a concrete workflow. It should still be read as in progress: practical examples, database-specific behavior, and revision patterns need more documentation after use.

## Tools and Skills

- TypeScript
- Vite
- Multi-model API support
- Academic information retrieval
- LLM-assisted workflow design

## Limitations and Next Steps

The project does not claim retrieval quality benchmarks or database coverage guarantees. Next steps are to document concrete search cases, compare generated queries against manual revisions, and make limitations visible in the repository.
