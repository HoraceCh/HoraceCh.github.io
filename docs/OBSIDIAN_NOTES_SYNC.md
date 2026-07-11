# Obsidian Notes Sync 使用说明

本项目提供 `tools/sync-obsidian-notes.mjs`，用于把一个明确选择的 Obsidian Publish 文件夹同步到 Astro notes 内容集合。

这个脚本只会读取 `--source` 指定目录里的 Markdown 文件。`--vault` 不能作为发布来源，只能作为解析附件路径的辅助目录。脚本不会扫描整个 Obsidian vault 来发布 notes。

## 本地 Publish 文件夹工作流

复制仓库根目录的 `notes.publish.example.json` 为 `notes.publish.local.json`，并只在本机填写路径。该本地文件已被 `.gitignore` 忽略，不能提交。

当前本机约定为：`vaultRoot = F:/Obsidian/Baukasten_Nexus`，`publishSource = F:/Obsidian/Baukasten_Nexus/98 Publish`。Publish 文件夹位于 vault 中，但它是唯一的公开 Markdown 扫描范围；vaultRoot 只用于对单个 wikilink、图片、附件和相对路径进行解析。

`attachmentSearchPaths` 是相对于 `vaultRoot` 的附件目录列表，仅用于解析图片和附件（可递归查找文件），绝不会作为 Markdown 发布来源。推荐使用单个可移植根目录 `99 Settings/Reference`；它会覆盖当前的 C、Python、IR 图片子目录。对同名附件，脚本只在明确路径命中时选用；递归 basename 查找发现多个候选时会报告 `AMBIGUOUS_ASSET` 并在 strict 模式失败。

```powershell
npm run notes:publish:dry
npm run notes:publish
npm run notes:publish:strict
```

`notes:publish:dry` 不写入或删除文件。`notes:publish` 写入转换后的内容和必要附件。`notes:publish:strict` 会在 unresolved link、missing asset、slug conflict、frontmatter/schema warning 或其他 blocking warning 出现时失败。每次同步后运行 `npm run build`。

Publish 扫描会跳过以下内容并报告：以下划线开头的文件或文件夹、私有 / 草稿 / 模板命名的 Markdown 文件、`private` / `draft` / `template` 文件夹、frontmatter 不完整或 `publish` 值不明确的 note，以及 frontmatter 中 `publish: false` 的 note。若配置 `requireReadyFrontmatter: true`，只有显式 `publish: true` 的 note 会同步。

## 输出位置

默认输出：

- 转换后的 notes：`src/content/notes`
- 复制后的附件：`astro-public/notes-assets`

`astro-public/` 是 Astro 当前配置的 public directory，所以附件会以 `/notes-assets/...` 的 URL 在站点中访问。

## 推荐流程

先 dry-run，确认将要写入的文件和 warnings：

```powershell
npm.cmd run notes:sync:dry -- --source "D:\Path\To\Obsidian Publish" --vault "D:\Path\To\Obsidian Vault"
```

如果输出符合预期，再执行真实同步：

```powershell
npm.cmd run notes:sync -- --source "D:\Path\To\Obsidian Publish" --vault "D:\Path\To\Obsidian Vault"
```

同步后运行构建检查：

```powershell
npm.cmd run build
```

如果希望 warnings 导致命令失败，使用 strict 模式：

```powershell
npm.cmd run notes:sync:strict -- --source "D:\Path\To\Obsidian Publish" --vault "D:\Path\To\Obsidian Vault"
```

## 参数说明

`--source <path>`：Obsidian Publish 文件夹。只有这个目录里的 Markdown 文件会被发布。也可以用环境变量 `OBSIDIAN_PUBLISH_DIR` 提供。

`--vault <path>`：可选的 Obsidian vault 根目录。只用于辅助查找被引用的附件；不要把它当作发布来源。

`--out <path>`：转换后 notes 的输出目录。默认是 `src/content/notes`。

`--assets <path>`：附件输出目录。默认是 `astro-public/notes-assets`。

`--dry-run`：只打印计划动作和 warnings，不写入、不删除、不复制、不修改任何文件。

`--clean`：同步前清理脚本之前生成的 notes 和附件。清理范围只限配置的 `--out` 和 `--assets` 目录；不会触碰 Obsidian source、vault、Astro 页面、布局或网站设计。

`--strict`：如果出现 warnings，以非零状态码结束，适合 CI 或发布前检查。

## 会转换的内容

- `[[Note Name]]` 转成 `/notes/[slug]/` 链接。
- `[[Note Name|Alias]]` 保留显示文本，链接到对应 note。
- `![[image.png]]` 和 Markdown 图片会复制附件到 `astro-public/notes-assets/[note-slug]/`。
- 附件查找会优先保持原有顺序：note 同级、Publish 文件夹、常见附件目录，然后在 `--vault` 中查找。额外支持 vault 下的集中图片目录：`99 Settings/Reference/C Images` 和 `99 Settings/Reference/Python Images`。
- 如果同一篇 note 中两个不同来源的附件清理后会写到同一个输出文件名，脚本会保留第一个输出路径，并给后续冲突文件追加来自源路径的短后缀，避免静默覆盖。
- Obsidian callout 会转换成普通 Markdown blockquote。
- `==highlight==` 会转换成 `<mark>highlight</mark>`。
- 代码围栏的语言标记会做确定性规范化，不修改代码内容或额外 metadata：`C` / `c语言` -> `c`，`Python` / `py` -> `python`，`Cpp` / `C++` / `cpp` -> `cpp`，`SHELL` / `Shell` -> `shell`，`bash` -> `bash`，`OUTPUT` / `output` / `txt` -> `text`。
- Dataview / DataviewJS 代码块会被移除，并输出 warning。
- 缺失或不符合 Astro notes schema 的 frontmatter 会被规范化。

## Warnings 需要处理什么

`unresolved wiki link`：wiki link 没有在 `--source` 的 Markdown 文件中找到对应 note。确认目标 note 是否应该放进 Publish 文件夹，或者改成普通外部链接。

`missing asset`：引用的附件找不到。确认附件是否在 Publish 文件夹、note 同级目录、常见附件目录，或 `--vault` 里。

`asset-collision`：两个不同来源的附件会写入同一个清理后的输出文件名。脚本会为后续文件追加短后缀并在 dry-run 中报告映射结果。

`removed Dataview block`：Dataview 内容不会发布。需要公开展示的内容应改成普通 Markdown。

`skipped existing file`：输出目录里已有同名文件，但不是此脚本生成的文件。脚本会跳过它，避免覆盖手写内容。

## 安全边界

- 不要把整个 Obsidian vault 传给 `--source`。
- `--source` 是唯一会被扫描并发布 Markdown 的目录。
- `--vault` 不会被扫描成公开 notes。
- 脚本不会在 Obsidian vault 内创建、修改或删除文件。
- `--dry-run` 不会产生任何文件系统改动。
- `--clean` 只清理配置的输出 notes 目录和附件目录中由脚本生成的内容。
- 脚本不会修改 Obsidian source、vault、Astro 页面、布局或现有设计。
