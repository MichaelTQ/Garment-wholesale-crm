// Mock data for Helen服装批发管理系统

export interface Customer {
  id: string;
  name: string;
  country: string;
  city: string;
  whatsapp: string;
  categories: string[];
  frequentCategories: string[];
  lastPurchaseDate: string;
  totalSales: number;
  orderReceivable: number;
  shippedDebt: number;
  presaveBalance: number;
  preDeposit: number;
  lastPaymentDate: string;
  pendingShipQty: number;
  status: '活跃' | '一般' | '长期未购买' | '有欠款' | '有预存款';
  commonSizes: string[];
  avgOrderAmount: number;
  purchaseFrequency: string;
  notes: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  styleNo: string;
  name: string;
  category: string;
  colors: { name: string; hex: string }[];
  sizes: string[];
  images: string[];
  currentStock: number;
  suggestedPrice: number;
  lastCost: number;
  newDate: string;
  status: '设计中' | '生产中' | '已上新' | '正常销售' | '库存不足' | '已停售';
  description: string;
  notes?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
}

export interface Factory {
  id: string;
  name: string;
  contact: string;
  phone: string;
  mainCategory: string;
  totalProductionAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  lastCoopDate: string;
  address: string;
  notes: string;
}

export interface ProductionBatch {
  id: string;
  batchNo: string;
  factoryId: string;
  factoryName?: string;
  productId: string;
  styleNo: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  inboundWarehouseId: string;
  warehouseId: string;
  warehouseName?: string;
  inboundDate: string;
  startDate?: string;
  notes?: string;
  /** 累计已入库数量 */
  inboundQuantity: number;
  paidAmount: number;
  unpaidAmount: number;
  status: '待生产' | '生产中' | '待入库' | '部分入库' | '已入库' | '已结清' | '已取消';
}

export interface OrderItem {
  id: string;
  productId: string;
  styleNo: string;
  productName: string;
  color: string;
  size: string;
  warehouseId: string;
  warehouseName: string;
  availableStock: number;
  quantity: number;
  shippedQuantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  country: string;
  orderDate: string;
  items: OrderItem[];
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  totalQuantity: number;
  shippedQuantity: number;
  pendingShipQuantity: number;
  status: '草稿' | '待确认' | '已确认' | '部分发货' | '已全部发货' | '已完成' | '已取消';
  presaveDeduction: number;
  finalReceivable: number;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shipment {
  id: string;
  shipmentNo: string;
  orderId: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  shipDate: string;
  warehouseId: string;
  warehouseName: string;
  logisticsMethod: string;
  trackingNo: string;
  items: { orderItemId: string; styleNo: string; color: string; size: string; orderQty: number; shippedQty: number; thisShipQty: number; unitPrice: number; thisShipAmount: number }[];
  totalItems: number;
  totalAmount: number;
  notes: string;
}

export interface Payment {
  id: string;
  paymentNo: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  method: '银行转账' | '微信' | '支付宝' | '现金' | '其他';
  relatedOrderId: string;
  relatedOrderNo: string;
  voucher: string;
  notes: string;
  allocatedAmount: number;
  depositAmount: number;
  createdAt?: string;
}

export interface FactoryPayment {
  id: string;
  paymentNo: string;
  factoryId: string;
  factoryName: string;
  paymentDate: string;
  amount: number;
  method: '银行转账' | '微信' | '支付宝' | '现金' | '其他';
  relatedBatchId: string;
  relatedBatchNo: string;
  voucher: string;
  notes: string;
}

export interface InventoryRecord {
  id: string;
  styleNo: string;
  productName: string;
  color: string;
  size: string;
  warehouseId: string;
  warehouseName: string;
  actualStock: number;
  reservedStock: number;
  sellableStock: number;
  status: '充足' | '正常' | '偏低' | '低库存' | '缺货';
}

export interface InventoryFlow {
  id: string;
  date: string;
  type: '生产入库' | '销售出库' | '仓库调拨' | '手工调整' | '库存预留' | '取消预留';
  product: string;
  styleNo: string;
  color: string;
  size: string;
  warehouse: string;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  relatedDoc: string;
  notes: string;
}

export interface CustomerLedger {
  id: string;
  date: string;
  businessType: '订单' | '发货' | '收款' | '预存款抵扣' | '余额调整' | '期初余额';
  docNo: string;
  description: string;
  increaseReceivable: number;
  receivedAmount: number;
  balance: number;
  depositChange: number;
  depositBalance: number;
  notes: string;
}

// ============ 仓库 ============
export const warehouses: Warehouse[] = [
  { id: 'wh1', name: '广西莉莉', address: '广西' },
  { id: 'wh2', name: '广西龙生', address: '广西' },
  { id: 'wh3', name: '广西林生', address: '广西' },
  { id: 'wh4', name: '新塘张生', address: '广东新塘' },
  { id: 'wh5', name: '新塘阿峰', address: '广东新塘' },
];

// ============ 客户 ============
export const customers: Customer[] = [];

// ============ 商品 ============
export const products: Product[] = [];

// ============ 工厂 ============
export const factories: Factory[] = [];

// ============ 生产批次 ============
export const productionBatches: ProductionBatch[] = [];

// ============ 订单 ============
export const orders: Order[] = [];

// ============ 发货记录 ============
export const shipments: Shipment[] = [];

// ============ 收款记录 ============
export const payments: Payment[] = [];

// ============ 工厂付款 ============
export const factoryPayments: FactoryPayment[] = [];

// ============ 库存记录 ============
export const inventoryRecords: InventoryRecord[] = [];

// ============ 库存流水 ============
export const inventoryFlows: InventoryFlow[] = [];

// ============ 客户往来账 ============
export const customerLedgers: Record<string, CustomerLedger[]> = {};

// ============ 月度销售数据（用于图表）============
export const monthlySalesData: Array<{ month: string; sales: number; cost: number; profit: number }> = [];

// ============ 工具函数 ============
export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    '活跃': 'bg-green-100 text-green-800',
    '一般': 'bg-gray-100 text-gray-800',
    '长期未购买': 'bg-yellow-100 text-yellow-800',
    '有欠款': 'bg-orange-100 text-orange-800',
    '有预存款': 'bg-blue-100 text-blue-800',
    '草稿': 'bg-gray-100 text-gray-800',
    '待确认': 'bg-yellow-100 text-yellow-800',
    '已确认': 'bg-blue-100 text-blue-800',
    '部分发货': 'bg-indigo-100 text-indigo-800',
    '已全部发货': 'bg-purple-100 text-purple-800',
    '已完成': 'bg-green-100 text-green-800',
    '已取消': 'bg-red-100 text-red-800',
    '充足': 'bg-green-100 text-green-800',
    '正常': 'bg-blue-100 text-blue-800',
    '偏低': 'bg-yellow-100 text-yellow-800',
    '低库存': 'bg-orange-100 text-orange-800',
    '缺货': 'bg-red-100 text-red-800',
    '设计中': 'bg-gray-100 text-gray-800',
    '生产中': 'bg-yellow-100 text-yellow-800',
    '已上新': 'bg-blue-100 text-blue-800',
    '正常销售': 'bg-green-100 text-green-800',
    '库存不足': 'bg-orange-100 text-orange-800',
    '已停售': 'bg-red-100 text-red-800',
    '待生产': 'bg-gray-100 text-gray-800',
    '待入库': 'bg-yellow-100 text-yellow-800',
    '已入库': 'bg-blue-100 text-blue-800',
    '部分入库': 'bg-indigo-100 text-indigo-800',
    '已结清': 'bg-green-100 text-green-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}
