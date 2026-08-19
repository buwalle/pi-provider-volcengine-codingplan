# pi-provider-volcengine-codingplan 发布指南

这份文档按“从 0 到发布完成”的顺序整理，适合第一次发布 pi 扩展包。

## 1. 先确认本地文件已经准备好

当前目录应该至少包含这些文件：

- `package.json`
- `extensions/index.ts`
- `extensions/fallback-models.ts`
- `registry/models.json`
- `scripts/sync-models.ts`
- `test/`（单元测试）
- `.github/workflows/publish.yml`
- `.github/workflows/test.yml`
- `.github/workflows/sync-models.yml`
- `README.md`
- `PUBLISHING.md`
- `LICENSE`

## 2. 创建 GitHub 仓库

如果你还没有仓库，可以按下面做：

```bash
git init
git add .
git commit -m "feat: initial release"
git branch -M main
```

然后在 GitHub 创建一个新仓库，比如：

```text
pi-provider-volcengine-codingplan
```

把远程仓库地址加到本地：

```bash
git remote add origin git@github.com:buwalle/pi-provider-volcengine-codingplan.git
git push -u origin main
```

## 3. 确认占位信息已替换

首次发布前，确认这些信息已经指向你自己的仓库（本项目已完成）：

- `package.json` 的 `author` 和 `repository.url`
- `extensions/index.ts` 里的清单 fetch URL 指向 `https://raw.githubusercontent.com/buwalle/pi-provider-volcengine-codingplan/main/registry/models.json`

后者尤其关键：不替换的话，扩展启动时 fetch 清单永远 404，用户只能拿到打包的静态 fallback，拿不到后续模型更新。

## 4. 准备 npm 账号和包名

如果你还没有 npm 账号：

1. 访问 https://www.npmjs.com/signup 注册
2. 在终端执行 `npm login`
3. 执行 `npm whoami` 确认已登录

同时建议先确认包名还可用：

```bash
npm view pi-provider-volcengine-codingplan
```

如果返回 404，通常说明这个包名还没有被占用。

## 5. 本地做首次发布前检查

先安装依赖并生成 `package-lock.json`：

```bash
npm install
```

然后做一次 dry-run：

```bash
npm publish --dry-run
```

你需要重点看这几项：

- 打包文件里只有扩展需要的文件
- 包名、版本号、README、LICENSE 正常

如果本机装了 pi，也建议做一次功能检查：

```bash
pi install .
pi --list-models
```

确认能看到 `volcengine-plan/doubao-seed-2.0-code` 以及其他模型。

## 6. 配置 GitHub Actions 发版

当前仓库已经准备好了工作流文件：

- `.github/workflows/publish.yml`

push 到 `main` 时，工作流会读取 commit message：只有 `feat:` / `fix:` / `BREAKING CHANGE` 的 commit 才会 bump 版本并发布；`docs:` / `chore:` / `refactor:` 等只跑测试、不发版。

### 你必须配置的 GitHub Secret

进入仓库：

```text
GitHub Repository -> Settings -> Secrets and variables -> Actions
```

新增一个 secret：

- Name: `NPM_TOKEN`
- Value: 你的 npm 发布 token（见下一步）

## 7. 创建 npm 发布 Token

进入 npm 后台：

```text
https://www.npmjs.com/settings/buwalle/tokens
```

推荐创建 **Granular Access Token**（最小权限）：

- Token name: `pi-provider-volcengine-codingplan CI`
- Expiration: 90 days
- Packages: Read and write
- Select packages: 勾选 `pi-provider-volcengine-codingplan`（包发布后才能选到）
- Organizations: No access
- Allowed IP ranges: 留空

> 若账号开启了 2FA，Granular Token 用于 CI 发布时会 bypass OTP，无需手动输码。

把它填到 GitHub 的 `NPM_TOKEN` secret。不要把 token 写进仓库，也不要直接提交到代码里。

## 8. 版本号规则

`publish.yml` 根据 commit message 决定是否发版及版本号升级：

- **不发版**：`docs` / `chore` / `refactor` / `perf` / `test` / `ci` 等前缀（只跑测试）
- **Patch**：`fix` / `patch` / `bugfix`
- **Minor**：`feat` / `feature` / `add`
- **Major**：`BREAKING CHANGE` / `breaking`

示例：

```bash
git commit -m "feat: sync coding plan models"          # 发版，minor
git commit -m "fix: correct deepseek model metadata"   # 发版，patch
git commit -m "docs: improve publishing guide"          # 不发版，仅测试
```

## 9. 首次发布有两种方式

### 方式 A：先手动发布一次

适合第一次想先确认 npm 发布没问题：

```bash
npm publish --access public
```

发布成功后，再把后续版本交给 GitHub Actions。

### 方式 B：直接交给 GitHub Actions 首次发布

前提是：

- GitHub 仓库已创建
- `NPM_TOKEN` 已配置
- 代码已 push 到 `main`

只要你 push 一个 `feat:` / `fix:` / `BREAKING CHANGE` 的 commit，Action 就会发版。

## 10. 发布后怎么验证

### 检查 npm 页面

打开：

```text
https://www.npmjs.com/package/pi-provider-volcengine-codingplan
```

确认：

- 版本号正确
- README 正常显示
- 安装命令可见

### 检查 GitHub Actions

打开仓库的 `Actions` 页面，确认：

- `Publish npm Package` 工作流成功
- 生成了版本 bump commit
- 打了对应 tag

## 11. 检查 pi 是否收录

pi 的包索引通常会自动抓取包含以下条件的公开 npm 包：

- `keywords` 里包含 `pi-package`
- `package.json` 里有 `pi.extensions`
- npm 包是公开的

当前项目已经满足这些条件。

一般情况下：

- 几小时到 24 小时内可以看到
- 最慢可能需要 48 小时

发布后可以检查：

```text
https://pi.dev/packages
```

如果 48 小时后还没出现，可以去下面这个仓库提 issue：

```text
https://github.com/badlogic/pi-mono/issues
```

说明你的包名是 `pi-provider-volcengine-codingplan`，并附上 npm 链接。

## 12. 后续维护建议

### 更新模型

方舟套餐模型变更时，本地跑（前提：`arkcli auth login` 已认证）：

```bash
npm run sync    # arkcli 查套餐 -> 生成 registry/models.json + extensions/fallback-models.ts + README 表
npm test        # 验证 fallback↔registry、README↔registry 一致性
```

`npm run sync` 的合并策略会保护人工维护的元数据：`arkcli models get` 能查到的字段（标准模型的 contextWindow/maxTokens/input、reasoning）自动更新；查不到的模型（preview/modelhub 类，如 doubao-seed-2.0-code/kimi/minimax）保留现有值并在报告里标 TODO，需人工核。

**用户端 fetch 失败（国内网络对 GitHub 不稳定）**：扩展启动时先试 jsDelivr CDN、再试 GitHub raw，全部失败才回退到打包的 fallback。fallback 只在**发版后用户升级扩展**才会更新，所以用户反馈"模型没更新"时，引导其执行 `pi update --extensions` 升级到最新版并完全重启 pi（扩展只在进程启动时加载一次），不必等网络恢复。

review 报告后提交一个 `feat:` 或 `fix:` commit 触发新版本发布。

### 发版前检查清单

每次发版前至少检查：

1. `package.json` 版本和元数据是否合理
2. `extensions/index.ts` 里的清单 fetch URL 指向 `buwalle/pi-provider-volcengine-codingplan`
3. commit 前缀是 `feat` / `fix` / `BREAKING CHANGE` 才会发版，其他只跑测试
4. `npm publish --dry-run` 是否通过
5. `npm test` 是否全绿
6. `README.md` 的安装和使用示例是否还是准确的
7. `VOLCENGINE_API_KEY` 名称是否和代码保持一致

## 13. 推荐的一次完整流程

```bash
npm install
npm publish --dry-run
git add .
git commit -m "feat: initial release"
git push -u origin main
```

然后：

1. 看 GitHub Actions 是否成功
2. 看 npm 页面是否上线
3. 等待 pi 收录
