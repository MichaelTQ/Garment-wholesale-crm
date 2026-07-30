/**
 * 数据库 CRUD 服务层
 * 所有前端页面通过此层访问 Supabase 数据库
 */
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// ============ 类型映射 ============
// 数据库使用 snake_case，前端使用 camelCase
// 此层负责转换

export interface DbCustomer {
  id: string;
  name: string;
  country: string;
  city: string;
  whatsapp: string;
  categories: string;
  frequent_categories: string;
  last_purchase_date: string;
  total_sales: string;
  order_receivable: string;
  shipped_debt: string;
  presave_balance: string;
  pre_deposit: string;
  last_payment_date: string;
  pending_ship_qty: number;
  status: string;
  common_sizes: string;
  avg_order_amount: string;
  purchase_frequency: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  style_no: string;
  name: string;
  category: string;
  colors: string;
  sizes: string;
  images: string;
  current_stock: number;
  suggested_price: string;
  last_cost: string;
  new_date: string;
  status: string;
  description: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbWarehouse {
  id: string;
  name: string;
  address: string;
}

export interface DbFactory {
  id: string;
  name: string;
  contact: string;
  phone: string;
  main_category: string;
  total_production_amount: string;
  paid_amount: string;
  unpaid_amount: string;
  last_coop_date: string;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbProductionBatch {
  id: string;
  batch_no: string;
  factory_id: string;
  product_id: string;
  style_no: string;
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  unit_cost: string;
  total_cost: string;
  inbound_warehouse_id: string;
  warehouse_id: string;
  inbound_date: string;
  start_date: string;
  inbound_quantity: number;
  paid_amount: string;
  unpaid_amount: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbOrder {
  id: string;
  order_no: string;
  customer_id: string;
  customer_name: string;
  country: string;
  order_date: string;
  total_amount: string;
  paid_amount: string;
  unpaid_amount: string;
  total_quantity: number;
  shipped_quantity: number;
  pending_ship_quantity: number;
  status: string;
  presave_deduction: string;
  final_receivable: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  style_no: string;
  product_name: string;
  color: string;
  size: string;
  warehouse_id: string;
  warehouse_name: string;
  available_stock: number;
  quantity: number;
  shipped_quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface DbShipment {
  id: string;
  shipment_no: string;
  order_id: string;
  order_no: string;
  customer_id: string;
  customer_name: string;
  ship_date: string;
  warehouse_id: string;
  warehouse_name: string;
  logistics_method: string;
  tracking_no: string;
  total_items: number;
  total_amount: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbShipmentItem {
  id: string;
  shipment_id: string;
  order_item_id: string;
  style_no: string;
  color: string;
  size: string;
  order_qty: number;
  shipped_qty: number;
  this_ship_qty: number;
  unit_price: string;
  this_ship_amount: string;
}

export interface DbPayment {
  id: string;
  payment_no: string;
  customer_id: string;
  customer_name: string;
  payment_date: string;
  amount: string;
  method: string;
  related_order_id: string;
  related_order_no: string;
  voucher: string;
  allocated_amount: string;
  deposit_amount: string;
  notes: string;
  created_at: string;
}

export interface DbFactoryPayment {
  id: string;
  payment_no: string;
  factory_id: string;
  factory_name: string;
  payment_date: string;
  amount: string;
  method: string;
  related_batch_id: string;
  related_batch_no: string;
  voucher: string;
  notes: string;
  created_at: string;
}

export interface DbInventoryRecord {
  id: string;
  style_no: string;
  product_name: string;
  color: string;
  size: string;
  warehouse_id: string;
  warehouse_name: string;
  actual_stock: number;
  reserved_stock: number;
  sellable_stock: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbInventoryFlow {
  id: string;
  date: string;
  type: string;
  product: string;
  style_no: string;
  color: string;
  size: string;
  warehouse: string;
  quantity: number;
  before_stock: number;
  after_stock: number;
  related_doc: string;
  notes: string;
  created_at: string;
}

export interface DbCustomerLedger {
  id: string;
  customer_id: string;
  date: string;
  business_type: string;
  doc_no: string;
  description: string;
  increase_receivable: string;
  received_amount: string;
  balance: string;
  deposit_change: string;
  deposit_balance: string;
  notes: string;
  created_at: string;
}

// ============ 通用查询 ============

export async function fetchAll<T>(table: string, select: string = '*', orderBy: string = 'id'): Promise<T[]> {
  const all: T[] = [];
  let page = 0;
  const pageSize = 500;
  while (true) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .order(orderBy)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw new Error(`查询 ${table} 失败: ${error.message}`);
    if (!data?.length) break;
    all.push(...(data as T[]));
    if (data.length < pageSize) break;
    page++;
  }
  return all;
}

// ============ 仓库 ============
export async function getWarehouses(): Promise<DbWarehouse[]> {
  return fetchAll<DbWarehouse>('warehouses');
}

// ============ 客户 ============
export async function getCustomers(): Promise<DbCustomer[]> {
  return fetchAll<DbCustomer>('customers');
}

export async function getCustomerById(id: string): Promise<DbCustomer | null> {
  const { data, error } = await client.from('customers').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`查询客户失败: ${error.message}`);
  return data as DbCustomer | null;
}

export async function updateCustomer(id: string, updates: Partial<DbCustomer>): Promise<DbCustomer> {
  const { data, error } = await client.from('customers').update(updates).eq('id', id).select().maybeSingle();
  if (error) throw new Error(`更新客户失败: ${error.message}`);
  if (!data) throw new Error('客户更新失败：未找到记录');
  return data as DbCustomer;
}

// ============ 商品 ============
export async function getProducts(): Promise<DbProduct[]> {
  return fetchAll<DbProduct>('products');
}

export async function getProductById(id: string): Promise<DbProduct | null> {
  const { data, error } = await client.from('products').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`查询商品失败: ${error.message}`);
  return data as DbProduct | null;
}

// ============ 工厂 ============
export async function getFactories(): Promise<DbFactory[]> {
  return fetchAll<DbFactory>('factories');
}

export async function getFactoryById(id: string): Promise<DbFactory | null> {
  const { data, error } = await client.from('factories').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`查询工厂失败: ${error.message}`);
  return data as DbFactory | null;
}

// ============ 生产批次 ============
export async function getProductionBatches(): Promise<DbProductionBatch[]> {
  return fetchAll<DbProductionBatch>('production_batches');
}

export async function getProductionBatchesByFactory(factoryId: string): Promise<DbProductionBatch[]> {
  const { data, error } = await client.from('production_batches').select('*').eq('factory_id', factoryId).order('id');
  if (error) throw new Error(`查询生产批次失败: ${error.message}`);
  return (data as DbProductionBatch[]) || [];
}

export async function updateProductionBatch(id: string, updates: Partial<DbProductionBatch>): Promise<DbProductionBatch> {
  const { data, error } = await client.from('production_batches').update(updates).eq('id', id).select().maybeSingle();
  if (error) throw new Error(`更新生产批次失败: ${error.message}`);
  if (!data) throw new Error('生产批次更新失败：未找到记录');
  return data as DbProductionBatch;
}

// ============ 订单 ============
export async function getOrders(): Promise<DbOrder[]> {
  return fetchAll<DbOrder>('orders');
}

export async function getOrderById(id: string): Promise<DbOrder | null> {
  const { data, error } = await client.from('orders').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`查询订单失败: ${error.message}`);
  return data as DbOrder | null;
}

// ============ 订单明细 ============
export async function getOrderItems(orderId: string): Promise<DbOrderItem[]> {
  const { data, error } = await client.from('order_items').select('*').eq('order_id', orderId).order('id');
  if (error) throw new Error(`查询订单明细失败: ${error.message}`);
  return (data as DbOrderItem[]) || [];
}

export async function getAllOrderItems(): Promise<DbOrderItem[]> {
  return fetchAll<DbOrderItem>('order_items');
}

// ============ 发货单 ============
export async function getShipments(): Promise<DbShipment[]> {
  return fetchAll<DbShipment>('shipments');
}

export async function getShipmentItems(shipmentId: string): Promise<DbShipmentItem[]> {
  const { data, error } = await client.from('shipment_items').select('*').eq('shipment_id', shipmentId).order('id');
  if (error) throw new Error(`查询发货明细失败: ${error.message}`);
  return (data as DbShipmentItem[]) || [];
}

export async function getAllShipmentItems(): Promise<DbShipmentItem[]> {
  return fetchAll<DbShipmentItem>('shipment_items');
}

// ============ 收款 ============
export async function getPayments(): Promise<DbPayment[]> {
  return fetchAll<DbPayment>('payments');
}

// ============ 工厂付款 ============
export async function getFactoryPayments(): Promise<DbFactoryPayment[]> {
  return fetchAll<DbFactoryPayment>('factory_payments');
}

export async function getFactoryPaymentsByFactory(factoryId: string): Promise<DbFactoryPayment[]> {
  const { data, error } = await client.from('factory_payments').select('*').eq('factory_id', factoryId).order('id');
  if (error) throw new Error(`查询工厂付款失败: ${error.message}`);
  return (data as DbFactoryPayment[]) || [];
}

// ============ 库存 ============
export async function getInventoryRecords(): Promise<DbInventoryRecord[]> {
  return fetchAll<DbInventoryRecord>('inventory_records');
}

export async function getInventoryRecordByKey(styleNo: string, color: string, size: string, warehouseId: string): Promise<DbInventoryRecord | null> {
  const { data, error } = await client.from('inventory_records')
    .select('*')
    .eq('style_no', styleNo)
    .eq('color', color)
    .eq('size', size)
    .eq('warehouse_id', warehouseId)
    .maybeSingle();
  if (error) throw new Error(`查询库存记录失败: ${error.message}`);
  return data as DbInventoryRecord | null;
}

export async function upsertInventoryRecord(record: Partial<DbInventoryRecord>): Promise<DbInventoryRecord> {
  // Try to find existing record by key
  const existing = record.style_no && record.color && record.size && record.warehouse_id
    ? await getInventoryRecordByKey(record.style_no, record.color, record.size, record.warehouse_id)
    : null;

  if (existing) {
    const { data, error } = await client.from('inventory_records').update(record).eq('id', existing.id).select().maybeSingle();
    if (error) throw new Error(`更新库存记录失败: ${error.message}`);
    if (!data) throw new Error('库存记录更新失败');
    return data as DbInventoryRecord;
  } else {
    const { data, error } = await client.from('inventory_records').insert(record).select().maybeSingle();
    if (error) throw new Error(`插入库存记录失败: ${error.message}`);
    if (!data) throw new Error('库存记录插入失败');
    return data as DbInventoryRecord;
  }
}

// ============ 库存流水 ============
export async function getInventoryFlows(): Promise<DbInventoryFlow[]> {
  return fetchAll<DbInventoryFlow>('inventory_flows', '*', 'date');
}

export async function insertInventoryFlow(flow: Partial<DbInventoryFlow>): Promise<DbInventoryFlow> {
  const { data, error } = await client.from('inventory_flows').insert(flow).select().maybeSingle();
  if (error) throw new Error(`插入库存流水失败: ${error.message}`);
  if (!data) throw new Error('库存流水插入失败');
  return data as DbInventoryFlow;
}

// ============ 客户往来 ============
export async function getCustomerLedgers(customerId?: string): Promise<DbCustomerLedger[]> {
  if (customerId) {
    const { data, error } = await client.from('customer_ledgers').select('*').eq('customer_id', customerId).order('date');
    if (error) throw new Error(`查询客户往来失败: ${error.message}`);
    return (data as DbCustomerLedger[]) || [];
  }
  return fetchAll<DbCustomerLedger>('customer_ledgers', '*', 'date');
}

// ============ 入库操作（原子化） ============

export interface ProductionInboundParams {
  batchId: string;
  warehouseId: string;
  quantity: number;
  date: string;
  notes: string;
}

export async function executeProductionInbound(params: ProductionInboundParams): Promise<void> {
  // 1. 获取生产批次
  const batch = await (async () => {
    const { data, error } = await client.from('production_batches').select('*').eq('id', params.batchId).maybeSingle();
    if (error) throw new Error(`查询生产批次失败: ${error.message}`);
    if (!data) throw new Error('未找到生产批次');
    return data as DbProductionBatch;
  })();

  const remaining = batch.quantity - batch.inbound_quantity;
  if (params.quantity <= 0) throw new Error('入库数量必须大于0');
  if (params.quantity > remaining) throw new Error(`本次入库数量不能超过剩余可入库数量 ${remaining} 件`);

  // 2. 更新库存记录
  const styleNo = batch.style_no;
  const color = batch.color;
  const size = batch.size;
  const whId = params.warehouseId;

  const existingInv = await getInventoryRecordByKey(styleNo, color, size, whId);
  const beforeStock = existingInv ? existingInv.actual_stock : 0;
  const afterStock = beforeStock + params.quantity;
  const reservedStock = existingInv ? existingInv.reserved_stock : 0;
  const sellableStock = afterStock - reservedStock;

  // Get warehouse name
  const { data: whData } = await client.from('warehouses').select('name').eq('id', whId).maybeSingle();
  const whName = (whData as { name: string } | null)?.name || '';

  // Get product name
  const { data: prodData } = await client.from('products').select('name').eq('id', batch.product_id).maybeSingle();
  const prodName = (prodData as { name: string } | null)?.name || batch.product_name || '';

  await upsertInventoryRecord({
    id: existingInv?.id || `ir_${Date.now()}`,
    style_no: styleNo,
    product_name: prodName,
    color,
    size,
    warehouse_id: whId,
    warehouse_name: whName,
    actual_stock: afterStock,
    reserved_stock: reservedStock,
    sellable_stock: sellableStock,
    status: sellableStock > 20 ? '充足' : sellableStock > 10 ? '正常' : sellableStock > 0 ? '偏低' : '缺货',
    updated_at: new Date().toISOString(),
  });

  // 3. 更新生产批次
  const newInboundQty = batch.inbound_quantity + params.quantity;
  const newStatus = newInboundQty >= batch.quantity ? '已入库' : '部分入库';
  await updateProductionBatch(params.batchId, {
    inbound_quantity: newInboundQty,
    status: newStatus,
    inbound_warehouse_id: whId,
    inbound_date: params.date,
    updated_at: new Date().toISOString(),
  });

  // 4. 插入库存流水
  const flowId = `if_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await insertInventoryFlow({
    id: flowId,
    date: params.date,
    type: '生产入库',
    product: prodName,
    style_no: styleNo,
    color,
    size,
    warehouse: whName,
    quantity: params.quantity,
    before_stock: beforeStock,
    after_stock: afterStock,
    related_doc: batch.batch_no,
    notes: params.notes || `生产批次 ${batch.batch_no} 入库 ${params.quantity} 件`,
  });
}

export interface ManualInboundParams {
  styleNo: string;
  color: string;
  size: string;
  warehouseId: string;
  quantity: number;
  date: string;
  reason: string;
  notes: string;
}

export async function executeManualInbound(params: ManualInboundParams): Promise<void> {
  if (params.quantity <= 0) throw new Error('入库数量必须大于0');
  if (!params.reason) throw new Error('手工入库必须填写原因');

  const whId = params.warehouseId;
  const existingInv = await getInventoryRecordByKey(params.styleNo, params.color, params.size, whId);
  const beforeStock = existingInv ? existingInv.actual_stock : 0;
  const afterStock = beforeStock + params.quantity;
  const reservedStock = existingInv ? existingInv.reserved_stock : 0;
  const sellableStock = afterStock - reservedStock;

  // Get warehouse name
  const { data: whData } = await client.from('warehouses').select('name').eq('id', whId).maybeSingle();
  const whName = (whData as { name: string } | null)?.name || '';

  // Get product info
  const { data: prodData } = await client.from('products').select('name, id').eq('style_no', params.styleNo).maybeSingle();
  const prodName = (prodData as { name: string } | null)?.name || '';

  await upsertInventoryRecord({
    id: existingInv?.id || `ir_${Date.now()}`,
    style_no: params.styleNo,
    product_name: prodName,
    color: params.color,
    size: params.size,
    warehouse_id: whId,
    warehouse_name: whName,
    actual_stock: afterStock,
    reserved_stock: reservedStock,
    sellable_stock: sellableStock,
    status: sellableStock > 20 ? '充足' : sellableStock > 10 ? '正常' : sellableStock > 0 ? '偏低' : '缺货',
    updated_at: new Date().toISOString(),
  });

  const flowId = `if_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await insertInventoryFlow({
    id: flowId,
    date: params.date,
    type: '手工调整',
    product: prodName,
    style_no: params.styleNo,
    color: params.color,
    size: params.size,
    warehouse: whName,
    quantity: params.quantity,
    before_stock: beforeStock,
    after_stock: afterStock,
    related_doc: '',
    notes: `${params.reason}${params.notes ? '；' + params.notes : ''}`,
  });
}
