# Agent 操作规则

本文件是 Agent 在本 Hexo 项目中工作的操作 schema。后续 Agent 进入项目时应首先阅读本文件，再以项目源码和配置文件作为 source of truth。

本项目的 Agent 持久化机制采用 `.agents/` 分层架构，即 Rules / Skills / Memory / Changelog 四层：

- `rules/`：项目级稳定约束，定义“这个项目永远怎么做”。
- `skills/`：任务类型操作手册，任务匹配时按需读取。
- `memory/`：只存放 Memory 机制边界说明；真实的个人、机器或临时项目状态记忆不得入库。
- `changelog.md`：重要 Agent 改动的 append-only 审计时间线。

推荐读取顺序：先读本文件，再读 `.agents/README.md`；涉及具体规则时读 `.agents/rules/`，涉及任务流程时读 `.agents/skills/`。

## 核心原则

项目文件是 source of truth。`.agents/changelog.md` 是项目演化的审计时间线，不替代代码、配置或内容本身。

只记录大型改动，不记录零碎细节。日志应沉淀结构、配置、依赖、部署、规则或用户可见行为上的重要变化，帮助后续 Agent 不必重新推导项目为什么变成现在这样。

## Rules 机制与边界

`.agents/rules.md` 是本项目面向 Agent 的稳定规则文件，作用类似项目级 Rules：定义所有后续 Agent 都应遵守的长期规范。它应记录“这个项目里 Agent 永远怎么做”，而不是记录一次性任务过程。

写入或修改规则前，先判断信息是否能从当前代码、配置或文件直接推导。能推导的信息不写入规则；规则只沉淀无法从代码直接看出、但适用于本项目所有后续 Agent 的操作约束。

不要把以下内容写进规则文件：

- 机器特有路径、账号、代理、环境变量等不可移植配置。
- 用户个人偏好或只对某个会话成立的行为纠正。
- 当前任务进度、临时计划或短期项目状态。
- 表名、路由、函数签名等可以直接从源码和配置读取的信息。

## 什么时候必须写日志（MUST log）

Agent 做出以下保留到最终项目状态的改动时，必须在 `.agents/changelog.md` 追加记录：

- 修改站点结构、菜单、路由、页面体系。
- 修改 Hexo 配置，例如 `_config.yml` 或 `_multiconfig.yml`。
- 修改主题模板、主题资源、构建逻辑或部署逻辑。
- 新增或删除页面，包括 `source/` 下的目录或 `index.md` 文件。
- 修改 `README.md`、`.agents/` 下的文件或 GitHub Actions 工作流。
- 大范围内容重写，判断标准为单个文件超过 30% 行数发生变动。
- 引入、移除或升级 npm 依赖。
- 修复影响构建输出、部署或主要页面显示的 bug。

## 什么时候不需要写日志（SKIP）

以下小范围、低影响改动不需要写入日志：

- 单个错别字修正。
- 轻微标点、空格或格式调整。
- 小范围 CSS 微调，少于 10 行且不影响布局。
- 注释措辞微调。
- 临时调试操作，且未保留到最终项目状态。

## 日志条目格式

在 `.agents/changelog.md` 中使用以下固定格式：

```markdown
## [YYYY-MM-DD HH:MM] AgentName | category | 简短摘要

- **Scope**: 改动影响范围（哪个模块/层面）
- **Files**: 改动的文件列表（相对路径）
- **Reason**: 为什么做这个改动
- **Validation**: 如何验证改动正确（实际执行的验证命令和结果）
- **Notes**: 补充说明（可选，无则省略此行）
```

规则：

- append-only：新记录追加到 `.agents/changelog.md` 文件底部。
- 每条记录必须包含日期时间、Agent 名称、改动类别、摘要、Scope、Files、Reason、Validation。
- 改动类别必须从以下选择：`site-structure`、`config`、`theme`、`content`、`build-deploy`、`dependency`、`agent-rules`、`bugfix`、`other`。
- AgentName 填写执行改动的 Agent 标识，例如 `Codex`、`Sisyphus`、`Claude`。
- `Notes` 没有有用补充时省略整行。
- 绝不记录 API key、token、密码、邮箱凭据或其他敏感信息。

## 安全约束

- 日志中绝不记录敏感信息。
- Agent 修改项目文件前应先了解当前 git 状态，并保留无关的用户改动。
- 不确定改动是否安全且无法从本地上下文验证时，应先询问用户而非直接执行。

## 验证要求

- 修改了会影响构建的文件时，必须运行 `npm.cmd run build` 验证。
- 修改了主题模板或 CSS 时，应在可行时运行 `npm.cmd run dev` 并目视检查受影响页面。
- 仅修改 Markdown 内容或 Agent 规则文件时，文件层面检查即可：确认文件存在、可读取、内容无乱码且不含非预期敏感信息。

需要写日志时，在 `Validation` 字段中记录实际执行的验证命令或检查方式及结果。

## 不确定时的处理

- 不确定改动是否属于大型改动时，宁可记录，不要遗漏。
- 不确定改动是否安全时，停下来问用户。
- 发现项目状态与预期不符时，先阅读 `.agents/changelog.md` 了解相关历史，再决定行动。
