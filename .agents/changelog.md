# Agent 变更日志

> **Legacy v1 — immutable.** This file is closed to new entries. Use [System Maintenance Log v2](maintenance/index.md) for new records; existing history below remains unchanged and is not duplicated in v2.

本文件是 Agent 维护的重要项目变更的 append-only 审计时间线，用于记录项目为什么演化成当前状态以及改动如何验证。项目源码和配置本身仍然是 source of truth，本日志只作为 audit trail。

新记录必须追加到文件底部。不要记录 API key、token、密码、邮箱凭据或其他敏感信息。

**示例：以下仅为模板示例，不是真实变更记录。**

## [YYYY-MM-DD HH:MM] AgentName | category | 简短摘要

- **Scope**: 改动影响范围（哪个模块/层面）
- **Files**: 改动的文件列表（相对路径）
- **Reason**: 为什么做这个改动
- **Validation**: 如何验证改动正确（实际执行的验证命令和结果）
- **Notes**: 补充说明（可选，无则省略此行）

## [2026-06-28 23:25] Codex | agent-rules | 搭建 Agent 持久化分层架构

- **Scope**: `.agents/` 下的 Rules / Skills / Memory 分层、审计日志规则和后续 Agent 读取入口
- **Files**: `.agents/README.md`, `.agents/rules.md`, `.agents/rules/README.md`, `.agents/rules/persistence-boundaries.md`, `.agents/rules/audit-trail.md`, `.agents/rules/safety-validation.md`, `.agents/skills/README.md`, `.agents/skills/audit-update.md`, `.agents/memory/README.md`, `.agents/memory/.gitignore`, `.agents/changelog.md`
- **Reason**: 按照 clipping 中 Rules / Skills / Memory 的持久化架构，将项目 Agent 规则从单一说明扩展为可发现、可按需读取、且避免把私人 Memory 入库的结构。
- **Validation**: 文件级检查：确认 `.agents/` 架构文件存在、日志模板字段一致、关键规则文本存在、未发现明显敏感赋值；未运行 `npm.cmd run build`，因为本次仅修改 Agent Markdown 规则与审计文件，不影响 Hexo 构建。
- **Notes**: 真实 Memory 内容不放入仓库，`.agents/memory/.gitignore` 仅允许提交边界说明文件。

## [2026-07-27 20:47] Codex | agent-rules | 对齐当前 Codex 配置、模型路由与可复用 Skills

- **Scope**: Codex 项目配置、六个 agent 的模型与推理路由、串行和 depth-one 策略、项目内 Skills、Goal / browser / Computer Use 指南
- **Files**: `.codex/config.toml`, `.codex/agents/README.md`, `.codex/agents/*.toml`, `AGENTS.md`, `docs/AGENT_WORKFLOW.md`, `docs/CODEX_AGENT_ROUTING.md`, `docs/CODEX_MODEL_USAGE.md`, `.agents/rules.md`, `.agents/skills/`, `.agents/changelog.md`
- **Reason**: 使用当前官方 Codex 文档修正 legacy concurrency alias、移除不受支持的深度和任务时长配置键、避免 agent TOML 阻止动态模型升级，并把重复操作流程迁移为可发现的项目 Skills。
- **Validation**: 官方 Codex manual 与 latest-model resolver 已核对；7 个 TOML 文件解析通过；5 个 Skill 通过 `quick_validate.py`；5 个 Skill UI YAML 解析通过；模型、权限、递归委派、路径和敏感信息扫描无非预期结果；`git diff --check` 与新 Skill 空白检查通过。未运行网站构建，因为没有修改网站源码、内容、构建或部署文件。

## [2026-07-27 21:00] Codex | agent-rules | 添加审查通过的项目本地 UI Skills

- **Scope**: 第三方 UI Skills 的项目本地副本、优先级与既有六 Agent 路由边界
- **Files**: `AGENTS.md`, `.agents/skills/improve-ui/`, `.agents/skills/fixing-accessibility/`, `.agents/skills/fixing-metadata/`, `.agents/skills/fixing-motion-performance/`, `.agents/changelog.md`
- **Reason**: 仅集成已审查且兼容 Astro/custom CSS 边界的 UI 审计参考，不引入动态路由、框架或依赖。
- **Validation**: 已检查 Codex GitHub installer 的 `--help` 与实现，确认显式 `--path`、项目 `--dest` 和下载复制模式；逐一完整审查四个已安装 Skill 文件及附带 Improve UI 参考文件；`git diff --check` 通过，`git status --short` 与完整规则 diff 已检查。未运行网站构建，因为未修改网站源码、构建配置或包文件。
