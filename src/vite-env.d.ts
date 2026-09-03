/// <reference types="vite/client" />

interface WebMcpTool {
  name: string
  title?: string
  description: string
  inputSchema?: Record<string, unknown>
  annotations?: {
    readOnlyHint?: boolean
    untrustedContentHint?: boolean
  }
  execute: (input: Record<string, unknown>) => unknown | Promise<unknown>
}

interface ModelContext {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): Promise<void>
}

interface Document {
  readonly modelContext?: ModelContext
}
