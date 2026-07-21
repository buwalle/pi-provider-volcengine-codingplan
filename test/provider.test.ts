import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadExtension } from "./setup.ts";
import { FALLBACK_MODELS } from "../extensions/fallback-models.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const readmePath = join(__dirname, "..", "README.md");
const registryPath = join(__dirname, "..", "registry", "models.json");
const registryModels = JSON.parse(readFileSync(registryPath, "utf-8")).models;

describe("provider registration (fallback path)", () => {
  it("registers volcengine-plan with correct config", async () => {
    const pi = await loadExtension();
    const provider = pi.providers["volcengine-plan"];
    expect(provider).toBeDefined();
    expect(provider.baseUrl).toBe(
      "https://ark.cn-beijing.volces.com/api/coding/v3"
    );
    expect(provider.apiKey).toBe("$VOLCENGINE_API_KEY");
    expect(provider.api).toBe("openai-completions");
    expect(provider.name).toBe("Volcengine Coding Plan");
    expect(Array.isArray(provider.models)).toBe(true);
    expect(provider.models.length).toBeGreaterThan(0);
  });
});

describe("fetch registry path", () => {
  it("uses fetched models when fetch succeeds with valid list", async () => {
    const fetched = [
      {
        id: "fetched-model",
        name: "Fetched",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 1000,
        maxTokens: 100,
      },
    ];
    const pi = await loadExtension({
      fetchResponse: new Response(JSON.stringify({ models: fetched }), {
        status: 200,
      }),
    });
    expect(pi.providers["volcengine-plan"].models).toEqual(fetched);
  });

  it("falls back when fetch returns non-200", async () => {
    const pi = await loadExtension({
      fetchResponse: new Response("not found", { status: 404 }),
    });
    expect(pi.providers["volcengine-plan"].models).toEqual(FALLBACK_MODELS);
  });

  it("falls back when fetch returns invalid JSON", async () => {
    const pi = await loadExtension({
      fetchResponse: new Response("not json", { status: 200 }),
    });
    expect(pi.providers["volcengine-plan"].models).toEqual(FALLBACK_MODELS);
  });

  it("falls back when models is empty array", async () => {
    const pi = await loadExtension({
      fetchResponse: new Response(JSON.stringify({ models: [] }), {
        status: 200,
      }),
    });
    expect(pi.providers["volcengine-plan"].models).toEqual(FALLBACK_MODELS);
  });

  it("falls back when fetch rejects", async () => {
    const pi = await loadExtension();
    expect(pi.providers["volcengine-plan"].models).toEqual(FALLBACK_MODELS);
  });
});

describe("model metadata completeness (registry)", () => {
  for (const model of registryModels) {
    describe(`model ${model.id}`, () => {
      it("has all required fields", () => {
        expect(typeof model.id).toBe("string");
        expect(typeof model.name).toBe("string");
        expect(typeof model.reasoning).toBe("boolean");
        expect(Array.isArray(model.input)).toBe(true);
        expect(model.cost).toBeDefined();
        expect(typeof model.contextWindow).toBe("number");
        expect(typeof model.maxTokens).toBe("number");
      });

      it("cost has four numeric fields", () => {
        const { cost } = model;
        expect(typeof cost.input).toBe("number");
        expect(typeof cost.output).toBe("number");
        expect(typeof cost.cacheRead).toBe("number");
        expect(typeof cost.cacheWrite).toBe("number");
      });

      it("input only contains text/image", () => {
        for (const i of model.input) expect(["text", "image"]).toContain(i);
      });

      it("contextWindow and maxTokens are positive", () => {
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(model.maxTokens).toBeGreaterThan(0);
      });

      it("has consistent compat", () => {
        expect(model.compat).toEqual({
          supportsDeveloperRole: false,
          maxTokensField: "max_tokens",
        });
      });
    });
  }

  it("model ids are unique", () => {
    const ids = registryModels.map((m: any) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("fallback-models.ts <-> registry consistency", () => {
  it("fallback models match registry models", () => {
    expect(FALLBACK_MODELS).toEqual(registryModels);
  });
});

describe("README <-> registry consistency", () => {
  const readme = readFileSync(readmePath, "utf-8");
  const rowRe =
    /^\|\s*`([^`]+)`\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*(yes|no)\s*\|$/gm;
  const rows: Array<{
    id: string;
    ctx: number;
    max: number;
    input: string[];
    reasoning: boolean;
  }> = [];
  let m;
  while ((m = rowRe.exec(readme)) !== null) {
    rows.push({
      id: m[1],
      ctx: Number(m[2]),
      max: Number(m[3]),
      input: m[4]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      reasoning: m[5] === "yes",
    });
  }

  it("README model table parsed at least one row", () => {
    expect(rows.length).toBeGreaterThan(0);
  });

  it("model id set matches README", () => {
    const regIds = registryModels.map((mm: any) => mm.id).sort();
    const readIds = rows.map((r) => r.id).sort();
    expect(regIds).toEqual(readIds);
  });

  for (const row of rows) {
    it(`README row ${row.id} matches registry`, () => {
      const model = registryModels.find((mm: any) => mm.id === row.id);
      expect(model, `model ${row.id} missing in registry`).toBeDefined();
      expect(model.contextWindow).toBe(row.ctx);
      expect(model.maxTokens).toBe(row.max);
      expect(model.input).toEqual(row.input);
      expect(model.reasoning).toBe(row.reasoning);
    });
  }
});
