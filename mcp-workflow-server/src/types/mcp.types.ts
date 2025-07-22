import { z } from 'zod';

export interface MCPServerCapabilities {
  resources: boolean;
  tools: boolean;
  prompts: boolean;
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: unknown;
}

export interface MCPResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  result?: T;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export const MCPResourceSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type MCPResource = z.infer<typeof MCPResourceSchema>;

export const MCPToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.object({
    type: z.literal('object'),
    properties: z.record(z.unknown()),
    required: z.array(z.string()).optional(),
  }),
});

export type MCPTool = z.infer<typeof MCPToolSchema>;

export const MCPPromptSchema = z.object({
  name: z.string(),
  description: z.string(),
  arguments: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean().optional(),
  })).optional(),
});

export type MCPPrompt = z.infer<typeof MCPPromptSchema>;

export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}