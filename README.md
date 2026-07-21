# pi-volcengine-coding-plan

[![npm version](https://img.shields.io/npm/v/pi-volcengine-coding-plan.svg?style=flat-square)](https://www.npmjs.com/package/pi-volcengine-coding-plan)
[![MIT License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

给 pi 增加 Volcengine Coding Plan 国内版模型支持的扩展包。安装后会注册 `volcengine-plan` provider。

## 功能概览

- 注册 Volcengine Coding Plan provider，兼容 pi 的 OpenAI 风格调用路径
- 使用统一的 `VOLCENGINE_API_KEY` 环境变量访问全部模型
- 覆盖 Volcengine Coding Plan 当前完整模型集合
- 直接使用国内版 Coding Plan endpoint，而不是基础模型 endpoint

## 安装

```bash
pi install npm:pi-volcengine-coding-plan
```

## 配置

先准备 Volcengine Ark API Key，然后设置环境变量：

```bash
export VOLCENGINE_API_KEY="your-ark-api-key"
```

如果你想长期使用，把这一行写进 `~/.zshrc` 或 `~/.bashrc`。

## 使用方式

### 交互式选择模型

```bash
pi
```

进入后执行 `/model`，从列表中选择 `volcengine-plan` 下面的模型。

### 命令行直接指定模型

推荐始终使用完整 provider/model 语法，避免与内置 provider 的同名模型冲突：

```bash
pi --model volcengine-plan/doubao-seed-2.0-code
pi --model volcengine-plan/glm-5.2
pi --model volcengine-plan/deepseek-v4-pro
pi --model volcengine-plan/kimi-k2.7-code
```

列出当前所有可用模型：

```bash
pi --list-models
```

如果你要把它设成默认模型，可以参考下面的配置思路：

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "volcengine-plan/doubao-seed-2.0-code"
      }
    }
  }
}
```

## 可用模型

| Model ID | Context Window | Max Tokens | Input | Reasoning |
|----------|----------------|------------|-------|-----------|
| `doubao-seed-code` | 256000 | 32000 | text, image | no |
| `doubao-seed-2.0-code` | 256000 | 65536 | text, image | yes |
| `doubao-seed-2.0-pro` | 256000 | 128000 | text, image | yes |
| `doubao-seed-2.0-lite` | 256000 | 128000 | text, image | yes |
| `glm-5.2` | 1024000 | 128000 | text | yes |
| `deepseek-v4-flash` | 1024000 | 384000 | text | yes |
| `deepseek-v4-pro` | 1024000 | 384000 | text | yes |
| `minimax-m2.7` | 200000 | 128000 | text | yes |
| `minimax-m3` | 512000 | 128000 | text, image | yes |
| `kimi-k2.6` | 256000 | 32000 | text, image | yes |
| `kimi-k2.7-code` | 256000 | 32000 | text, image | yes |

> 模型清单由维护者通过 `arkcli plans model-list --plan coding-plan` + `arkcli models get` 实测生成（见 `scripts/sync-models.ts`），存于 `registry/models.json`。

## 模型清单与自动更新

本扩展**启动时会从 GitHub 拉取最新模型清单**，无需升级插件即可用到方舟新增的套餐模型：

- 启动时 `fetch` 公开清单 `https://raw.githubusercontent.com/<owner>/<repo>/main/registry/models.json`（5s 超时）
- 拉取成功 -> 用清单中的模型动态注册
- 拉取失败 / 超时 / 格式错 -> 回退到插件打包的静态清单（`extensions/fallback-models.ts`），离线仍可用
- 可通过环境变量 `VOLCENGINE_PLAN_REGISTRY_URL` 覆盖清单地址（指向自托管镜像）

清单只含模型元数据（id / reasoning / input / 上下文窗口 / 输出上限），不含 baseUrl、API key 或可执行代码；`baseUrl` 始终是固定的方舟 Coding Plan endpoint。

> 「无感更新」在**启动 pi 时**生效一次，不是运行时后台自动刷新。方舟新增模型后，重启 pi 即可看到。

## 重要说明

- 本扩展使用的是 Volcengine Coding Plan endpoint：`https://ark.cn-beijing.volces.com/api/coding/v3`
- 不要改成普通基础模型接口，否则调用路径和计费方式都可能不符合你的 Coding Plan 预期
- 类似 `glm-5.2`、`deepseek-v4-pro`、`kimi-k2.6` 这类常见模型 id，可能与其他 provider 重名，建议始终使用 `volcengine-plan/模型ID`
- Coding Plan 额度仅限 AI 编程工具使用，请勿用于非编程用途的 API 调用，否则可能被识别为滥用导致订阅停用或账号封禁

## 发布与维护

完整发布流程见 [PUBLISHING.md](./PUBLISHING.md)。

你至少需要完成这几件事：

1. 把 `package.json` 里的 `author` 和 `repository` 改成你自己的信息
2. **把 `extensions/index.ts` 里的 `<owner>/<repo>` 占位符替换成你的实际仓库地址**（否则清单 fetch 永远 404，用户只能拿到打包的静态 fallback，拿不到更新）
3. 在 GitHub 仓库里配置 `NPM_TOKEN`
4. 首次发布前执行一次 `npm publish --dry-run`

### 更新模型

方舟套餐模型变更时，本地跑（前提：`arkcli auth login` 已认证）：

```bash
npm run sync    # arkcli 查套餐 -> 生成 registry + fallback + README 表
npm test        # 验证一致性
```

review sync 报告里 TODO 标记的模型元数据后，提交一个 `feat:` 或 `fix:` commit 触发新版本发布。详见 [PUBLISHING.md](./PUBLISHING.md) 的「后续维护」。

## License

MIT
