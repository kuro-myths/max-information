import { z } from "zod";

const nullableText = z.string().trim().max(500).nullable().optional();
const nonNegative = z.number().finite().min(0).max(1_000_000_000).nullable().optional();

export const telemetrySchema = z.object({
  event_id: z.string().uuid().optional(),
  occurred_at: z.string().datetime({ offset: true }).optional(),
  instance_id: z.string().min(1).max(120),
  source: z.string().min(1).max(80).default("unknown"),
  client: nullableText,
  request_id: z.string().min(1).max(180),
  requested_model: z.string().min(1).max(300),
  resolved_model: nullableText,
  upstream_model: nullableText,
  provider: nullableText,
  provider_owner: nullableText,
  provider_connection_id: nullableText,
  status: z.number().int().min(100).max(599),
  success: z.boolean(),
  input_tokens: nonNegative,
  output_tokens: nonNegative,
  cached_input_tokens: nonNegative,
  reasoning_tokens: nonNegative,
  total_tokens: nonNegative,
  latency_ms: nonNegative,
  estimated_cost_usd: nonNegative,
  cost_status: z.enum(["reported", "estimated", "unknown"]).default("unknown"),
  usage_status: z.enum(["verified", "estimated", "unknown"]).default("unknown"),
  error_code: nullableText,
  error_message: z.string().max(2000).nullable().optional(),
  stream: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const batchSchema = z.object({
  events: z.array(telemetrySchema).min(1).max(100)
});