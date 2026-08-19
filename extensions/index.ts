import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { FALLBACK_MODELS } from "./fallback-models";

// 公开模型清单 URL 列表。启动时按顺序 fetch，拿最新套餐模型；
// 全部失败则用打包的 FALLBACK_MODELS。
// - jsDelivr CDN 优先（国内一般可达），GitHub raw 兜底。
// - 可通过 VOLCENGINE_PLAN_REGISTRY_URL 环境变量覆盖为单一地址。
const REGISTRY_URLS = process.env.VOLCENGINE_PLAN_REGISTRY_URL
  ? [process.env.VOLCENGINE_PLAN_REGISTRY_URL]
  : [
      "https://cdn.jsdelivr.net/gh/buwalle/pi-provider-volcengine-codingplan@main/registry/models.json",
      "https://raw.githubusercontent.com/buwalle/pi-provider-volcengine-codingplan/main/registry/models.json",
    ];

async function fetchRegistryModels(urls: string[]): Promise<unknown[] | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const data = (await res.json()) as { models?: unknown };
      if (Array.isArray(data?.models) && data.models.length) {
        return data.models;
      }
    } catch {
      // 该源失败/超时/格式错 -> 试下一个；全部失败返回 null
    }
  }
  return null;
}

export default async function (pi: ExtensionAPI) {
  const fetched = await fetchRegistryModels(REGISTRY_URLS);
  const models = (fetched ?? FALLBACK_MODELS) as typeof FALLBACK_MODELS;

  pi.registerProvider("volcengine-plan", {
    name: "Volcengine Coding Plan",
    baseUrl: "https://ark.cn-beijing.volces.com/api/coding/v3",
    apiKey: "$VOLCENGINE_API_KEY",
    api: "openai-completions",
    models,
  });

  // 归一化火山引擎方舟的上下文溢出错误，让 pi 能识别并自动压缩重试。
  // 方舟的 OutofContextError 文案不在 pi 内置的 overflow 检测模式中，
  // 不做归一化时长对话溢出会直接报错而非自动恢复。
  pi.on("message_end", (event, ctx) => {
    const message = event.message;
    if (message.role !== "assistant" || message.stopReason !== "error") return;
    if (
      message.provider !== "volcengine-plan" &&
      ctx.model?.provider !== "volcengine-plan"
    ) {
      return;
    }

    const errorMessage = message.errorMessage ?? "";
    if (errorMessage.includes("context_length_exceeded")) return; // 幂等保护
    if (
      /OutofContextError|exceed max message tokens|exceed.*context/i.test(
        errorMessage
      )
    ) {
      return {
        message: {
          ...message,
          errorMessage: `context_length_exceeded: ${errorMessage}`,
        },
      };
    }
  });
}
