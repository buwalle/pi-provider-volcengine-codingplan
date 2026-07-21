// 模型清单同步脚本：用 arkcli 查询 Coding Plan 套餐模型，合并生成
// registry/models.json + extensions/fallback-models.ts + README 模型表。
//
// 用法：npm run sync
// 前提：本地 arkcli 已认证（arkcli auth login）。
//
// 合并策略（保护人工维护的元数据，不丢失）：
//   - 模型 id 集合以 plans model-list 为准（检测新增/移除）
//   - reasoning  <- plans model-list 的 enabled_thinking
//   - contextWindow/maxTokens/input <- models get（拿到才覆盖；拿不到保留现有值）
//   - cost/compat 固定写死
//   - models get 不可用的模型（preview/modelhub）输出到 TODO 清单供人工核
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const REGISTRY_PATH = "registry/models.json";
const FALLBACK_PATH = "extensions/fallback-models.ts";
const README_PATH = "README.md";
const PLAN = "coding-plan";

function runArkcli(args: string[]): any {
  const cmd = `arkcli ${args.join(" ")} --format json`;
  const stdout = execSync(cmd, {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
    stdio: ["pipe", "pipe", "ignore"],
  });
  return JSON.parse(stdout);
}

function tokenStrToNum(s: string | undefined): number {
  if (!s) return 0;
  const m = s.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  if (m[2] === "k") n *= 1000;
  else if (m[2] === "m") n *= 1000000;
  return Math.round(n);
}

function mapInput(input: string[] | undefined): ("text" | "image")[] {
  return (input ?? ["text"]).filter(
    (x) => x === "text" || x === "image"
  ) as ("text" | "image")[];
}

interface ModelMeta {
  contextWindow?: string;
  maxTokens?: string;
  input?: string[];
}

function getModelMeta(modelId: string): ModelMeta | null {
  try {
    const o = runArkcli(["models", "get", modelId]);
    if (o && o.ok === false) return null;
    const lim = o.limits ?? {};
    const mod = o.modalities ?? {};
    return {
      contextWindow: lim.context_window,
      maxTokens: lim.max_completion_token_length,
      input: mod.input,
    };
  } catch {
    return null;
  }
}

function buildReadmeTable(models: any[]): string {
  const header =
    "| Model ID | Context Window | Max Tokens | Input | Reasoning |\n|----------|----------------|------------|-------|-----------|";
  const rows = models
    .map(
      (m) =>
        `| \`${m.id}\` | ${m.contextWindow} | ${m.maxTokens} | ${m.input.join(", ")} | ${m.reasoning ? "yes" : "no"} |`
    )
    .join("\n");
  return `${header}\n${rows}`;
}

function replaceReadmeTable(readme: string, table: string): string {
  const re = /\| Model ID[^\n]*\n\|[-: |]+\n(?:\|[^\n]*\n)+/;
  if (!re.test(readme)) return readme;
  return readme.replace(re, table + "\n");
}

function main() {
  console.log(`[sync] 查询套餐 ${PLAN} 模型列表...`);
  const planRes = runArkcli(["plans", "model-list", "--plan", PLAN]);
  const planModels: Array<{
    output_name?: string;
    model_name?: string;
    model_id?: string;
    enabled_thinking?: boolean;
  }> = planRes.models ?? [];
  console.log(`[sync] 套餐返回 ${planModels.length} 个模型`);

  const existing: any[] = existsSync(REGISTRY_PATH)
    ? JSON.parse(readFileSync(REGISTRY_PATH, "utf-8")).models ?? []
    : [];
  const existingById = new Map(existing.map((m) => [m.id, m]));

  const result: any[] = [];
  const todos: string[] = [];
  const planIds = new Set<string>();

  for (const p of planModels) {
    const id = p.output_name;
    if (!id || id === "auto") continue; // 跳过智能调度
    planIds.add(id);
    const ex = existingById.get(id);
    const meta = getModelMeta(p.model_id ?? id);
    const model = {
      id,
      name: ex?.name ?? p.model_name ?? id,
      reasoning: p.enabled_thinking === true,
      input: meta ? mapInput(meta.input) : ex?.input ?? ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow:
        meta && meta.contextWindow
          ? tokenStrToNum(meta.contextWindow)
          : ex?.contextWindow ?? 128000,
      maxTokens:
        meta && meta.maxTokens
          ? tokenStrToNum(meta.maxTokens)
          : ex?.maxTokens ?? 32000,
      compat: { supportsDeveloperRole: false, maxTokensField: "max_tokens" },
    };
    if (!meta) {
      todos.push(
        `${id}: arkcli models get 不可用，保留现有元数据（contextWindow/maxTokens/input 需人工核）`
      );
    }
    result.push(model);
  }

  const removed = existing.filter((m) => !planIds.has(m.id)).map((m) => m.id);
  const newIds = result.filter((m) => !existingById.has(m.id)).map((m) => m.id);

  const today = new Date().toISOString().slice(0, 10);
  const registry = {
    version: today,
    source: "arkcli plans model-list + models get",
    models: result,
  };
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");
  console.log(`[sync] 写 ${REGISTRY_PATH} (${result.length} 个模型)`);

  const fallbackTs = `// 该文件由 scripts/sync-models.ts 从 registry/models.json 自动生成。
// 作用：扩展运行时 fetch 公开清单失败时的离线 fallback。
// 不要手动编辑--改模型请跑 \`npm run sync\`，或编辑 registry/models.json 后再跑 sync。
import type { ProviderModelConfig } from "@earendil-works/pi-coding-agent";

export const FALLBACK_MODELS: ProviderModelConfig[] = ${JSON.stringify(result, null, 2)};
`;
  writeFileSync(FALLBACK_PATH, fallbackTs);
  console.log(`[sync] 写 ${FALLBACK_PATH}`);

  if (existsSync(README_PATH)) {
    const readme = readFileSync(README_PATH, "utf-8");
    const table = buildReadmeTable(result);
    const newReadme = replaceReadmeTable(readme, table);
    if (newReadme !== readme) {
      writeFileSync(README_PATH, newReadme);
      console.log(`[sync] 更新 ${README_PATH} 模型表`);
    } else {
      console.log(`[sync] 警告: README 模型表区域未定位到，未更新。生成的表:\n${table}\n`);
    }
  }

  console.log("\n=== sync 报告 ===");
  console.log(`模型数: ${result.length}`);
  if (newIds.length) console.log(`新增模型: ${newIds.join(", ")}`);
  if (removed.length)
    console.log(`已从套餐移除(未自动删，需人工确认): ${removed.join(", ")}`);
  if (todos.length) {
    console.log(`需人工核:`);
    todos.forEach((t) => console.log(`  - ${t}`));
  }
  if (!newIds.length && !removed.length && !todos.length) console.log("无变化");
}

main();
