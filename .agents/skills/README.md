# Skills

本目录存放项目内可复用的任务手册。Skills 与 Rules 的区别是：Rules 定义长期约束，Skills 定义某类任务的执行流程。

## 使用方式

当任务与某个 Skill 匹配时，先读取对应文件，再执行任务。若 Skill 与 Rules 冲突，优先遵守 `.agents/rules.md` 和 `.agents/rules/` 中的项目规则。

## 当前 Skills

- `audit-update/`：判断保留的改动是否需要追加 `.agents/changelog.md`。
- `website-release-gate/`：由 `qa_build_reviewer` 执行网站发布前检查。
- `notes-publication-preflight/`：由 Notes pipeline owner 执行同步与发布预检。
- `publication-contract-audit/`：只读审计 Notes 发布边界与契约。
- `interrupted-run-recovery/`：由 `qa_build_reviewer` 分类中断后的工作树并选择下一 owner。

每个可发现 Skill 使用 `.agents/skills/<name>/SKILL.md`，并在 YAML frontmatter 中声明 `name` 和 `description`。

## 写入边界

适合写入 Skills：

- 可复用的任务流程。
- 需要固定阶段或 checklist 的复杂任务。
- 跨多个文件或模块的操作步骤。

不适合写入 Skills：

- 单次任务说明。
- 项目级固定格式或硬性约束，这些应写入 Rules。
- 用户偏好、机器路径或临时状态，这些不应入库。
