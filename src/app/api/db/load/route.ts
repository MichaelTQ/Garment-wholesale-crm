import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/storage/database/supabase-client';

/**
 * POST /api/db/load
 * 从 Supabase 加载全量业务数据并返回 BusinessState JSON
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Supabase 未配置' }, { status: 503 });
  }
  const client = getSupabaseClient();
  try {
    // Fetch all tables
    const [
      warehousesResult,
      customersResult,
      productsResult,
      factoriesResult,
      batchesResult,
      ordersResult,
      orderItemsResult,
      shipmentsResult,
      shipmentItemsResult,
      paymentsResult,
      factoryPaymentsResult,
      inventoryResult,
      flowsResult,
      ledgerResult,
    ] = await Promise.all([
      client.from('warehouses').select('*').order('id'),
      client.from('customers').select('*').order('id'),
      client.from('products').select('*').order('id'),
      client.from('factories').select('*').order('id'),
      client.from('production_batches').select('*').order('id'),
      client.from('orders').select('*').order('id'),
      client.from('order_items').select('*').order('id'),
      client.from('shipments').select('*').order('id'),
      client.from('shipment_items').select('*').order('id'),
      client.from('payments').select('*').order('id'),
      client.from('factory_payments').select('*').order('id'),
      client.from('inventory_records').select('*').order('id'),
      client.from('inventory_flows').select('*').order('date'),
      client.from('customer_ledgers').select('*').order('date'),
    ]);

    // Check for errors
    const errors = [
      warehousesResult, customersResult, productsResult, factoriesResult,
      batchesResult, ordersResult, orderItemsResult, shipmentsResult,
      shipmentItemsResult, paymentsResult, factoryPaymentsResult,
      inventoryResult, flowsResult, ledgerResult,
    ].filter(r => r.error);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.map(e => e.error!.message).join('; ') },
        { status: 500 },
      );
    }

    // Transform DB rows (snake_case) → frontend format (camelCase)
    const warehouses = (warehousesResult.data || []).map((r: Record<string, unknown>) => ({
      id: r.id, name: r.name, address: r.address,
    }));

    const customers = (customersResult.data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      city: r.city || '',
      whatsapp: r.whatsapp || '',
      categories: typeof r.categories === 'string' ? JSON.parse(r.categories as string || '[]') : (r.categories || []),
      frequentCategories: typeof r.frequent_categories === 'string' ? JSON.parse(r.frequent_categories as string || '[]') : (r.frequent_categories || []),
      lastPurchaseDate: r.last_purchase_date || '',
      totalSales: Number(r.total_sales) || 0,
      orderReceivable: Number(r.order_receivable) || 0,
      shippedDebt: Number(r.shipped_debt) || 0,
      presaveBalance: Number(r.presave_balance) || 0,
      preDeposit: Number(r.pre_deposit) || 0,
      lastPaymentDate: r.last_payment_date || '',
      pendingShipQty: Number(r.pending_ship_qty) || 0,
      status: r.status || '一般',
      commonSizes: typeof r.common_sizes === 'string' ? JSON.parse(r.common_sizes as string || '[]') : (r.common_sizes || []),
      avgOrderAmount: Number(r.avg_order_amount) || 0,
      purchaseFrequency: r.purchase_frequency || '',
      notes: r.notes || '',
      createdAt: r.created_at || '',
    }));

    const products = (productsResult.data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      styleNo: r.style_no,
      name: r.name,
      category: r.category || '',
      colors: typeof r.colors === 'string' ? JSON.parse(r.colors as string || '[]') : (r.colors || []),
      sizes: typeof r.sizes === 'string' ? JSON.parse(r.sizes as string || '[]') : (r.sizes || []),
      images: typeof r.images === 'string' ? JSON.parse(r.images as string || '[]') : (r.images || []),
      currentStock: Number(r.current_stock) || 0,
      suggestedPrice: Number(r.suggested_price) || 0,
      lastCost: Number(r.last_cost) || 0,
      newDate: r.new_date || '',
      status: r.status || '正常销售',
      description: r.description || '',
      notes: r.notes || '',
    }));

    const factories = (factoriesResult.data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      contact: r.contact || '',
      phone: r.phone || '',
      mainCategory: r.main_category || '',
      totalProductionAmount: Number(r.total_production_amount) || 0,
      paidAmount: Number(r.paid_amount) || 0,
      unpaidAmount: Number(r.unpaid_amount) || 0,
      lastCoopDate: r.last_coop_date || '',
      address: r.address || '',
      notes: r.notes || '',
    }));

    const productionBatches = (batchesResult.data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      batchNo: r.batch_no || r.id,
      factoryId: r.factory_id,
      factoryName: r.factory_name || '',
      productId: r.product_id || '',
      styleNo: r.style_no,
      productName: r.product_name || '',
      color: r.color,
      size: r.size,
      quantity: Number(r.quantity) || 0,
      unitCost: Number(r.unit_cost) || 0,
      totalCost: Number(r.total_cost) || 0,
      inboundWarehouseId: r.inbound_warehouse_id || r.warehouse_id || '',
      warehouseId: r.warehouse_id || '',
      warehouseName: r.warehouse_name || '',
      inboundDate: r.inbound_date || '',
      startDate: r.start_date || '',
      notes: r.notes || '',
      inboundQuantity: Number(r.inbound_quantity) || 0,
      paidAmount: Number(r.paid_amount) || 0,
      unpaidAmount: Number(r.unpaid_amount) || 0,
      status: r.status || '待生产',
    }));

    // Orders with nested items
    const orderItemsByOrderId: Record<string, unknown[]> = {};
    for (const item of (orderItemsResult.data || [])) {
      const r = item as Record<string, unknown>;
      const oid = r.order_id as string;
      if (!orderItemsByOrderId[oid]) orderItemsByOrderId[oid] = [];
      orderItemsByOrderId[oid].push({
        id: r.id,
        productId: r.product_id || '',
        styleNo: r.style_no,
        productName: r.product_name || '',
        color: r.color,
        size: r.size,
        warehouseId: r.warehouse_id || '',
        warehouseName: r.warehouse_name || '',
        availableStock: Number(r.available_stock) || 0,
        quantity: Number(r.quantity) || 0,
        shippedQuantity: Number(r.shipped_quantity) || 0,
        unitPrice: Number(r.unit_price) || 0,
        subtotal: Number(r.subtotal) || 0,
      });
    }

    const orders = (ordersResult.data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      orderNo: r.order_no,
      customerId: r.customer_id,
      customerName: r.customer_name || '',
      country: r.country || '',
      orderDate: r.order_date || '',
      items: orderItemsByOrderId[r.id as string] || [],
      totalAmount: Number(r.total_amount) || 0,
      paidAmount: Number(r.paid_amount) || 0,
      unpaidAmount: Number(r.unpaid_amount) || 0,
      totalQuantity: Number(r.total_quantity) || 0,
      shippedQuantity: Number(r.shipped_quantity) || 0,
      pendingShipQuantity: Number(r.pending_ship_quantity) || 0,
      status: r.status || '草稿',
      presaveDeduction: Number(r.presave_deduction) || 0,
      finalReceivable: Number(r.final_receivable) || 0,
      notes: r.notes || '',
      createdAt: r.created_at || '',
      updatedAt: r.updated_at || '',
    }));

    // Shipments with nested items
    const shipmentItemsByShipmentId: Record<string, unknown[]> = {};
    for (const item of (shipmentItemsResult.data || [])) {
      const r = item as Record<string, unknown>;
      const sid = r.shipment_id as string;
      if (!shipmentItemsByShipmentId[sid]) shipmentItemsByShipmentId[sid] = [];
      shipmentItemsByShipmentId[sid].push({
        orderItemId: r.order_item_id || '',
        styleNo: r.style_no,
        color: r.color,
        size: r.size,
        orderQty: Number(r.order_qty) || 0,
        shippedQty: Number(r.shipped_qty) || 0,
        thisShipQty: Number(r.this_ship_qty) || 0,
        unitPrice: Number(r.unit_price) || 0,
        thisShipAmount: Number(r.this_ship_amount) || 0,
      });
    }

    const shipments = (shipmentsResult.data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      shipmentNo: r.shipment_no,
      orderId: r.order_id,
      orderNo: r.order_no || '',
      customerId: r.customer_id || '',
      customerName: r.customer_name || '',
      shipDate: r.ship_date || '',
      warehouseId: r.warehouse_id || '',
      warehouseName: r.warehouse_name || '',
      logisticsMethod: r.logistics_method || '',
      trackingNo: r.tracking_no || '',
      items: shipmentItemsByShipmentId[r.id as string] || [],
      totalItems: Number(r.total_items) || 0,
      totalAmount: Number(r.total_amount) || 0,
      notes: r.notes || '',
    }));

    const payments = (paymentsResult.data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      paymentNo: r.payment_no,
      customerId: r.customer_id,
      customerName: r.customer_name || '',
      paymentDate: r.payment_date || '',
      amount: Number(r.amount) || 0,
      method: r.method || '其他',
      relatedOrderId: r.related_order_id || '',
      relatedOrderNo: r.related_order_no || '',
      voucher: r.voucher || '',
      notes: r.notes || '',
      allocatedAmount: Number(r.allocated_amount) || 0,
      depositAmount: Number(r.deposit_amount) || 0,
      createdAt: r.created_at || '',
    }));

    const factoryPayments = (factoryPaymentsResult.data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      paymentNo: r.payment_no,
      factoryId: r.factory_id,
      factoryName: r.factory_name || '',
      paymentDate: r.payment_date || '',
      amount: Number(r.amount) || 0,
      method: r.method || '其他',
      relatedBatchId: r.related_batch_id || '',
      relatedBatchNo: r.related_batch_no || '',
      voucher: r.voucher || '',
      notes: r.notes || '',
    }));

    const inventoryRecords = (inventoryResult.data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      styleNo: r.style_no,
      productName: r.product_name || '',
      color: r.color,
      size: r.size,
      warehouseId: r.warehouse_id,
      warehouseName: r.warehouse_name || '',
      actualStock: Number(r.actual_stock) || 0,
      reservedStock: Number(r.reserved_stock) || 0,
      sellableStock: Number(r.sellable_stock) || 0,
      status: r.status || '正常',
    }));

    const inventoryFlows = (flowsResult.data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      date: r.date || '',
      type: r.type,
      product: r.product || '',
      styleNo: r.style_no || '',
      color: r.color || '',
      size: r.size || '',
      warehouse: r.warehouse || '',
      quantity: Number(r.quantity) || 0,
      beforeStock: Number(r.before_stock) || 0,
      afterStock: Number(r.after_stock) || 0,
      relatedDoc: r.related_doc || '',
      notes: r.notes || '',
    }));

    // Customer ledgers grouped by customer_id
    const customerLedgers: Record<string, unknown[]> = {};
    for (const entry of (ledgerResult.data || [])) {
      const r = entry as Record<string, unknown>;
      const cid = r.customer_id as string;
      if (!customerLedgers[cid]) customerLedgers[cid] = [];
      customerLedgers[cid].push({
        id: r.id,
        date: r.date || '',
        businessType: r.business_type || '',
        docNo: r.doc_no || '',
        description: r.description || '',
        increaseReceivable: Number(r.increase_receivable) || 0,
        receivedAmount: Number(r.received_amount) || 0,
        balance: Number(r.balance) || 0,
        depositChange: Number(r.deposit_change) || 0,
        depositBalance: Number(r.deposit_balance) || 0,
        notes: r.notes || '',
      });
    }

    const state = {
      storageVersion: 1,
      warehouses,
      customers,
      products,
      factories,
      productionBatches,
      factoryPayments,
      inventoryRecords,
      inventoryFlows,
      inventoryReservations: [],
      orders,
      shipments,
      payments,
      paymentAllocations: [],
      depositApplications: [],
      customerLedgers,
    };

    return NextResponse.json({ ok: true, data: state });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '加载数据失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
