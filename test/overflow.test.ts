import { describe, it, expect } from "vitest";
import { loadExtension } from "./setup.ts";

// 对照 pi Custom Providers 指南的 Context Overflow Errors 章节：
// 扩展用 message_end handler 把方舟特有的溢出错误归一化成
// pi 能识别的 `context_length_exceeded`，并严格 scope 到本 provider，
// 避免把 rate-limit 之类的错误误判为溢出而触发错误的自动压缩。
const pi = await loadExtension();
const handler = pi.handlers["message_end"];

describe("message_end overflow normalization", () => {
  it("handler is registered", () => {
    expect(handler).toBeDefined();
  });

  it("ignores non-assistant messages", () => {
    const result = handler(
      {
        message: {
          role: "user",
          stopReason: "error",
          errorMessage: "OutofContextError",
        },
      },
      { model: { provider: "volcengine-plan" } }
    );
    expect(result).toBeUndefined();
  });

  it("ignores non-error stopReason", () => {
    const result = handler(
      {
        message: {
          role: "assistant",
          stopReason: "stop",
          errorMessage: "OutofContextError",
        },
      },
      { model: { provider: "volcengine-plan" } }
    );
    expect(result).toBeUndefined();
  });

  it("ignores errors from other providers", () => {
    const result = handler(
      {
        message: {
          role: "assistant",
          stopReason: "error",
          provider: "openai",
          errorMessage: "OutofContextError",
        },
      },
      { model: { provider: "openai" } }
    );
    expect(result).toBeUndefined();
  });

  it("is idempotent when errorMessage already contains context_length_exceeded", () => {
    const result = handler(
      {
        message: {
          role: "assistant",
          stopReason: "error",
          provider: "volcengine-plan",
          errorMessage: "context_length_exceeded: OutofContextError: foo",
        },
      },
      { model: { provider: "volcengine-plan" } }
    );
    expect(result).toBeUndefined();
  });

  it("rewrites OutofContextError", () => {
    const result = handler(
      {
        message: {
          role: "assistant",
          stopReason: "error",
          provider: "volcengine-plan",
          errorMessage: "OutofContextError: too long",
        },
      },
      { model: { provider: "volcengine-plan" } }
    );
    expect(result).toEqual({
      message: expect.objectContaining({
        errorMessage: "context_length_exceeded: OutofContextError: too long",
      }),
    });
  });

  it("rewrites 'exceed max message tokens'", () => {
    const result = handler(
      {
        message: {
          role: "assistant",
          stopReason: "error",
          provider: "volcengine-plan",
          errorMessage: "exceed max message tokens: 123",
        },
      },
      { model: { provider: "volcengine-plan" } }
    );
    expect(result?.message?.errorMessage).toBe(
      "context_length_exceeded: exceed max message tokens: 123"
    );
  });

  it("rewrites 'exceeded the context window'", () => {
    const result = handler(
      {
        message: {
          role: "assistant",
          stopReason: "error",
          provider: "volcengine-plan",
          errorMessage: "Messages exceeded the context window limit",
        },
      },
      { model: { provider: "volcengine-plan" } }
    );
    expect(result?.message?.errorMessage).toBe(
      "context_length_exceeded: Messages exceeded the context window limit"
    );
  });

  it("does NOT rewrite rate-limit errors (guard against false compaction)", () => {
    // 指南强调：不能把 rate-limit / too many requests 误判为溢出，
    // 否则会触发自动压缩而非 pi 正常的退避重试。
    const result = handler(
      {
        message: {
          role: "assistant",
          stopReason: "error",
          provider: "volcengine-plan",
          errorMessage: "Rate limit exceeded, too many requests",
        },
      },
      { model: { provider: "volcengine-plan" } }
    );
    expect(result).toBeUndefined();
  });

  it("detects provider via ctx.model.provider when message.provider missing", () => {
    const result = handler(
      {
        message: {
          role: "assistant",
          stopReason: "error",
          errorMessage: "OutofContextError",
        },
      },
      { model: { provider: "volcengine-plan" } }
    );
    expect(result?.message?.errorMessage).toBe(
      "context_length_exceeded: OutofContextError"
    );
  });

  it("detects provider via message.provider when ctx.model missing", () => {
    const result = handler(
      {
        message: {
          role: "assistant",
          stopReason: "error",
          provider: "volcengine-plan",
          errorMessage: "OutofContextError",
        },
      },
      {}
    );
    expect(result?.message?.errorMessage).toBe(
      "context_length_exceeded: OutofContextError"
    );
  });

  it("preserves other message fields on rewrite", () => {
    const original = {
      role: "assistant",
      stopReason: "error",
      provider: "volcengine-plan",
      errorMessage: "OutofContextError",
      content: ["x"],
      usage: { input: 5 },
    };
    const result = handler(
      { message: original },
      { model: { provider: "volcengine-plan" } }
    );
    expect(result?.message).toMatchObject({
      role: "assistant",
      stopReason: "error",
      provider: "volcengine-plan",
      content: ["x"],
      usage: { input: 5 },
      errorMessage: "context_length_exceeded: OutofContextError",
    });
  });
});
