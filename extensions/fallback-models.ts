// 该文件由 scripts/sync-models.ts 从 registry/models.json 自动生成。
// 作用：扩展运行时 fetch 公开清单失败时的离线 fallback。
// 不要手动编辑--改模型请跑 `npm run sync`，或编辑 registry/models.json 后再跑 sync。
import type { ProviderModelConfig } from "@earendil-works/pi-coding-agent";

export const FALLBACK_MODELS: ProviderModelConfig[] = [
  {
    "id": "doubao-seed-2-1-turbo",
    "name": "doubao-seed-2-1-turbo",
    "reasoning": true,
    "input": [
      "text",
      "image"
    ],
    "cost": {
      "input": 0,
      "output": 0,
      "cacheRead": 0,
      "cacheWrite": 0
    },
    "contextWindow": 256000,
    "maxTokens": 256000,
    "compat": {
      "supportsDeveloperRole": false,
      "maxTokensField": "max_tokens"
    }
  },
  {
    "id": "doubao-seed-2.0-lite",
    "name": "doubao-seed-2.0-lite",
    "reasoning": true,
    "input": [
      "text",
      "image"
    ],
    "cost": {
      "input": 0,
      "output": 0,
      "cacheRead": 0,
      "cacheWrite": 0
    },
    "contextWindow": 256000,
    "maxTokens": 128000,
    "compat": {
      "supportsDeveloperRole": false,
      "maxTokensField": "max_tokens"
    }
  },
  {
    "id": "glm-5.3",
    "name": "glm-5.3",
    "reasoning": true,
    "input": [
      "text"
    ],
    "cost": {
      "input": 0,
      "output": 0,
      "cacheRead": 0,
      "cacheWrite": 0
    },
    "contextWindow": 128000,
    "maxTokens": 32000,
    "compat": {
      "supportsDeveloperRole": false,
      "maxTokensField": "max_tokens"
    }
  },
  {
    "id": "deepseek-v4-flash",
    "name": "deepseek-v4-flash",
    "reasoning": true,
    "input": [
      "text"
    ],
    "cost": {
      "input": 0,
      "output": 0,
      "cacheRead": 0,
      "cacheWrite": 0
    },
    "contextWindow": 1024000,
    "maxTokens": 384000,
    "compat": {
      "supportsDeveloperRole": false,
      "maxTokensField": "max_tokens"
    }
  },
  {
    "id": "glm-5.2",
    "name": "glm-5.2",
    "reasoning": true,
    "input": [
      "text"
    ],
    "cost": {
      "input": 0,
      "output": 0,
      "cacheRead": 0,
      "cacheWrite": 0
    },
    "contextWindow": 1024000,
    "maxTokens": 128000,
    "compat": {
      "supportsDeveloperRole": false,
      "maxTokensField": "max_tokens"
    }
  },
  {
    "id": "kimi-k2.7-code",
    "name": "kimi-k2.7-code",
    "reasoning": true,
    "input": [
      "text",
      "image"
    ],
    "cost": {
      "input": 0,
      "output": 0,
      "cacheRead": 0,
      "cacheWrite": 0
    },
    "contextWindow": 256000,
    "maxTokens": 32000,
    "compat": {
      "supportsDeveloperRole": false,
      "maxTokensField": "max_tokens"
    }
  },
  {
    "id": "minimax-m3",
    "name": "minimax-m3",
    "reasoning": true,
    "input": [
      "text",
      "image"
    ],
    "cost": {
      "input": 0,
      "output": 0,
      "cacheRead": 0,
      "cacheWrite": 0
    },
    "contextWindow": 512000,
    "maxTokens": 128000,
    "compat": {
      "supportsDeveloperRole": false,
      "maxTokensField": "max_tokens"
    }
  },
  {
    "id": "deepseek-v4-pro",
    "name": "deepseek-v4-pro",
    "reasoning": true,
    "input": [
      "text"
    ],
    "cost": {
      "input": 0,
      "output": 0,
      "cacheRead": 0,
      "cacheWrite": 0
    },
    "contextWindow": 1024000,
    "maxTokens": 384000,
    "compat": {
      "supportsDeveloperRole": false,
      "maxTokensField": "max_tokens"
    }
  }
];
