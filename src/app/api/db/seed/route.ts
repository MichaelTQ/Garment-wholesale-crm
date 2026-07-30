import { NextResponse } from 'next/server';
import { generateFullBusinessState } from '@/lib/db/generate-mock-data';
import { syncFullState } from '@/app/api/db/sync/route';

export async function POST() {
  try {
    // Check if data already exists
    const { getSupabaseClient } = await import('@/storage/database/supabase-client');
    const client = getSupabaseClient();
    const { count } = await client
      .from('warehouses')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) {
      return NextResponse.json({ ok: true, message: '数据库已有数据，跳过初始化' });
    }

    // Generate mock data
    const state = generateFullBusinessState();

    // Sync to database
    const result = await syncFullState(state);

    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: '模拟数据已成功初始化到数据库',
      stats: {
        warehouses: state.warehouses.length,
        customers: state.customers.length,
        products: state.products.length,
        factories: state.factories.length,
        productionBatches: state.productionBatches.length,
        orders: state.orders.length,
        shipments: state.shipments.length,
        payments: state.payments.length,
        inventoryRecords: state.inventoryRecords.length,
      }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('seed error:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
