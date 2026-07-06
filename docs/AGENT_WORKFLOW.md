# Personal Website Agent Prompt & Task Orchestration Standard

## 0. 总原则

以后所有网站任务都遵循：

```txt
先判断任务类型
→ 选择唯一主责 agent
→ 明确允许修改的文件
→ 明确禁止修改的文件
→ 先产出 spec / audit / plan
→ 再交给 implementer 改代码
→ 最后交给 QA gate 验收
```

除非任务非常小，否则不要直接让 Codex “帮我优化一下网站”。
要改成：

```txt
请按 agent 分工完成：
1. 先由谁产出什么
2. 再由谁实现什么
3. 最后由谁验证什么
```

---

# 1. 任务分级规范

## Level 1：单文件小修

适用情况：

```txt
改一个文案
改一个 class
修一个明显 typo
调整一个小样式
```

可以直接交给：

```txt
frontend_implementer
```

但必须限制范围：

```txt
Only modify:
- src/pages/index.astro

Do not modify:
- tools/
- src/content/
- .github/
- package.json
- notes sync pipeline
```

---

## Level 2：单领域任务

适用情况：

```txt
只涉及视觉
只涉及文案
只涉及 Obsidian 同步
只涉及项目描述
只涉及构建验收
```

先找对应 specialist，不直接改代码：

```txt
视觉 / token / dark-light → design_system_curator
文案 / 信息架构 / 项目描述 → content_ia_editor
Obsidian 同步 / notes schema / assets / slug → obsidian_notes_pipeline
构建 / diff / release gate → qa_build_reviewer
```

输出应该是：

```txt
spec / audit / triage / checklist
```

不是直接代码。

---

## Level 3：跨领域任务

适用情况：

```txt
首页重构
Notes 系统升级
Obsidian 视觉效果实现
设计系统整体调整
导航结构调整
Projects + Notes + Home 联动
```

必须先找：

```txt
project_architect
```

它只负责定方案，不直接实现。

标准流程：

```txt
project_architect
→ design_system_curator / content_ia_editor / obsidian_notes_pipeline
→ frontend_implementer
→ qa_build_reviewer
```

---

## Level 4：高风险任务

适用情况：

```txt
修改 Obsidian sync script
修改 content schema
修改 notes generated content
修改 deploy workflow
修改 package scripts
从 Hexo 迁移到 Astro
影响多个目录
```

必须执行完整流水线：

```txt
project_architect plan
→ relevant specialist spec
→ frontend_implementer or pipeline owner implementation
→ qa_build_reviewer gate
```

并且 QA 没有通过前，不 commit。

---

# 2. Agent 调用顺序规范

## 标准顺序

```txt
project_architect
→ obsidian_notes_pipeline | design_system_curator | content_ia_editor
→ frontend_implementer
→ qa_build_reviewer
```

解释：

```txt
project_architect：决定做不做、怎么拆、哪些文件不能碰
specialists：给约束、规范、审计、风险判断
frontend_implementer：只根据明确 spec 落地
qa_build_reviewer：检查 build、diff、边界和风险
```

---

# 3. 每类任务应该找谁

## A. 首页视觉优化

不要直接说：

```txt
帮我优化首页视觉。
```

应该说：

```txt
Ask design_system_curator to produce a token-level design spec for homepage visual polish.

Scope:
- homepage eyebrow
- proof-mark
- identity-plate
- cards
- dark/light theme behavior

Do not edit code.

Return only:
- token changes
- affected selectors/components
- implementation handoff for frontend_implementer
- QA checklist
```

然后再交给：

```txt
frontend_implementer
```

---

## B. 首页文案优化

不要直接说：

```txt
帮我把首页文案写得高级一点。
```

应该说：

```txt
Ask content_ia_editor to audit homepage copy for vague, inflated, or buzzword-heavy language.

Do not edit code first.

Return:
- terms to avoid
- replacement principles
- suggested copy changes
- files that frontend_implementer may edit later
```

你的主页原则是：**首页只做身份入口，不做内容仓库**；Notes / Blog 承载长期积累，Projects 展示工程能力。

---

## C. Projects 页面整理

适合找：

```txt
content_ia_editor
```

Prompt：

```txt
Ask content_ia_editor to audit src/content/projects/ and the Projects page IA.

Goal:
Make Projects work as a fast project index, not a long report.

Rules:
- Each project should have a clear one-sentence description.
- Avoid inflated claims.
- Preserve early-stage honesty.
- Separate project summary from detailed notes.

Do not edit code.

Return:
- current issues
- suggested project grouping
- rewritten project descriptions
- files that may be edited later
```

Projects 页应该像“项目索引”，每个项目先给“项目名 + 一句话说明 + 链接”，详细过程再放项目详情页或 Notes。

---

## D. Obsidian Notes 同步链路

适合找：

```txt
obsidian_notes_pipeline
```

先本地跑：

```bash
npm run notes:sync:dry -- --source "D:\Path\To\Obsidian Publish" --vault "D:\Path\To\Obsidian Vault"
```

然后给 agent：

```txt
Ask obsidian_notes_pipeline to triage this dry-run output.

Do not edit code first.

Focus on:
- broken links
- slug conflicts
- asset URL issues
- tag normalization
- generated notes safety
- schema mismatch

Return:
- severity-ranked issues
- likely root causes
- files involved
- safe fix plan
- what must be checked by qa_build_reviewer
```

这个任务不能交给普通前端 agent，因为 Obsidian 链路的真实流程是：

```txt
Obsidian Vault
→ sync script
→ generated notes
→ tags / backlinks / assets / slug
→ Astro rendering
```

这里是你项目最容易被误伤的区域之一。

---

## E. 设计系统调整

适合找：

```txt
design_system_curator
```

它只应该输出 spec，不应该直接写 CSS。

Prompt：

```txt
Ask design_system_curator to define a design-system spec.

Goal:
Align the site with Vercel light + Linear dark references while preserving the developer notebook character.

Do not edit code.

Return:
- token decisions
- typography rules
- spacing rules
- border / shadow rules
- dark-light contrast requirements
- motion rules
- implementation handoff for frontend_implementer
- QA checklist
```

注意：`design_system_curator` 不应该直接改 CSS，否则会和 `frontend_implementer` 抢边界。

---

## F. 前端实现任务

适合找：

```txt
frontend_implementer
```

Prompt 必须包含 specialist 的 spec：

```txt
Ask frontend_implementer to implement the attached spec.

Allowed files:
- src/pages/index.astro
- src/styles/global.css
- src/components/[specific component].astro

Do not modify:
- tools/sync-obsidian-notes.mjs
- src/content/config.ts
- generated notes
- package.json
- .github/workflows/
- .codex/agents/
- .opencode/agents/

Implementation rules:
- Keep changes minimal.
- Preserve existing Astro structure unless required.
- Do not introduce new dependencies.
- Respect dark/light theme contract.
- Respect prefers-reduced-motion.

Return:
- files changed
- summary of changes
- risks
- commands run
- handoff notes for qa_build_reviewer
```

---

## G. QA / Release Gate

每次涉及多个文件，都必须最后找：

```txt
qa_build_reviewer
```

Prompt：

```txt
Ask qa_build_reviewer to review the current diff before commit.

Required checks:
- git diff summary
- boundary violations
- npm run build
- npm run hexo:build if Hexo-related files are touched
- notes:sync:dry if notes pipeline is touched and source path is available
- dark/light regression risk
- content/schema risk

Return one status only:
- PASS
- PASS WITH WARNINGS
- FAIL
- BLOCKED

If npm run build was not run, return:
BLOCKED: build not verified
```

`qa_build_reviewer` 必须有拒绝通过的权力，不能只是总结结果。

---

# 4. 通用 Prompt 模板

以后你可以直接套这个模板：

```txt
Task:
[一句话说明要做什么]

Context:
- Repo: Astro personal website, migrating away from Hexo
- Main sections: Home / About / Projects / Notes / Resume / Contact
- Notes source: Obsidian publish pipeline
- Design references: Vercel light + Linear dark
- Site character: minimal developer notebook, honest early-stage researcher/builder

Agent:
Use [agent_name] as the primary owner.

Scope:
Only work on:
- [allowed area 1]
- [allowed area 2]

Do not modify:
- [forbidden file/dir]
- [forbidden file/dir]

Requirements:
1. [specific requirement]
2. [specific requirement]
3. [specific requirement]

Output format:
- Findings / Plan / Spec
- Files involved
- Risks
- Handoff target
- QA checklist

Important:
Do not edit code unless this task explicitly says implementation is allowed.
```

---

# 5. 任务编排句式

## 只要方案，不要代码

```txt
Do not edit code.
Return only a plan/spec/audit.
```

## 允许实现，但限制范围

```txt
You may edit only the files listed under Allowed files.
Do not modify any other files.
```

## 防止 agent 越界

```txt
If the task requires touching files outside the allowed scope, stop and return a handoff note instead of editing.
```

## 防止视觉 agent 写代码

```txt
design_system_curator must not edit CSS or Astro files.
It should only produce a design spec and implementation handoff.
```

## 防止前端 agent 误伤 Notes

```txt
frontend_implementer must not modify Obsidian sync scripts, content schema, generated notes, deployment workflow, or design tokens unless the handoff explicitly allows it.
```

## 防止 QA 放水

```txt
qa_build_reviewer must return BLOCKED if npm run build was not run.
```

---

# 6. 推荐的日常工作流

## 普通视觉小改

```txt
design_system_curator spec
→ frontend_implementer implement
→ qa_build_reviewer gate
```

## 普通文案小改

```txt
content_ia_editor audit
→ frontend_implementer implement copy changes
→ qa_build_reviewer gate
```

## Notes / Obsidian 问题

```txt
npm run notes:sync:dry
→ obsidian_notes_pipeline triage
→ frontend_implementer or pipeline owner fix
→ qa_build_reviewer gate
```

## 首页 / Projects / Notes 大改

```txt
project_architect plan
→ content_ia_editor + design_system_curator specs
→ frontend_implementer implementation
→ qa_build_reviewer gate
```

## 发布前检查

```txt
qa_build_reviewer only
```

---

# 7. 禁止使用的模糊 Prompt

以后尽量不要这样写：

```txt
帮我优化一下网站。
帮我美化一下首页。
帮我把 Notes 做得像 Obsidian。
帮我整理一下代码。
帮我重构一下样式。
帮我看看有没有问题。
```

这些 prompt 的问题是：

```txt
目标不清
文件范围不清
完成标准不清
agent owner 不清
是否允许改代码不清
验收标准不清
```

---

# 8. 推荐使用的精确 Prompt

应该改成：

```txt
Ask project_architect to plan a Notes visual upgrade.

Goal:
Make rendered notes feel closer to Obsidian reading mode while staying static-build friendly.

Do not edit code.

Return:
- desired user-facing behavior
- affected files
- which parts belong to obsidian_notes_pipeline
- which parts belong to design_system_curator
- which parts belong to frontend_implementer
- risk list
- QA checklist
```

或者：

```txt
Ask frontend_implementer to implement the attached design_system_curator spec.

Allowed files:
- src/styles/global.css
- src/pages/index.astro

Do not modify:
- tools/
- src/content/
- .github/
- package.json

Return:
- files changed
- what changed
- commands run
- remaining risks
- handoff to qa_build_reviewer
```

---

# 9. 你本人在流程中的角色

你的角色不是写代码，而是做最终取舍：

```txt
你负责：
- 选择身份定位
- 确定内容是否真实
- 确定视觉方向是否符合你
- 提供 Obsidian Vault / Publish 路径
- 决定是否接受 QA warnings
- 决定是否 commit / PR / merge
```

你不需要每次都亲自判断技术细节，但你要控制：

```txt
这个网站最终像不像你
这个表达是否诚实
这个改动是否值得进入主分支
```

---

# 10. 最终一句话规范

以后所有任务都按这句话判断：

```txt
任何改动都必须先有 owner，后有 scope，再有 output，最后有 gate。
没有 owner 不开工；没有 scope 不改文件；没有 output 不交接；没有 gate 不合并。
```
