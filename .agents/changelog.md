# Agent 变更日志

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
