# Rules

本目录存放项目级稳定约束。这里的规则应适用于本项目所有后续 Agent 和协作者，表达“这个项目永远怎么做”。

## 文件索引

- `persistence-boundaries.md`：Rules / Skills / Memory / Changelog 的边界和写入判断。
- `audit-trail.md`：`.agents/changelog.md` 的写入条件、分类和固定格式。
- `safety-validation.md`：修改前安全要求和修改后验证要求。

## 写入原则

- 只写稳定、长期、项目级约束。
- 不写能从源码、配置或 Git 历史直接推导的信息。
- 不写机器特有路径、用户个人偏好、临时任务进度或短期项目状态。
- 规则冲突时，用户当前明确指令优先；否则以更具体、更靠近本项目的规则为准。
