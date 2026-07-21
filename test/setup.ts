import { vi } from "vitest";
import ext from "../extensions/index.ts";

export interface FakePi {
  /** registerProvider(name, config) 注册的 provider，按 name 索引。 */
  providers: Record<string, any>;
  /** on(event, handler) 注册的事件 handler，按 event 名索引。 */
  handlers: Record<string, (event: any, ctx: any) => any>;
  registerProvider(name: string, config: any): void;
  on(event: string, handler: (event: any, ctx: any) => any): void;
}

export function createFakePi(): FakePi {
  const providers: Record<string, any> = {};
  const handlers: Record<string, (event: any, ctx: any) => any> = {};
  return {
    providers,
    handlers,
    registerProvider(name, config) {
      providers[name] = config;
    },
    on(event, handler) {
      handlers[event] = handler;
    },
  };
}

export interface LoadOpts {
  /** 成功时的 Response；不传或传 null -> fetch reject（测 fallback 路径）。 */
  fetchResponse?: Response | null;
}

/** 用一个全新的 fake pi 加载扩展（async factory）。默认 fetch 失败走 fallback。 */
export async function loadExtension(opts: LoadOpts = {}): Promise<FakePi> {
  const pi = createFakePi();
  const originalFetch = globalThis.fetch;
  if (!opts.fetchResponse) {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error("test: no network"))
    ) as any;
  } else {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(opts.fetchResponse as Response)
    ) as any;
  }
  try {
    await (ext as (pi: FakePi) => Promise<void>)(pi);
  } finally {
    globalThis.fetch = originalFetch;
  }
  return pi;
}
