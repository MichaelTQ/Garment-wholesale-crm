import { execFileSync } from 'node:child_process';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const clientCache = new Map<string, SupabaseClient>();
let workloadIdentityAttempted = false;

const SUPABASE_ENV_KEYS = [
  'COZE_SUPABASE_URL',
  'COZE_SUPABASE_ANON_KEY',
  'COZE_SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

type Environment = Record<string, string | undefined>;

export interface SupabaseConfiguration {
  configured: boolean;
  hasServiceRoleKey: boolean;
  missing: string[];
}

function firstDefined(
  environment: Environment,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = environment[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function inspectSupabaseConfiguration(
  environment: Environment,
): SupabaseConfiguration {
  const url = firstDefined(environment, [
    'COZE_SUPABASE_URL',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
  ]);
  const anonKey = firstDefined(environment, [
    'COZE_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]);
  const serviceRoleKey = firstDefined(environment, [
    'COZE_SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]);
  const missing: string[] = [];
  if (!url) missing.push('SUPABASE_URL');
  if (!anonKey) missing.push('SUPABASE_ANON_KEY');
  return {
    configured: missing.length === 0,
    hasServiceRoleKey: Boolean(serviceRoleKey),
    missing,
  };
}

/**
 * Coze 部署环境可能通过 workload identity 提供项目变量，而不是直接注入
 * process.env。仅在普通环境变量缺失时尝试一次，并且只读取 Supabase 白名单。
 */
function loadFromCozeWorkloadIdentity(): void {
  if (
    workloadIdentityAttempted ||
    inspectSupabaseConfiguration(process.env).configured
  ) {
    return;
  }
  workloadIdentityAttempted = true;

  const pythonScript = `
import json
try:
    from coze_workload_identity import Client
    wanted = ${JSON.stringify(SUPABASE_ENV_KEYS)}
    client = Client()
    values = {
        item.key: item.value
        for item in client.get_project_env_vars()
        if item.key in wanted
    }
    client.close()
    print(json.dumps(values))
except Exception:
    print("{}")
`;

  try {
    const output = execFileSync('python3', ['-c', pythonScript], {
      encoding: 'utf8',
      timeout: 10_000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const parsed: unknown = JSON.parse(output || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
    for (const key of SUPABASE_ENV_KEYS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (!process.env[key] && typeof value === 'string' && value.trim()) {
        process.env[key] = value;
      }
    }
  } catch {
    // 非 Coze 环境或 workload identity 不可用时，继续使用普通环境变量。
  }
}

export function getSupabaseConfiguration(): SupabaseConfiguration {
  loadFromCozeWorkloadIdentity();
  return inspectSupabaseConfiguration(process.env);
}

function getSupabaseCredentials(): {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
} {
  const configuration = getSupabaseConfiguration();
  if (!configuration.configured) {
    throw new Error(
      `云数据库未配置，缺少 ${configuration.missing.join('、')}`,
    );
  }
  const url = firstDefined(process.env, [
    'COZE_SUPABASE_URL',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
  ]);
  const anonKey = firstDefined(process.env, [
    'COZE_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]);
  const serviceRoleKey = firstDefined(process.env, [
    'COZE_SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]);
  if (!url || !anonKey) throw new Error('云数据库配置读取失败');
  return { url, anonKey, serviceRoleKey };
}

export function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey, serviceRoleKey } = getSupabaseCredentials();
  const cacheKey = token ? `token:${token}` : `server:${url}`;
  const cached = clientCache.get(cacheKey);
  if (cached) return cached;

  const key = token ? anonKey : serviceRoleKey ?? anonKey;
  const client = createClient(url, key, {
    global: token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined,
    db: { timeout: 60_000 },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  clientCache.set(cacheKey, client);
  return client;
}

export function getSupabaseServerClient(): SupabaseClient {
  return getSupabaseClient();
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfiguration().configured;
}
