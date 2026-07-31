import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/storage/database/supabase-client';
import type { BusinessState } from '@/lib/types/business';

/**
 * 将前端 BusinessState 全量同步到 Supabase
 * 策略：先清空所有表，再批量插入
 */
export interface SyncResult {
  ok: boolean;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSnakeCase(obj: any): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

export async function syncFullState(state: BusinessState): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase 未配置' };
  }
  const client = getSupabaseClient();
  try {

    // Helper: batch sync (upsert by primary key 'id')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function syncTable(table: string, rows: any[]): Promise<void> {
      if (rows.length === 0) return;
      // Convert to snake_case and handle JSON fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedRows = rows.map((row: any) => {
        const snakeRow = toSnakeCase(row);
        // Handle JSON fields - stringify arrays and objects
        for (const [key, val] of Object.entries(snakeRow)) {
          if (Array.isArray(val)) {
            snakeRow[key] = JSON.stringify(val);
          }
        }
        // Remove undefined/null fields to avoid overwriting DB defaults
        for (const [key, val] of Object.entries(snakeRow)) {
          if (val === undefined || val === null) {
            delete snakeRow[key];
          }
        }
        return snakeRow;
      });
      // Upsert in batches of 100 (on conflict 'id', merge)
      for (let i = 0; i < processedRows.length; i += 100) {
        const batch = processedRows.slice(i, i + 100);
        const { error: upError } = await client
          .from(table)
          .upsert(batch, { onConflict: 'id' });
        if (upError) {
          console.error(`upsert ${table} 失败:`, upError.message, 'batch:', i);
          throw new Error(`插入 ${table} 失败: ${upError.message}`);
        }
      }
    }

    // 1. Warehouses
    await syncTable('warehouses', (state.warehouses || []).map((w) => ({
      id: w.id, name: w.name, address: w.address || '',
    })));

    // 2. Customers
    await syncTable('customers', (state.customers || []).map((c) => ({
      id: c.id, name: c.name, country: c.country,
      city: c.city || '', whatsapp: c.whatsapp || '',
      categories: c.categories || [],
      frequent_categories: c.frequentCategories || [],
      last_purchase_date: c.lastPurchaseDate || '',
      total_sales: c.totalSales || 0,
      order_receivable: c.orderReceivable || 0,
      shipped_debt: c.shippedDebt || 0,
      presave_balance: c.presaveBalance || 0,
      pre_deposit: c.preDeposit || 0,
      last_payment_date: c.lastPaymentDate || '',
      pending_ship_qty: c.pendingShipQty || 0,
      status: c.status || '一般',
      common_sizes: c.commonSizes || [],
      avg_order_amount: c.avgOrderAmount || 0,
      purchase_frequency: c.purchaseFrequency || '',
      notes: c.notes || '',
    })));

    // 3. Products
    await syncTable('products', (state.products || []).map((p) => ({
      id: p.id, style_no: p.styleNo, name: p.name,
      category: p.category || '',
      colors: p.colors || [], sizes: p.sizes || [],
      images: p.images || [],
      current_stock: p.currentStock || 0,
      suggested_price: p.suggestedPrice || 0,
      last_cost: p.lastCost || 0,
      new_date: p.newDate || '',
      status: p.status || '正常销售',
      description: p.description || '', notes: p.notes || '',
    })));

    // 4. Factories
    await syncTable('factories', (state.factories || []).map((f) => ({
      id: f.id, name: f.name,
      contact: f.contact || '', phone: f.phone || '',
      main_category: f.mainCategory || '',
      total_production_amount: f.totalProductionAmount || 0,
      paid_amount: f.paidAmount || 0,
      unpaid_amount: f.unpaidAmount || 0,
      last_coop_date: f.lastCoopDate || '',
      address: f.address || '', notes: f.notes || '',
    })));

    // 5. Production Batches
    await syncTable('production_batches', (state.productionBatches || []).map((b) => ({
      id: b.id, batch_no: b.batchNo || b.id,
      factory_id: b.factoryId, product_id: b.productId || '',
      style_no: b.styleNo, product_name: b.productName || '',
      color: b.color, size: b.size,
      quantity: b.quantity, unit_cost: b.unitCost, total_cost: b.totalCost,
      inbound_warehouse_id: b.inboundWarehouseId || b.warehouseId || '',
      warehouse_id: b.warehouseId || '',
      inbound_date: b.inboundDate || '',
      start_date: b.startDate || '',
      inbound_quantity: b.inboundQuantity || 0,
      paid_amount: b.paidAmount || 0, unpaid_amount: b.unpaidAmount || 0,
      status: b.status || '待生产', notes: b.notes || '',
    })));

    // 6. Orders (header)
    await syncTable('orders', (state.orders || []).map((o) => ({
      id: o.id, order_no: o.orderNo,
      customer_id: o.customerId, customer_name: o.customerName || '',
      country: o.country || '', order_date: o.orderDate || '',
      total_amount: o.totalAmount || 0,
      paid_amount: o.paidAmount || 0, unpaid_amount: o.unpaidAmount || 0,
      total_quantity: o.totalQuantity || 0,
      shipped_quantity: o.shippedQuantity || 0,
      pending_ship_quantity: o.pendingShipQuantity || 0,
      status: o.status || '草稿',
      presave_deduction: o.presaveDeduction || 0,
      final_receivable: o.finalReceivable || 0,
      notes: o.notes || '',
    })));

    // 7. Order Items (flatten from orders)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderItemRows: any[] = [];
    for (const order of (state.orders || [])) {
      for (const item of (order.items || [])) {
        orderItemRows.push({
          id: item.id,
          order_id: order.id,
          product_id: item.productId || '',
          style_no: item.styleNo, product_name: item.productName || '',
          color: item.color, size: item.size,
          warehouse_id: item.warehouseId || '',
          warehouse_name: item.warehouseName || '',
          available_stock: item.availableStock || 0,
          quantity: item.quantity,
          shipped_quantity: item.shippedQuantity || 0,
          unit_price: item.unitPrice, subtotal: item.subtotal,
        });
      }
    }
    await syncTable('order_items', orderItemRows);

    // 8. Shipments
    await syncTable('shipments', (state.shipments || []).map((s) => ({
      id: s.id, shipment_no: s.shipmentNo,
      order_id: s.orderId, order_no: s.orderNo || '',
      customer_id: s.customerId || '', customer_name: s.customerName || '',
      ship_date: s.shipDate || '',
      warehouse_id: s.warehouseId || '', warehouse_name: s.warehouseName || '',
      logistics_method: s.logisticsMethod || '',
      tracking_no: s.trackingNo || '',
      total_items: s.totalItems || 0,
      total_amount: s.totalAmount || 0,
      notes: s.notes || '',
    })));

    // 9. Shipment Items (flatten)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shipmentItemRows: any[] = [];
    for (const shipment of (state.shipments || [])) {
      for (const item of (shipment.items || [])) {
        shipmentItemRows.push({
          id: `si_${shipment.id}_${item.orderItemId || Math.random().toString(36).slice(2)}`,
          shipment_id: shipment.id,
          order_item_id: item.orderItemId || '',
          style_no: item.styleNo, color: item.color, size: item.size,
          order_qty: item.orderQty, shipped_qty: item.shippedQty,
          this_ship_qty: item.thisShipQty,
          unit_price: item.unitPrice, this_ship_amount: item.thisShipAmount,
        });
      }
    }
    await syncTable('shipment_items', shipmentItemRows);

    // 10. Payments
    await syncTable('payments', (state.payments || []).map((p) => ({
      id: p.id, payment_no: p.paymentNo,
      customer_id: p.customerId, customer_name: p.customerName || '',
      payment_date: p.paymentDate || '',
      amount: p.amount, method: p.method || '其他',
      related_order_id: p.relatedOrderId || '',
      related_order_no: p.relatedOrderNo || '',
      voucher: p.voucher || '', notes: p.notes || '',
      allocated_amount: p.allocatedAmount || 0,
      deposit_amount: p.depositAmount || 0,
    })));

    // 11. Factory Payments
    await syncTable('factory_payments', (state.factoryPayments || []).map((fp) => ({
      id: fp.id, payment_no: fp.paymentNo,
      factory_id: fp.factoryId, factory_name: fp.factoryName || '',
      payment_date: fp.paymentDate || '',
      amount: fp.amount, method: fp.method || '其他',
      related_batch_id: fp.relatedBatchId || '',
      related_batch_no: fp.relatedBatchNo || '',
      voucher: fp.voucher || '', notes: fp.notes || '',
    })));

    // 12. Inventory Records
    await syncTable('inventory_records', (state.inventoryRecords || []).map((ir) => ({
      id: ir.id, style_no: ir.styleNo,
      product_name: ir.productName || '',
      color: ir.color, size: ir.size,
      warehouse_id: ir.warehouseId, warehouse_name: ir.warehouseName || '',
      actual_stock: ir.actualStock, reserved_stock: ir.reservedStock,
      sellable_stock: ir.sellableStock, status: ir.status || '正常',
    })));

    // 13. Inventory Flows
    await syncTable('inventory_flows', (state.inventoryFlows || []).map((f) => ({
      id: f.id, date: f.date || '', type: f.type,
      product: f.product || '', style_no: f.styleNo || '',
      color: f.color || '', size: f.size || '',
      warehouse: f.warehouse || '',
      quantity: f.quantity, before_stock: f.beforeStock, after_stock: f.afterStock,
      related_doc: f.relatedDoc || '', notes: f.notes || '',
    })));

    // 14. Customer Ledgers (flatten from map)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ledgerRows: any[] = [];
    const ledgers = state.customerLedgers || {};
    for (const [customerId, entries] of Object.entries(ledgers)) {
      for (const entry of entries) {
        ledgerRows.push({
          id: entry.id || `cl_${customerId}_${ledgerRows.length}`,
          customer_id: customerId,
          date: entry.date || '',
          business_type: entry.businessType || '',
          doc_no: entry.docNo || '',
          description: entry.description || '',
          increase_receivable: entry.increaseReceivable || 0,
          received_amount: entry.receivedAmount || 0,
          balance: entry.balance || 0,
          deposit_change: entry.depositChange || 0,
          deposit_balance: entry.depositBalance || 0,
          notes: entry.notes || '',
        });
      }
    }
    await syncTable('customer_ledgers', ledgerRows);

    return { ok: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '同步失败';
    console.error('sync error:', message);
    return { ok: false, error: message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = (body.state || body) as BusinessState;
    const result = await syncFullState(state);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
