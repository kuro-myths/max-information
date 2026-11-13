create extension if not exists pgcrypto;

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique,
  occurred_at timestamptz not null default now(),
  instance_id text not null,
  source text not null default 'unknown',
  client text,
  request_id text not null,
  requested_model text not null,
  resolved_model text,
  upstream_model text,
  provider text,
  provider_owner text,
  provider_connection_id text,
  status integer not null,
  success boolean not null default false,
  input_tokens bigint,
  output_tokens bigint,
  cached_input_tokens bigint,
  reasoning_tokens bigint,
  total_tokens bigint,
  latency_ms numeric(14,3),
  estimated_cost_usd numeric(18,10),
  cost_status text not null default 'unknown' check (cost_status in ('reported','estimated','unknown')),
  usage_status text not null default 'unknown' check (usage_status in ('verified','estimated','unknown')),
  error_code text,
  error_message text,
  stream boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_occurred_at_idx on public.usage_events (occurred_at desc);
create index if not exists usage_events_instance_idx on public.usage_events (instance_id, occurred_at desc);
create index if not exists usage_events_model_idx on public.usage_events (requested_model, occurred_at desc);
create index if not exists usage_events_provider_idx on public.usage_events (provider, occurred_at desc);
create index if not exists usage_events_request_idx on public.usage_events (request_id);

alter table public.usage_events enable row level security;
-- Access is server-only through the Supabase service-role key. Do not add public policies.
