import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _clientCache: Map<string, SupabaseClient> = new Map();

function getSupabaseCredentials(): { url: string; anonKey: string } {
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // 在构建阶段（静态分析）环境变量可能不存在，此时返回空值而非抛错
    // 这样 Next.js 构建不会因为缺少环境变量而失败
    // 实际调用时如果仍然缺少，会在下面 createClient 时自然失败
    if (!url) return { url: 'https://placeholder.supabase.co', anonKey: anonKey ?? 'placeholder' };
  }

  return { url: url as string, anonKey: anonKey as string };
}

function getSupabaseServiceRoleKey(): string | undefined {
  return process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
}

/**
 * 创建 Supabase 客户端
 * - 无 token 时使用 service_role_key（绕过 RLS，适合服务端操作）
 * - 有 token 时使用 anon_key + 用户 token（适合客户端操作）
 * 
 * 使用缓存避免重复创建客户端实例
 */
export function getSupabaseClient(token?: string): SupabaseClient {
  const cacheKey = token ? `client-${token}` : 'server';
  
  if (_clientCache.has(cacheKey)) {
    return _clientCache.get(cacheKey)!;
  }

  const { url, anonKey } = getSupabaseCredentials();

  let key: string;
  if (token) {
    key = anonKey;
  } else {
    const serviceRoleKey = getSupabaseServiceRoleKey();
    key = serviceRoleKey ?? anonKey;
  }

  const globalOptions: Record<string, unknown> = {};
  if (token) {
    globalOptions.headers = { Authorization: `Bearer ${token}` };
  }

  const client = createClient(url, key, {
    global: globalOptions,
    db: {
      timeout: 60000,
    },
  });

  _clientCache.set(cacheKey, client);
  return client;
}

/**
 * 获取 Supabase 服务端客户端（使用 service_role_key）
 * 用于 API 路由中的数据库操作，绕过 RLS
 */
export function getSupabaseServerClient(): SupabaseClient {
  return getSupabaseClient();
}

/**
 * 检查 Supabase 是否已配置（环境变量存在）
 * 用于 seed/sync API 判断是否可用
 */
export function isSupabaseConfigured(): boolean {
  return !!process.env.COZE_SUPABASE_URL && !!process.env.COZE_SUPABASE_ANON_KEY;
}
