# Skills

本目录存放项目内可复用的任务手册。Skills 与 Rules 的区别是：Rules 定义长期约束，Skills 定义某类任务的执行流程。

## 使用方式

当任务与某个 Skill 匹配时，先读取对应文件，再执行任务。若 Skill 与 Rules 冲突，优先遵守 `.agents/rules.md` 和 `.agents/rules/` 中的项目规则。

## 当前 Skills

- `audit-update.md`：修改项目后判断是否需要追加 `.agents/changelog.md`，并完成验证记录。

## 写入边界

适合写入 Skills：

- 可复用的任务流程。
- 需要固定阶段或 checklist 的复杂任务。
- 跨多个文件或模块的操作步骤。

不适合写入 Skills：

- 单次任务说明。
- 项目级固定格式或硬性约束，这些应写入 Rules。
- 用户偏好、机器路径或临时状态，这些不应入库。
