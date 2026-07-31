import { describe, expect, it } from 'vitest';
import { inspectSupabaseConfiguration } from '@/storage/database/supabase-client';

describe('Supabase 配置识别', () => {
  it('识别 Coze 环境变量', () => {
    expect(
      inspectSupabaseConfiguration({
        COZE_SUPABASE_URL: 'https://example.supabase.co',
        COZE_SUPABASE_ANON_KEY: 'anon',
        COZE_SUPABASE_SERVICE_ROLE_KEY: 'service',
      }),
    ).toEqual({
      configured: true,
      hasServiceRoleKey: true,
      missing: [],
    });
  });

  it('兼容标准与 NEXT_PUBLIC 环境变量', () => {
    expect(
      inspectSupabaseConfiguration({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'anon',
      }),
    ).toEqual({
      configured: true,
      hasServiceRoleKey: false,
      missing: [],
    });
  });

  it('返回缺失项但不暴露环境变量内容', () => {
    expect(inspectSupabaseConfiguration({})).toEqual({
      configured: false,
      hasServiceRoleKey: false,
      missing: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    });
  });
});
