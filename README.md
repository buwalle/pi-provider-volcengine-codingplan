# pi-provider-volcengine-codingplan

[![npm version](https://img.shields.io/npm/v/pi-provider-volcengine-codingplan.svg?style=flat-square)](https://www.npmjs.com/package/pi-provider-volcengine-codingplan)
[![MIT License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

给 pi 增加火山引擎 Coding Plan 国内版模型支持的扩展包。安装后会注册 `volcengine-plan` provider。

## 功能概览

- 注册火山引擎 Coding Plan provider，兼容 pi 的 OpenAI 风格调用路径
- 凭据通过 `pi /login` 录入（存入 pi keychain）
- 覆盖火山引擎 Coding Plan 当前完整模型集合
- 直接使用国内版 Coding Plan endpoint，而不是基础模型 endpoint

## 安装

```bash
pi install npm:pi-provider-volcengine-codingplan
```

## 使用方式

### 交互式选择模型

```bash
pi
```

进入后：

1. 执行 `/login`，录入火山引擎方舟 API Key（存入 pi keychain，无需配置环境变量）
2. 执行 `/model`，从列表中选择 `volcengine-plan` 下面的模型

### 命令行直接指定模型

推荐始终使用完整 provider/model 语法，避免与内置 provider 的同名模型冲突：

```bash
pi --model volcengine-plan/doubao-seed-2.0-code
pi --model volcengine-plan/glm-5.2
pi --model volcengine-plan/deepseek-v4-pro
pi --model volcengine-plan/kimi-k2.7-code
```

> 提示：`pi --list-models` 只列 pi 内置 catalog，**不会展示扩展注册的模型**，所以看不到 `volcengine-plan` 下的条目（不代表没装好）。查看本 provider 的模型请用交互式 `/model`，或直接看下方「可用模型」表。

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

- 启动时 `fetch` 公开清单 `https://raw.githubusercontent.com/buwalle/pi-provider-volcengine-codingplan/main/registry/models.json`（5s 超时）
- 拉取成功 -> 用清单中的模型动态注册
- 拉取失败 / 超时 / 格式错 -> 回退到插件打包的静态清单（`extensions/fallback-models.ts`），离线仍可用
- 可通过环境变量 `VOLCENGINE_PLAN_REGISTRY_URL` 覆盖清单地址（指向自托管镜像）

清单只含模型元数据（id / reasoning / input / 上下文窗口 / 输出上限），不含 baseUrl、API key 或可执行代码；`baseUrl` 始终是固定的方舟 Coding Plan endpoint。

> 「无感更新」在**启动 pi 时**生效一次，不是运行时后台自动刷新。方舟新增模型后，重启 pi 即可看到。

## 重要说明

- 本扩展使用的是火山引擎 Coding Plan endpoint：`https://ark.cn-beijing.volces.com/api/coding/v3`
- 不要改成普通基础模型接口，否则调用路径和计费方式都可能不符合你的 Coding Plan 预期
- 类似 `glm-5.2`、`deepseek-v4-pro`、`kimi-k2.6` 这类常见模型 id，可能与其他 provider 重名，建议始终使用 `volcengine-plan/模型ID`
- Coding Plan 额度仅限 AI 编程工具使用，请勿用于非编程用途的 API 调用，否则可能被识别为滥用导致订阅停用或账号封禁

## 致谢

本项目是在 [OptimisticQuan/pi-volcengine-coding-plan](https://github.com/OptimisticQuan/pi-volcengine-coding-plan) 基础上的改进优化版本，感谢原作者的工作。

## License

MIT
