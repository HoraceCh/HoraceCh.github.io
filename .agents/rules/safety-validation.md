# Safety And Validation

本文件定义 Agent 修改项目前后的最低安全与验证要求。

## Before Editing

- 修改项目文件前，先查看当前 git 状态。
- 不覆盖、不回滚、不整理与当前任务无关的用户改动。
- 发现项目状态与预期不符时，先读 `.agents/changelog.md` 和相关规则，再决定行动。
- 不确定改动是否安全时，停下来问用户。

## Validation Matrix

| 改动类型 | 验证要求 |
| --- | --- |
| 影响构建的文件 | 必须运行 `npm.cmd run build` |
| 主题模板或 CSS | 应运行 `npm.cmd run dev` 并目视检查受影响页面 |
| Markdown 内容 | 文件层面检查，确认存在、可读、内容无乱码 |
| `.agents/` 规则或日志 | 文件层面检查，确认格式一致且无敏感信息 |
| npm 依赖 | 运行构建，并检查 lockfile 变化是否符合预期 |

## Reporting

需要写 changelog 时，`Validation` 字段必须写明实际执行的命令或检查方式，以及结果。没有执行构建时，要说明原因。
