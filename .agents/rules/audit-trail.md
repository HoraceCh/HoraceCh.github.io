# Audit Trail Rules

`.agents/changelog.md` 是 Agent 重要改动的 append-only 审计时间线。日志是项目演化记录，不是流水账。

## MUST Log

Agent 做出以下保留到最终项目状态的改动时，必须追加 changelog：

- 修改站点结构、菜单、路由、页面体系。
- 修改 Hexo 配置，例如 `_config.yml` 或 `_multiconfig.yml`。
- 修改主题模板、主题资源、构建逻辑或部署逻辑。
- 新增或删除页面，包括 `source/` 下的目录或 `index.md` 文件。
- 修改 `README.md`、`.agents/` 下的文件或 GitHub Actions 工作流。
- 大范围内容重写，判断标准为单个文件超过 30% 行数发生变动。
- 引入、移除或升级 npm 依赖。
- 修复影响构建输出、部署或主要页面显示的 bug。

## SKIP

以下改动不需要写入 changelog：

- 单个错别字修正。
- 轻微标点、空格或格式调整。
- 小范围 CSS 微调，少于 10 行且不影响布局。
- 注释措辞微调。
- 临时调试操作，且未保留到最终项目状态。

## Format

```markdown
## [YYYY-MM-DD HH:MM] AgentName | category | 简短摘要

- **Scope**: 改动影响范围（哪个模块/层面）
- **Files**: 改动的文件列表（相对路径）
- **Reason**: 为什么做这个改动
- **Validation**: 如何验证改动正确（实际执行的验证命令和结果）
- **Notes**: 补充说明（可选，无则省略此行）
```

## Categories

分类必须从以下枚举中选择：

- `site-structure`
- `config`
- `theme`
- `content`
- `build-deploy`
- `dependency`
- `agent-rules`
- `bugfix`
- `other`

## Constraints

- 新记录追加到 `.agents/changelog.md` 底部。
- 每条记录必须包含日期时间、AgentName、category、摘要、Scope、Files、Reason、Validation。
- `Notes` 没有有用补充时省略整行。
- 绝不记录 API key、token、密码、邮箱凭据或其他敏感信息。
