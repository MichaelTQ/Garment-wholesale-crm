import { NextResponse } from 'next/server';
import { warehouses } from '@/lib/mock-data';
import {
  getSupabaseClient,
  getSupabaseConfiguration,
} from '@/storage/database/supabase-client';

export async function POST() {
  try {
    const configuration = getSupabaseConfiguration();
    if (!configuration.configured) {
      return NextResponse.json(
        {
          ok: false,
          code: 'DATABASE_NOT_CONFIGURED',
          error: `云数据库未配置，缺少 ${configuration.missing.join('、')}`,
        },
        { status: 503 },
      );
    }
    const client = getSupabaseClient();
    const { error } = await client.from('warehouses').upsert(
      warehouses.map((warehouse) => ({
        id: warehouse.id,
        name: warehouse.name,
        address: warehouse.address,
      })),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (error) {
      return NextResponse.json(
        {
          ok: false,
          code: 'WAREHOUSE_INITIALIZATION_FAILED',
          error: `初始化仓库失败：${error.message}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: '仓库基础配置已初始化，未生成任何商业数据',
      stats: { warehouses: warehouses.length },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('seed error:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
