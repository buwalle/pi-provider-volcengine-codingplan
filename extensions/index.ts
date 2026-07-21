import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { FALLBACK_MODELS } from "./fallback-models";

// 公开模型清单 URL（raw.githubusercontent）。启动时 fetch 拿最新套餐模型，
// 失败则用打包的 FALLBACK_MODELS。发布前把 <owner>/<repo> 替换成实际仓库地址，
// 或通过 VOLCENGINE_PLAN_REGISTRY_URL 环境变量覆盖。
const DEFAULT_REGISTRY_URL =
  "https://raw.githubusercontent.com/<owner>/<repo>/main/registry/models.json";
const REGISTRY_URL =
  process.env.VOLCENGINE_PLAN_REGISTRY_URL ?? DEFAULT_REGISTRY_URL;

export default async function (pi: ExtensionAPI) {
  let models = FALLBACK_MODELS;
  try {
    const res = await fetch(REGISTRY_URL, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = (await res.json()) as { models?: unknown };
      if (Array.isArray(data?.models) && data.models.length) {
        models = data.models as typeof FALLBACK_MODELS;
      }
    }
  } catch {
    // 网络失败/超时/格式错 -> 用打包的静态 fallback
  }

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
