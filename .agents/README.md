# Agent Persistence Architecture

本目录是本项目的 Agent 持久化层，用于沉淀后续 Agent 应遵守的长期规则、可复用任务流程和重要变更时间线。项目源码、配置和 Git 历史仍然是 source of truth；`.agents/` 只提供操作 schema 和 audit trail。

## 架构分层

| 层 | 作用 | 加载方式 | 是否入库 |
| --- | --- | --- | --- |
| Rules | 项目级稳定约束，定义“这个项目永远怎么做” | Agent 进入项目时优先阅读 | 是 |
| Skills | 特定任务类型的操作手册，定义“这类任务怎么做” | 任务匹配时按需阅读 | 是 |
| Memory | 用户、机器、短期项目状态等观察 | 不在本仓库存储真实内容 | 否 |
| Changelog | 重要 Agent 改动的 append-only 时间线 | 需要理解演化历史时阅读 | 是 |

## 推荐读取顺序

1. `.agents/rules.md`：总 schema 和不可违反的基础规则。
2. `.agents/rules/`：按主题拆分的项目级规则。
3. `.agents/skills/`：当前任务匹配时读取对应任务手册。
4. `.agents/changelog.md`：当项目状态与预期不符，或需要理解规则/结构演化时阅读。

## 写入决策

先问：这个信息能否从当前代码、配置或文件直接推导？

- 能推导：不写入 `.agents/`，直接看 source of truth。
- 不能推导，且适用于本项目所有后续 Agent：写入 Rules。
- 不能推导，且是某类任务的可复用流程：写入 Skills。
- 不能推导，但只属于用户偏好、机器环境、外部资源指针或短期项目状态：不要写入本仓库；如 Agent 平台支持 Memory，应写入平台私有 Memory。

## 安全边界

- 不记录 API key、token、密码、邮箱凭据或其他敏感信息。
- 不把机器特有绝对路径、私人账号、代理配置写入入库文件。
- 不把一次性任务进度、临时计划或会话内 todo 持久化到本目录。
- 修改 `.agents/` 自身通常属于 `agent-rules` 类改动，满足规则时应追加 `.agents/changelog.md`。
