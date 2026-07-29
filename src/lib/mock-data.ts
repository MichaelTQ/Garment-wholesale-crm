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
  createdAt: string;
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
  factoryId: string;
  factoryName: string;
  styleNo: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  warehouseId: string;
  warehouseName: string;
  inboundDate: string;
  paidAmount: number;
  unpaidAmount: number;
  status: '待生产' | '生产中' | '待入库' | '已入库' | '已结清';
}

export interface OrderItem {
  styleNo: string;
  productName: string;
  color: string;
  size: string;
  warehouseId: string;
  warehouseName: string;
  availableStock: number;
  quantity: number;
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
  items: { styleNo: string; color: string; size: string; orderQty: number; shippedQty: number; thisShipQty: number; unitPrice: number; thisShipAmount: number }[];
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
  businessType: '订单' | '发货' | '收款' | '余额调整' | '期初余额';
  docNo: string;
  description: string;
  increaseReceivable: number;
  receivedAmount: number;
  balance: number;
  notes: string;
}

// ============ 仓库 ============
export const warehouses: Warehouse[] = [
  { id: 'wh1', name: '广州白云仓', address: '广州市白云区石井镇庆丰路28号' },
  { id: 'wh2', name: '广州番禺仓', address: '广州市番禺区大龙街市莲路55号' },
  { id: 'wh3', name: '东莞虎门仓', address: '东莞市虎门镇北栅工业区12号' },
];

// ============ 客户 ============
function addCustomerExtras(c: Omit<Customer, 'frequentCategories' | 'preDeposit' | 'lastPaymentDate' | 'pendingShipQty'> & { categories: string[]; presaveBalance: number }): Customer {
  return {
    ...c,
    frequentCategories: c.categories,
    preDeposit: c.presaveBalance,
    lastPaymentDate: c.presaveBalance > 0 ? '2025-07-22' : c.shippedDebt > 0 ? '2025-07-20' : '2025-06-15',
    pendingShipQty: Math.floor(c.orderReceivable / 85),
  } as Customer;
}

export const customers: Customer[] = [
  { id: 'c001', name: 'Lagos Fashion Hub Ltd', country: 'Nigeria', city: 'Lagos', whatsapp: '+234-8012345678', categories: ['牛仔裤', 'T恤'], frequentCategories: ['牛仔裤', 'T恤'], lastPurchaseDate: '2025-07-20', totalSales: 385000, orderReceivable: 128000, shippedDebt: 92000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-21', pendingShipQty: 150, status: '有欠款', commonSizes: ['M', 'L', 'XL'], avgOrderAmount: 42000, purchaseFrequency: '每月1次', notes: '大客户，付款偶尔延迟', createdAt: '2023-03-15' },
  { id: 'c002', name: 'Accra Textile Trading Co', country: 'Ghana', city: 'Accra', whatsapp: '+233-201122334', categories: ['连衣裙', '半裙'], lastPurchaseDate: '2025-07-18', totalSales: 268000, orderReceivable: 85000, shippedDebt: 65000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-19', pendingShipQty: 80, frequentCategories: ['连衣裙', '半裙'], status: '有欠款', commonSizes: ['S', 'M', 'L'], avgOrderAmount: 35000, purchaseFrequency: '每月1-2次', notes: '', createdAt: '2023-05-20' },
  { id: 'c003', name: 'Nairobi Garments Wholesale', country: 'Kenya', city: 'Nairobi', whatsapp: '+254-712345678', categories: ['外套', '卫衣'], lastPurchaseDate: '2025-07-22', totalSales: 312000, orderReceivable: 0, shippedDebt: 0, presaveBalance: 15000, preDeposit: 15000, lastPaymentDate: '2025-07-22', pendingShipQty: 0, frequentCategories: ['外套', '卫衣'], status: '有预存款', commonSizes: ['L', 'XL', '2XL'], avgOrderAmount: 52000, purchaseFrequency: '每2周1次', notes: '信用良好客户', createdAt: '2023-01-10' },
  { id: 'c004', name: 'Dar Express Fashions', country: 'Tanzania', city: 'Dar es Salaam', whatsapp: '+255-713243546', categories: ['牛仔裤', '外套'], lastPurchaseDate: '2025-06-10', totalSales: 145000, orderReceivable: 52000, shippedDebt: 52000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-06-15', pendingShipQty: 80, frequentCategories: ['牛仔裤', '外套'], status: '有欠款', commonSizes: ['M', 'L', 'XL'], avgOrderAmount: 28000, purchaseFrequency: '每月1次', notes: '欠款较多需关注', createdAt: '2023-08-12' },
  { id: 'c005', name: 'Kampala Clothing Centre', country: 'Uganda', city: 'Kampala', whatsapp: '+256-771234567', categories: ['T恤', '卫衣'], lastPurchaseDate: '2025-07-15', totalSales: 198000, orderReceivable: 45000, shippedDebt: 30000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-16', pendingShipQty: 130, frequentCategories: ['T恤', '卫衣'], status: '有欠款', commonSizes: ['M', 'L', 'XL'], avgOrderAmount: 33000, purchaseFrequency: '每月1次', notes: '', createdAt: '2023-06-01' },
  { id: 'c006', name: 'Douala Style Market', country: 'Cameroon', city: 'Douala', whatsapp: '+237-671234567', categories: ['连衣裙', '牛仔裤'], lastPurchaseDate: '2025-07-21', totalSales: 225000, orderReceivable: 0, shippedDebt: 0, presaveBalance: 20440, preDeposit: 20440, lastPaymentDate: '2025-07-22', pendingShipQty: 130, frequentCategories: ['连衣裙', '牛仔裤'], status: '有预存款', commonSizes: ['S', 'M'], avgOrderAmount: 38000, purchaseFrequency: '每2周1次', notes: '经常多付款', createdAt: '2023-04-18' },
  { id: 'c007', name: 'Dakar Wholesale Group', country: 'Senegal', city: 'Dakar', whatsapp: '+221-771234567', categories: ['外套', '半裙'], lastPurchaseDate: '2025-07-19', totalSales: 176000, orderReceivable: 68000, shippedDebt: 48000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-20', pendingShipQty: 40, frequentCategories: ['外套', '半裙'], status: '有欠款', commonSizes: ['M', 'L'], avgOrderAmount: 29000, purchaseFrequency: '每月1次', notes: '', createdAt: '2023-09-05' },
  { id: 'c008', name: 'Cape Town Fashion Distributors', country: 'South Africa', city: 'Cape Town', whatsapp: '+27-821234567', categories: ['连衣裙', '外套'], lastPurchaseDate: '2025-07-23', totalSales: 420000, orderReceivable: 0, shippedDebt: 0, presaveBalance: 35000, preDeposit: 35000, lastPaymentDate: '2025-07-24', pendingShipQty: 0, frequentCategories: ['连衣裙', '外套'], status: '有预存款', commonSizes: ['S', 'M', 'L', 'XL'], avgOrderAmount: 60000, purchaseFrequency: '每周1次', notes: 'VIP大客户', createdAt: '2022-11-20' },
  { id: 'c009', name: 'Abidjan Textile Import', country: "Côte d'Ivoire", city: 'Abidjan', whatsapp: '+225-071234567', categories: ['T恤', '牛仔裤'], lastPurchaseDate: '2025-05-15', totalSales: 98000, orderReceivable: 32000, shippedDebt: 32000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-05-16', pendingShipQty: 0, frequentCategories: ['T恤', '牛仔裤'], status: '长期未购买', commonSizes: ['L', 'XL'], avgOrderAmount: 22000, purchaseFrequency: '每2月1次', notes: '2个月未下单', createdAt: '2024-01-15' },
  { id: 'c010', name: 'Luanda Apparel Trading', country: 'Angola', city: 'Luanda', whatsapp: '+244-921234567', categories: ['卫衣', '外套'], lastPurchaseDate: '2025-07-10', totalSales: 156000, orderReceivable: 41000, shippedDebt: 28000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-11', pendingShipQty: 50, frequentCategories: ['卫衣', '外套'], status: '一般', commonSizes: ['L', 'XL', '2XL'], avgOrderAmount: 26000, purchaseFrequency: '每月1次', notes: '', createdAt: '2023-10-22' },
  { id: 'c011', name: 'Mombasa Garments Ltd', country: 'Kenya', city: 'Mombasa', whatsapp: '+254-723456789', categories: ['连衣裙', 'T恤'], lastPurchaseDate: '2025-07-17', totalSales: 189000, orderReceivable: 56000, shippedDebt: 38000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-18', pendingShipQty: 110, frequentCategories: ['连衣裙', 'T恤'], status: '有欠款', commonSizes: ['S', 'M', 'L'], avgOrderAmount: 31000, purchaseFrequency: '每月1次', notes: '', createdAt: '2023-07-08' },
  { id: 'c012', name: 'Kumasi Fashion House', country: 'Ghana', city: 'Kumasi', whatsapp: '+233-242233445', categories: ['牛仔裤', '半裙'], lastPurchaseDate: '2025-07-05', totalSales: 134000, orderReceivable: 0, shippedDebt: 0, presaveBalance: 8200, preDeposit: 8200, lastPaymentDate: '2025-07-06', pendingShipQty: 0, frequentCategories: ['牛仔裤', '半裙'], status: '有预存款', commonSizes: ['M', 'L'], avgOrderAmount: 24000, purchaseFrequency: '每月1次', notes: '小客户但信用好', createdAt: '2024-02-28' },
  { id: 'c013', name: 'Ibadan Clothing Supplies', country: 'Nigeria', city: 'Ibadan', whatsapp: '+234-8034567890', categories: ['T恤', '卫衣', '牛仔裤'], lastPurchaseDate: '2025-07-22', totalSales: 278000, orderReceivable: 72000, shippedDebt: 55000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-22', pendingShipQty: 240, frequentCategories: ['T恤', '卫衣', '牛仔裤'], status: '活跃', commonSizes: ['M', 'L', 'XL'], avgOrderAmount: 40000, purchaseFrequency: '每2周1次', notes: '增长快', createdAt: '2023-02-14' },
  { id: 'c014', name: 'Yaoundé Style Boutique', country: 'Cameroon', city: 'Yaoundé', whatsapp: '+237-693456789', categories: ['连衣裙'], lastPurchaseDate: '2025-04-20', totalSales: 67000, orderReceivable: 18000, shippedDebt: 18000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-04-21', pendingShipQty: 0, frequentCategories: ['连衣裙'], status: '长期未购买', commonSizes: ['S', 'M'], avgOrderAmount: 18000, purchaseFrequency: '每3月1次', notes: '3个月未下单', createdAt: '2024-05-10' },
  { id: 'c015', name: 'Thies Wholesale Textiles', country: 'Senegal', city: 'Thiès', whatsapp: '+221-782345678', categories: ['半裙', '连衣裙'], lastPurchaseDate: '2025-07-12', totalSales: 112000, orderReceivable: 28000, shippedDebt: 22000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-13', pendingShipQty: 40, frequentCategories: ['半裙', '连衣裙'], status: '一般', commonSizes: ['S', 'M', 'L'], avgOrderAmount: 25000, purchaseFrequency: '每月1次', notes: '', createdAt: '2024-03-05' },
  { id: 'c016', name: 'Johannesburg Fashion Hub', country: 'South Africa', city: 'Johannesburg', whatsapp: '+27-834567890', categories: ['外套', '牛仔裤', 'T恤'], lastPurchaseDate: '2025-07-24', totalSales: 356000, orderReceivable: 0, shippedDebt: 0, presaveBalance: 28000, preDeposit: 28000, lastPaymentDate: '2025-07-24', pendingShipQty: 80, frequentCategories: ['外套', '牛仔裤', 'T恤'], status: '活跃', commonSizes: ['M', 'L', 'XL', '2XL'], avgOrderAmount: 55000, purchaseFrequency: '每周1次', notes: '南非大客户', createdAt: '2023-01-05' },
  { id: 'c017', name: 'Kisumu Apparel Traders', country: 'Kenya', city: 'Kisumu', whatsapp: '+254-734567890', categories: ['T恤', '牛仔裤'], lastPurchaseDate: '2025-06-28', totalSales: 89000, orderReceivable: 35000, shippedDebt: 25000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-06-29', pendingShipQty: 60, frequentCategories: ['T恤', '牛仔裤'], status: '有欠款', commonSizes: ['L', 'XL'], avgOrderAmount: 20000, purchaseFrequency: '每2月1次', notes: '', createdAt: '2024-04-12' },
  { id: 'c018', name: 'Lome Garments Export', country: "Côte d'Ivoire", city: 'San Pedro', whatsapp: '+225-054567890', categories: ['卫衣', '外套'], lastPurchaseDate: '2025-07-08', totalSales: 143000, orderReceivable: 0, shippedDebt: 0, presaveBalance: 5000, preDeposit: 5000, lastPaymentDate: '2025-07-09', pendingShipQty: 0, frequentCategories: ['卫衣', '外套'], status: '有预存款', commonSizes: ['M', 'L', 'XL'], avgOrderAmount: 27000, purchaseFrequency: '每月1次', notes: '', createdAt: '2023-11-15' },
  { id: 'c019', name: 'Bamako Fashion Distribution', country: 'Senegal', city: 'Saint-Louis', whatsapp: '+221-763456789', categories: ['牛仔裤', '连衣裙'], lastPurchaseDate: '2025-03-15', totalSales: 56000, orderReceivable: 15000, shippedDebt: 15000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-03-15', pendingShipQty: 0, frequentCategories: ['牛仔裤', '连衣裙'], status: '长期未购买', commonSizes: ['M', 'L'], avgOrderAmount: 16000, purchaseFrequency: '偶尔', notes: '4个月未下单', createdAt: '2024-06-20' },
  { id: 'c020', name: 'Port Harcourt Textile Co', country: 'Nigeria', city: 'Port Harcourt', whatsapp: '+234-8056789012', categories: ['T恤', '卫衣', '半裙'], lastPurchaseDate: '2025-07-20', totalSales: 203000, orderReceivable: 61000, shippedDebt: 45000, presaveBalance: 0, preDeposit: 0, lastPaymentDate: '2025-07-21', pendingShipQty: 100, frequentCategories: ['T恤', '卫衣', '半裙'], status: '活跃', commonSizes: ['M', 'L', 'XL'], avgOrderAmount: 34000, purchaseFrequency: '每2周1次', notes: '', createdAt: '2023-04-08' },
];

// ============ 商品 ============
export const products: Product[] = [
  { id: 'p001', styleNo: 'HJ-001', name: '经典直筒牛仔裤', category: '牛仔裤', colors: [{ name: '深蓝', hex: '#1a3a6b' }, { name: '浅蓝', hex: '#7bafd4' }, { name: '黑色', hex: '#1a1a1a' }], sizes: ['S', 'M', 'L', 'XL', '2XL'], images: [], currentStock: 1200, suggestedPrice: 85, lastCost: 48, newDate: '2025-01-15', status: '正常销售', description: '经典直筒版型，弹力棉质面料' },
  { id: 'p002', styleNo: 'HJ-002', name: '破洞修身牛仔裤', category: '牛仔裤', colors: [{ name: '深蓝', hex: '#1a3a6b' }, { name: '浅蓝', hex: '#7bafd4' }], sizes: ['S', 'M', 'L', 'XL'], images: [], currentStock: 800, suggestedPrice: 95, lastCost: 52, newDate: '2025-02-10', status: '正常销售', description: '时尚破洞设计，修身版型' },
  { id: 'p003', styleNo: 'HT-001', name: '纯色圆领T恤', category: 'T恤', colors: [{ name: '白色', hex: '#ffffff' }, { name: '黑色', hex: '#1a1a1a' }, { name: '灰色', hex: '#9ca3af' }, { name: '藏蓝', hex: '#1e3a5f' }], sizes: ['S', 'M', 'L', 'XL', '2XL'], images: [], currentStock: 2500, suggestedPrice: 35, lastCost: 18, newDate: '2025-01-08', status: '正常销售', description: '240g纯棉，舒适透气' },
  { id: 'p004', styleNo: 'HT-002', name: '印花V领T恤', category: 'T恤', colors: [{ name: '白色', hex: '#ffffff' }, { name: '黑色', hex: '#1a1a1a' }, { name: '酒红', hex: '#8b1a1a' }], sizes: ['M', 'L', 'XL', '2XL'], images: [], currentStock: 1800, suggestedPrice: 42, lastCost: 22, newDate: '2025-03-05', status: '正常销售', description: '时尚印花图案，V领设计' },
  { id: 'p005', styleNo: 'HL-001', name: '碎花连衣裙', category: '连衣裙', colors: [{ name: '蓝白碎花', hex: '#6b9bc3' }, { name: '红白碎花', hex: '#c36b6b' }], sizes: ['S', 'M', 'L', 'XL'], images: [], currentStock: 600, suggestedPrice: 128, lastCost: 68, newDate: '2025-04-20', status: '正常销售', description: '优雅碎花设计，A字版型' },
  { id: 'p006', styleNo: 'HL-002', name: '修身针织连衣裙', category: '连衣裙', colors: [{ name: '黑色', hex: '#1a1a1a' }, { name: '酒红', hex: '#8b1a1a' }, { name: '墨绿', hex: '#1a4a2e' }], sizes: ['S', 'M', 'L'], images: [], currentStock: 30, suggestedPrice: 148, lastCost: 78, newDate: '2025-05-10', status: '库存不足', description: '弹力针织面料，修身显瘦' },
  { id: 'p007', styleNo: 'HW-001', name: '加绒连帽卫衣', category: '卫衣', colors: [{ name: '灰色', hex: '#9ca3af' }, { name: '黑色', hex: '#1a1a1a' }, { name: '军绿', hex: '#4a5a3a' }], sizes: ['M', 'L', 'XL', '2XL'], images: [], currentStock: 1500, suggestedPrice: 110, lastCost: 58, newDate: '2025-02-28', status: '正常销售', description: '加绒保暖，连帽设计' },
  { id: 'p008', styleNo: 'HW-002', name: '圆领休闲卫衣', category: '卫衣', colors: [{ name: '白色', hex: '#ffffff' }, { name: '藏蓝', hex: '#1e3a5f' }], sizes: ['S', 'M', 'L', 'XL'], images: [], currentStock: 20, suggestedPrice: 88, lastCost: 45, newDate: '2025-03-15', status: '库存不足', description: '纯棉面料，休闲舒适' },
  { id: 'p009', styleNo: 'HK-001', name: '中长款风衣外套', category: '外套', colors: [{ name: '卡其', hex: '#c4a882' }, { name: '黑色', hex: '#1a1a1a' }], sizes: ['M', 'L', 'XL'], images: [], currentStock: 400, suggestedPrice: 198, lastCost: 105, newDate: '2025-01-25', status: '正常销售', description: '中长款设计，防风面料' },
  { id: 'p010', styleNo: 'HK-002', name: '短款皮夹克', category: '外套', colors: [{ name: '黑色', hex: '#1a1a1a' }, { name: '棕色', hex: '#6b4226' }], sizes: ['S', 'M', 'L', 'XL'], images: [], currentStock: 15, suggestedPrice: 268, lastCost: 145, newDate: '2025-04-08', status: '库存不足', description: 'PU皮材质，机车风设计' },
  { id: 'p011', styleNo: 'HJ-003', name: '宽松阔腿牛仔裤', category: '牛仔裤', colors: [{ name: '深蓝', hex: '#1a3a6b' }, { name: '黑色', hex: '#1a1a1a' }], sizes: ['S', 'M', 'L', 'XL', '2XL'], images: [], currentStock: 950, suggestedPrice: 92, lastCost: 50, newDate: '2025-05-20', status: '正常销售', description: '宽松阔腿版型，复古风格' },
  { id: 'p012', styleNo: 'HQ-001', name: '高腰A字半裙', category: '半裙', colors: [{ name: '黑色', hex: '#1a1a1a' }, { name: '卡其', hex: '#c4a882' }, { name: '酒红', hex: '#8b1a1a' }], sizes: ['S', 'M', 'L', 'XL'], images: [], currentStock: 500, suggestedPrice: 78, lastCost: 40, newDate: '2025-03-28', status: '正常销售', description: '高腰设计，A字版型显瘦' },
  { id: 'p013', styleNo: 'HQ-002', name: '百褶半裙', category: '半裙', colors: [{ name: '灰色', hex: '#9ca3af' }, { name: '藏蓝', hex: '#1e3a5f' }], sizes: ['S', 'M', 'L'], images: [], currentStock: 10, suggestedPrice: 88, lastCost: 45, newDate: '2025-04-15', status: '库存不足', description: '精致百褶工艺，垂感好' },
  { id: 'p014', styleNo: 'HT-003', name: 'POLO领T恤', category: 'T恤', colors: [{ name: '白色', hex: '#ffffff' }, { name: '藏蓝', hex: '#1e3a5f' }, { name: '红色', hex: '#c41e3a' }], sizes: ['M', 'L', 'XL', '2XL'], images: [], currentStock: 2000, suggestedPrice: 48, lastCost: 25, newDate: '2025-02-05', status: '正常销售', description: '经典POLO领设计，商务休闲' },
  { id: 'p015', styleNo: 'HW-003', name: '拉链卫衣', category: '卫衣', colors: [{ name: '灰色', hex: '#9ca3af' }, { name: '黑色', hex: '#1a1a1a' }, { name: '藏蓝', hex: '#1e3a5f' }], sizes: ['M', 'L', 'XL', '2XL'], images: [], currentStock: 1200, suggestedPrice: 118, lastCost: 62, newDate: '2025-06-01', status: '正常销售', description: '全拉链设计，加绒保暖' },
  { id: 'p016', styleNo: 'HL-003', name: '吊带碎花裙', category: '连衣裙', colors: [{ name: '黄白碎花', hex: '#d4c87a' }, { name: '粉白碎花', hex: '#d4a0a0' }], sizes: ['S', 'M', 'L'], images: [], currentStock: 350, suggestedPrice: 108, lastCost: 55, newDate: '2025-06-15', status: '正常销售', description: '夏日清凉款，吊带设计' },
  { id: 'p017', styleNo: 'HK-003', name: '长款棉服外套', category: '外套', colors: [{ name: '黑色', hex: '#1a1a1a' }, { name: '军绿', hex: '#4a5a3a' }], sizes: ['M', 'L', 'XL', '2XL'], images: [], currentStock: 280, suggestedPrice: 238, lastCost: 128, newDate: '2025-05-05', status: '正常销售', description: '长款加厚棉服，保暖防风' },
  { id: 'p018', styleNo: 'HJ-004', name: '弹力小脚牛仔裤', category: '牛仔裤', colors: [{ name: '深蓝', hex: '#1a3a6b' }, { name: '浅蓝', hex: '#7bafd4' }, { name: '黑色', hex: '#1a1a1a' }], sizes: ['S', 'M', 'L', 'XL'], images: [], currentStock: 8, suggestedPrice: 88, lastCost: 48, newDate: '2025-06-20', status: '库存不足', description: '弹力面料，小脚设计' },
  { id: 'p019', styleNo: 'HT-004', name: '条纹长袖T恤', category: 'T恤', colors: [{ name: '蓝白条纹', hex: '#6b9bc3' }, { name: '黑白条纹', hex: '#555555' }], sizes: ['M', 'L', 'XL'], images: [], currentStock: 900, suggestedPrice: 45, lastCost: 24, newDate: '2025-07-01', status: '正常销售', description: '经典条纹设计，长袖款式' },
  { id: 'p020', styleNo: 'HL-004', name: '优雅西装裙', category: '连衣裙', colors: [{ name: '黑色', hex: '#1a1a1a' }, { name: '藏蓝', hex: '#1e3a5f' }], sizes: ['S', 'M', 'L'], images: [], currentStock: 180, suggestedPrice: 168, lastCost: 88, newDate: '2025-06-28', status: '正常销售', description: '职场优雅款，修身西装裙' },
  { id: 'p021', styleNo: 'HK-004', name: '飞行员夹克', category: '外套', colors: [{ name: '军绿', hex: '#4a5a3a' }, { name: '黑色', hex: '#1a1a1a' }], sizes: ['M', 'L', 'XL'], images: [], currentStock: 200, suggestedPrice: 218, lastCost: 115, newDate: '2025-07-10', status: '已上新', description: '经典飞行员款，内衬橘色里布' },
  { id: 'p022', styleNo: 'HQ-003', name: '包臀针织半裙', category: '半裙', colors: [{ name: '黑色', hex: '#1a1a1a' }, { name: '灰色', hex: '#9ca3af' }], sizes: ['S', 'M', 'L'], images: [], currentStock: 250, suggestedPrice: 82, lastCost: 42, newDate: '2025-05-25', status: '正常销售', description: '弹力针织面料，包臀设计' },
  { id: 'p023', styleNo: 'HW-004', name: '翻领卫衣', category: '卫衣', colors: [{ name: '灰色', hex: '#9ca3af' }, { name: '酒红', hex: '#8b1a1a' }], sizes: ['M', 'L', 'XL'], images: [], currentStock: 650, suggestedPrice: 98, lastCost: 52, newDate: '2025-07-05', status: '已上新', description: '翻领设计，时尚百搭' },
  { id: 'p024', styleNo: 'HJ-005', name: '高腰喇叭牛仔裤', category: '牛仔裤', colors: [{ name: '深蓝', hex: '#1a3a6b' }], sizes: ['S', 'M', 'L', 'XL'], images: [], currentStock: 5, suggestedPrice: 98, lastCost: 55, newDate: '2025-07-15', status: '库存不足', description: '高腰喇叭设计，复古时尚' },
  { id: 'p025', styleNo: 'HT-005', name: '扎染T恤', category: 'T恤', colors: [{ name: '蓝紫渐变', hex: '#6b5bc3' }, { name: '粉橙渐变', hex: '#c38a6b' }], sizes: ['M', 'L', 'XL'], images: [], currentStock: 500, suggestedPrice: 52, lastCost: 28, newDate: '2025-07-18', status: '已上新', description: '手工扎染工艺，每件独特' },
  { id: 'p026', styleNo: 'HK-005', name: '羊羔毛外套', category: '外套', colors: [{ name: '米白', hex: '#f5f0e8' }, { name: '焦糖', hex: '#a0622e' }], sizes: ['M', 'L', 'XL'], images: [], currentStock: 0, suggestedPrice: 258, lastCost: 138, newDate: '2025-01-20', status: '已停售', description: '仿羊羔毛面料，保暖时尚' },
  { id: 'p027', styleNo: 'HL-005', name: '印花雪纺连衣裙', category: '连衣裙', colors: [{ name: '绿白印花', hex: '#8bc3a0' }], sizes: ['S', 'M', 'L'], images: [], currentStock: 0, suggestedPrice: 118, lastCost: 62, newDate: '2024-12-10', status: '设计中', description: '新款雪纺印花裙，设计中' },
  { id: 'p028', styleNo: 'HQ-004', name: '牛仔半裙', category: '半裙', colors: [{ name: '浅蓝', hex: '#7bafd4' }, { name: '深蓝', hex: '#1a3a6b' }], sizes: ['S', 'M', 'L', 'XL'], images: [], currentStock: 380, suggestedPrice: 72, lastCost: 38, newDate: '2025-04-25', status: '正常销售', description: '经典牛仔面料，A字版型' },
  { id: 'p029', styleNo: 'HW-005', name: '套头加绒卫衣', category: '卫衣', colors: [{ name: '粉色', hex: '#e8a0b0' }, { name: '白色', hex: '#ffffff' }], sizes: ['S', 'M', 'L', 'XL'], images: [], currentStock: 0, suggestedPrice: 105, lastCost: 56, newDate: '2025-07-20', status: '生产中', description: '新款套头卫衣，正在生产中' },
  { id: 'p030', styleNo: 'HT-006', name: '字母印花T恤', category: 'T恤', colors: [{ name: '白色', hex: '#ffffff' }, { name: '黑色', hex: '#1a1a1a' }], sizes: ['M', 'L', 'XL', '2XL'], images: [], currentStock: 1600, suggestedPrice: 38, lastCost: 20, newDate: '2025-06-10', status: '正常销售', description: '简约字母印花，基础百搭' },
];

// ============ 工厂 ============
export const factories: Factory[] = [
  { id: 'f001', name: '广州新塘牛仔制衣厂', contact: '张伟', phone: '138-0001-1234', mainCategory: '牛仔裤', totalProductionAmount: 580000, paidAmount: 420000, unpaidAmount: 160000, lastCoopDate: '2025-07-20', address: '广州市增城区新塘镇', notes: '主要牛仔裤供应商' },
  { id: 'f002', name: '东莞大朗毛织厂', contact: '李芳', phone: '139-0002-5678', mainCategory: '卫衣/T恤', totalProductionAmount: 420000, paidAmount: 350000, unpaidAmount: 70000, lastCoopDate: '2025-07-18', address: '东莞市大朗镇', notes: '毛织和卫衣主力工厂' },
  { id: 'f003', name: '佛山盐步服装厂', contact: '王强', phone: '137-0003-9012', mainCategory: '连衣裙/半裙', totalProductionAmount: 360000, paidAmount: 280000, unpaidAmount: 80000, lastCoopDate: '2025-07-15', address: '佛山市南海区盐步镇', notes: '连衣裙专业生产' },
  { id: 'f004', name: '中山沙溪外套厂', contact: '陈明', phone: '136-0004-3456', mainCategory: '外套', totalProductionAmount: 520000, paidAmount: 430000, unpaidAmount: 90000, lastCoopDate: '2025-07-22', address: '中山市沙溪镇', notes: '各类外套生产' },
  { id: 'f005', name: '汕头潮南针织厂', contact: '刘红', phone: '135-0005-7890', mainCategory: 'T恤/针织', totalProductionAmount: 280000, paidAmount: 220000, unpaidAmount: 60000, lastCoopDate: '2025-07-10', address: '汕头市潮南区', notes: '针织T恤专业工厂' },
];

// ============ 生产批次 ============
export const productionBatches: ProductionBatch[] = [
  { id: 'pb001', factoryId: 'f001', factoryName: '广州新塘牛仔制衣厂', styleNo: 'HJ-001', productName: '经典直筒牛仔裤', color: '深蓝', size: 'M', quantity: 500, unitCost: 48, totalCost: 24000, warehouseId: 'wh1', warehouseName: '广州白云仓', inboundDate: '2025-01-20', paidAmount: 24000, unpaidAmount: 0, status: '已结清' },
  { id: 'pb002', factoryId: 'f001', factoryName: '广州新塘牛仔制衣厂', styleNo: 'HJ-001', productName: '经典直筒牛仔裤', color: '深蓝', size: 'L', quantity: 500, unitCost: 48, totalCost: 24000, warehouseId: 'wh1', warehouseName: '广州白云仓', inboundDate: '2025-01-20', paidAmount: 12000, unpaidAmount: 12000, status: '已入库' },
  { id: 'pb003', factoryId: 'f002', factoryName: '东莞大朗毛织厂', styleNo: 'HW-001', productName: '加绒连帽卫衣', color: '灰色', size: 'L', quantity: 300, unitCost: 58, totalCost: 17400, warehouseId: 'wh2', warehouseName: '广州番禺仓', inboundDate: '2025-03-05', paidAmount: 17400, unpaidAmount: 0, status: '已结清' },
  { id: 'pb004', factoryId: 'f002', factoryName: '东莞大朗毛织厂', styleNo: 'HT-001', productName: '纯色圆领T恤', color: '白色', size: 'M', quantity: 800, unitCost: 18, totalCost: 14400, warehouseId: 'wh2', warehouseName: '广州番禺仓', inboundDate: '2025-01-12', paidAmount: 14400, unpaidAmount: 0, status: '已结清' },
  { id: 'pb005', factoryId: 'f003', factoryName: '佛山盐步服装厂', styleNo: 'HL-001', productName: '碎花连衣裙', color: '蓝白碎花', size: 'M', quantity: 200, unitCost: 68, totalCost: 13600, warehouseId: 'wh1', warehouseName: '广州白云仓', inboundDate: '2025-04-25', paidAmount: 8000, unpaidAmount: 5600, status: '已入库' },
  { id: 'pb006', factoryId: 'f004', factoryName: '中山沙溪外套厂', styleNo: 'HK-001', productName: '中长款风衣外套', color: '卡其', size: 'L', quantity: 150, unitCost: 105, totalCost: 15750, warehouseId: 'wh3', warehouseName: '东莞虎门仓', inboundDate: '2025-02-01', paidAmount: 15750, unpaidAmount: 0, status: '已结清' },
  { id: 'pb007', factoryId: 'f004', factoryName: '中山沙溪外套厂', styleNo: 'HK-004', productName: '飞行员夹克', color: '军绿', size: 'L', quantity: 100, unitCost: 115, totalCost: 11500, warehouseId: 'wh3', warehouseName: '东莞虎门仓', inboundDate: '2025-07-12', paidAmount: 0, unpaidAmount: 11500, status: '已入库' },
  { id: 'pb008', factoryId: 'f001', factoryName: '广州新塘牛仔制衣厂', styleNo: 'HJ-004', productName: '弹力小脚牛仔裤', color: '深蓝', size: 'M', quantity: 200, unitCost: 48, totalCost: 9600, warehouseId: 'wh1', warehouseName: '广州白云仓', inboundDate: '2025-06-25', paidAmount: 4800, unpaidAmount: 4800, status: '已入库' },
  { id: 'pb009', factoryId: 'f005', factoryName: '汕头潮南针织厂', styleNo: 'HT-004', productName: '条纹长袖T恤', color: '蓝白条纹', size: 'L', quantity: 400, unitCost: 24, totalCost: 9600, warehouseId: 'wh2', warehouseName: '广州番禺仓', inboundDate: '2025-07-05', paidAmount: 9600, unpaidAmount: 0, status: '已结清' },
  { id: 'pb010', factoryId: 'f003', factoryName: '佛山盐步服装厂', styleNo: 'HQ-001', productName: '高腰A字半裙', color: '黑色', size: 'M', quantity: 250, unitCost: 40, totalCost: 10000, warehouseId: 'wh1', warehouseName: '广州白云仓', inboundDate: '2025-04-01', paidAmount: 10000, unpaidAmount: 0, status: '已结清' },
  { id: 'pb011', factoryId: 'f005', factoryName: '汕头潮南针织厂', styleNo: 'HT-006', productName: '字母印花T恤', color: '白色', size: 'L', quantity: 600, unitCost: 20, totalCost: 12000, warehouseId: 'wh2', warehouseName: '广州番禺仓', inboundDate: '2025-06-15', paidAmount: 6000, unpaidAmount: 6000, status: '已入库' },
  { id: 'pb012', factoryId: 'f002', factoryName: '东莞大朗毛织厂', styleNo: 'HW-005', productName: '套头加绒卫衣', color: '粉色', size: 'M', quantity: 300, unitCost: 56, totalCost: 16800, warehouseId: 'wh2', warehouseName: '广州番禺仓', inboundDate: '', paidAmount: 0, unpaidAmount: 16800, status: '生产中' },
  { id: 'pb013', factoryId: 'f004', factoryName: '中山沙溪外套厂', styleNo: 'HK-003', productName: '长款棉服外套', color: '黑色', size: 'L', quantity: 120, unitCost: 128, totalCost: 15360, warehouseId: 'wh3', warehouseName: '东莞虎门仓', inboundDate: '2025-05-10', paidAmount: 15360, unpaidAmount: 0, status: '已结清' },
  { id: 'pb014', factoryId: 'f001', factoryName: '广州新塘牛仔制衣厂', styleNo: 'HJ-005', productName: '高腰喇叭牛仔裤', color: '深蓝', size: 'M', quantity: 150, unitCost: 55, totalCost: 8250, warehouseId: 'wh1', warehouseName: '广州白云仓', inboundDate: '2025-07-18', paidAmount: 0, unpaidAmount: 8250, status: '待入库' },
  { id: 'pb015', factoryId: 'f003', factoryName: '佛山盐步服装厂', styleNo: 'HL-005', productName: '印花雪纺连衣裙', color: '绿白印花', size: 'M', quantity: 200, unitCost: 62, totalCost: 12400, warehouseId: 'wh1', warehouseName: '广州白云仓', inboundDate: '', paidAmount: 0, unpaidAmount: 12400, status: '待生产' },
];

// ============ 订单 ============
export const orders: Order[] = [
  { id: 'o001', orderNo: 'ORD-2025-001', customerId: 'c001', customerName: 'Lagos Fashion Hub Ltd', country: 'Nigeria', orderDate: '2025-07-20', items: [{ styleNo: 'HJ-001', productName: '经典直筒牛仔裤', color: '深蓝', size: 'L', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 200, quantity: 100, unitPrice: 85, subtotal: 8500 }, { styleNo: 'HT-001', productName: '纯色圆领T恤', color: '白色', size: 'XL', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 300, quantity: 200, unitPrice: 35, subtotal: 7000 }], totalAmount: 15500, paidAmount: 8000, unpaidAmount: 7500, totalQuantity: 300, shippedQuantity: 150, pendingShipQuantity: 150, status: '部分发货', presaveDeduction: 0, finalReceivable: 7500 },
  { id: 'o002', orderNo: 'ORD-2025-002', customerId: 'c002', customerName: 'Accra Textile Trading Co', country: 'Ghana', orderDate: '2025-07-18', items: [{ styleNo: 'HL-001', productName: '碎花连衣裙', color: '蓝白碎花', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 80, quantity: 80, unitPrice: 128, subtotal: 10240 }, { styleNo: 'HQ-001', productName: '高腰A字半裙', color: '黑色', size: 'S', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 60, quantity: 50, unitPrice: 78, subtotal: 3900 }], totalAmount: 14140, paidAmount: 5000, unpaidAmount: 9140, totalQuantity: 130, shippedQuantity: 50, pendingShipQuantity: 80, status: '部分发货', presaveDeduction: 0, finalReceivable: 9140 },
  { id: 'o003', orderNo: 'ORD-2025-003', customerId: 'c003', customerName: 'Nairobi Garments Wholesale', country: 'Kenya', orderDate: '2025-07-22', items: [{ styleNo: 'HK-001', productName: '中长款风衣外套', color: '卡其', size: 'L', warehouseId: 'wh3', warehouseName: '东莞虎门仓', availableStock: 50, quantity: 50, unitPrice: 198, subtotal: 9900 }, { styleNo: 'HW-001', productName: '加绒连帽卫衣', color: '灰色', size: 'XL', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 100, quantity: 80, unitPrice: 110, subtotal: 8800 }], totalAmount: 18700, paidAmount: 20000, unpaidAmount: 0, totalQuantity: 130, shippedQuantity: 130, pendingShipQuantity: 0, status: '已全部发货', presaveDeduction: 1300, finalReceivable: 0 },
  { id: 'o004', orderNo: 'ORD-2025-004', customerId: 'c004', customerName: 'Dar Express Fashions', country: 'Tanzania', orderDate: '2025-06-10', items: [{ styleNo: 'HJ-002', productName: '破洞修身牛仔裤', color: '深蓝', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 100, quantity: 100, unitPrice: 95, subtotal: 9500 }, { styleNo: 'HK-003', productName: '长款棉服外套', color: '黑色', size: 'L', warehouseId: 'wh3', warehouseName: '东莞虎门仓', availableStock: 40, quantity: 40, unitPrice: 238, subtotal: 9520 }], totalAmount: 19020, paidAmount: 8000, unpaidAmount: 11020, totalQuantity: 140, shippedQuantity: 60, pendingShipQuantity: 80, status: '部分发货', presaveDeduction: 0, finalReceivable: 11020 },
  { id: 'o005', orderNo: 'ORD-2025-005', customerId: 'c005', customerName: 'Kampala Clothing Centre', country: 'Uganda', orderDate: '2025-07-15', items: [{ styleNo: 'HT-001', productName: '纯色圆领T恤', color: '黑色', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 200, quantity: 150, unitPrice: 35, subtotal: 5250 }, { styleNo: 'HW-001', productName: '加绒连帽卫衣', color: '黑色', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 100, quantity: 80, unitPrice: 110, subtotal: 8800 }], totalAmount: 14050, paidAmount: 6000, unpaidAmount: 8050, totalQuantity: 230, shippedQuantity: 100, pendingShipQuantity: 130, status: '部分发货', presaveDeduction: 0, finalReceivable: 8050 },
  { id: 'o006', orderNo: 'ORD-2025-006', customerId: 'c008', customerName: 'Cape Town Fashion Distributors', country: 'South Africa', orderDate: '2025-07-23', items: [{ styleNo: 'HL-001', productName: '碎花连衣裙', color: '红白碎花', size: 'S', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 60, quantity: 60, unitPrice: 128, subtotal: 7680 }, { styleNo: 'HK-001', productName: '中长款风衣外套', color: '黑色', size: 'M', warehouseId: 'wh3', warehouseName: '东莞虎门仓', availableStock: 40, quantity: 30, unitPrice: 198, subtotal: 5940 }], totalAmount: 13620, paidAmount: 15000, unpaidAmount: 0, totalQuantity: 90, shippedQuantity: 90, pendingShipQuantity: 0, status: '已完成', presaveDeduction: 1380, finalReceivable: 0 },
  { id: 'o007', orderNo: 'ORD-2025-007', customerId: 'c006', customerName: 'Douala Style Market', country: 'Cameroon', orderDate: '2025-07-21', items: [{ styleNo: 'HJ-001', productName: '经典直筒牛仔裤', color: '黑色', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 150, quantity: 120, unitPrice: 85, subtotal: 10200 }, { styleNo: 'HL-002', productName: '修身针织连衣裙', color: '黑色', size: 'S', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 10, quantity: 10, unitPrice: 148, subtotal: 1480 }], totalAmount: 11680, paidAmount: 12000, unpaidAmount: 0, totalQuantity: 130, shippedQuantity: 0, pendingShipQuantity: 130, status: '已确认', presaveDeduction: 320, finalReceivable: 0 },
  { id: 'o008', orderNo: 'ORD-2025-008', customerId: 'c013', customerName: 'Ibadan Clothing Supplies', country: 'Nigeria', orderDate: '2025-07-22', items: [{ styleNo: 'HT-001', productName: '纯色圆领T恤', color: '藏蓝', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 180, quantity: 180, unitPrice: 35, subtotal: 6300 }, { styleNo: 'HW-003', productName: '拉链卫衣', color: '灰色', size: 'XL', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 80, quantity: 60, unitPrice: 118, subtotal: 7080 }], totalAmount: 13380, paidAmount: 6000, unpaidAmount: 7380, totalQuantity: 240, shippedQuantity: 0, pendingShipQuantity: 240, status: '已确认', presaveDeduction: 0, finalReceivable: 7380 },
  { id: 'o009', orderNo: 'ORD-2025-009', customerId: 'c020', customerName: 'Port Harcourt Textile Co', country: 'Nigeria', orderDate: '2025-07-20', items: [{ styleNo: 'HT-003', productName: 'POLO领T恤', color: '白色', size: 'XL', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 150, quantity: 100, unitPrice: 48, subtotal: 4800 }, { styleNo: 'HW-001', productName: '加绒连帽卫衣', color: '军绿', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 60, quantity: 50, unitPrice: 110, subtotal: 5500 }], totalAmount: 10300, paidAmount: 5000, unpaidAmount: 5300, totalQuantity: 150, shippedQuantity: 50, pendingShipQuantity: 100, status: '部分发货', presaveDeduction: 0, finalReceivable: 5300 },
  { id: 'o010', orderNo: 'ORD-2025-010', customerId: 'c016', customerName: 'Johannesburg Fashion Hub', country: 'South Africa', orderDate: '2025-07-24', items: [{ styleNo: 'HK-004', productName: '飞行员夹克', color: '军绿', size: 'L', warehouseId: 'wh3', warehouseName: '东莞虎门仓', availableStock: 60, quantity: 50, unitPrice: 218, subtotal: 10900 }, { styleNo: 'HJ-001', productName: '经典直筒牛仔裤', color: '深蓝', size: 'XL', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 100, quantity: 80, unitPrice: 85, subtotal: 6800 }], totalAmount: 17700, paidAmount: 0, unpaidAmount: 17700, totalQuantity: 130, shippedQuantity: 0, pendingShipQuantity: 130, status: '待确认', presaveDeduction: 0, finalReceivable: 17700 },
  { id: 'o011', orderNo: 'ORD-2025-011', customerId: 'c007', customerName: 'Dakar Wholesale Group', country: 'Senegal', orderDate: '2025-07-19', items: [{ styleNo: 'HK-001', productName: '中长款风衣外套', color: '卡其', size: 'M', warehouseId: 'wh3', warehouseName: '东莞虎门仓', availableStock: 30, quantity: 30, unitPrice: 198, subtotal: 5940 }, { styleNo: 'HQ-001', productName: '高腰A字半裙', color: '酒红', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 40, quantity: 40, unitPrice: 78, subtotal: 3120 }], totalAmount: 9060, paidAmount: 3000, unpaidAmount: 6060, totalQuantity: 70, shippedQuantity: 30, pendingShipQuantity: 40, status: '部分发货', presaveDeduction: 0, finalReceivable: 6060 },
  { id: 'o012', orderNo: 'ORD-2025-012', customerId: 'c011', customerName: 'Mombasa Garments Ltd', country: 'Kenya', orderDate: '2025-07-17', items: [{ styleNo: 'HL-001', productName: '碎花连衣裙', color: '蓝白碎花', size: 'S', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 50, quantity: 40, unitPrice: 128, subtotal: 5120 }, { styleNo: 'HT-001', productName: '纯色圆领T恤', color: '白色', size: 'M', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 200, quantity: 150, unitPrice: 35, subtotal: 5250 }], totalAmount: 10370, paidAmount: 4000, unpaidAmount: 6370, totalQuantity: 190, shippedQuantity: 80, pendingShipQuantity: 110, status: '部分发货', presaveDeduction: 0, finalReceivable: 6370 },
  { id: 'o013', orderNo: 'ORD-2025-013', customerId: 'c010', customerName: 'Luanda Apparel Trading', country: 'Angola', orderDate: '2025-07-10', items: [{ styleNo: 'HW-001', productName: '加绒连帽卫衣', color: '黑色', size: 'XL', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 80, quantity: 60, unitPrice: 110, subtotal: 6600 }, { styleNo: 'HK-003', productName: '长款棉服外套', color: '军绿', size: 'L', warehouseId: 'wh3', warehouseName: '东莞虎门仓', availableStock: 30, quantity: 20, unitPrice: 238, subtotal: 4760 }], totalAmount: 11360, paidAmount: 5000, unpaidAmount: 6360, totalQuantity: 80, shippedQuantity: 30, pendingShipQuantity: 50, status: '部分发货', presaveDeduction: 0, finalReceivable: 6360 },
  { id: 'o014', orderNo: 'ORD-2025-014', customerId: 'c015', customerName: 'Thies Wholesale Textiles', country: 'Senegal', orderDate: '2025-07-12', items: [{ styleNo: 'HQ-001', productName: '高腰A字半裙', color: '卡其', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 40, quantity: 30, unitPrice: 78, subtotal: 2340 }, { styleNo: 'HL-003', productName: '吊带碎花裙', color: '黄白碎花', size: 'S', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 50, quantity: 40, unitPrice: 108, subtotal: 4320 }], totalAmount: 6660, paidAmount: 3000, unpaidAmount: 3660, totalQuantity: 70, shippedQuantity: 30, pendingShipQuantity: 40, status: '部分发货', presaveDeduction: 0, finalReceivable: 3660 },
  { id: 'o015', orderNo: 'ORD-2025-015', customerId: 'c017', customerName: 'Kisumu Apparel Traders', country: 'Kenya', orderDate: '2025-06-28', items: [{ styleNo: 'HT-001', productName: '纯色圆领T恤', color: '灰色', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 120, quantity: 100, unitPrice: 35, subtotal: 3500 }], totalAmount: 3500, paidAmount: 1000, unpaidAmount: 2500, totalQuantity: 100, shippedQuantity: 40, pendingShipQuantity: 60, status: '部分发货', presaveDeduction: 0, finalReceivable: 2500 },
  { id: 'o016', orderNo: 'ORD-2025-016', customerId: 'c009', customerName: 'Abidjan Textile Import', country: "Côte d'Ivoire", orderDate: '2025-05-15', items: [{ styleNo: 'HT-001', productName: '纯色圆领T恤', color: '黑色', size: 'XL', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 80, quantity: 80, unitPrice: 35, subtotal: 2800 }, { styleNo: 'HJ-001', productName: '经典直筒牛仔裤', color: '浅蓝', size: 'L', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 60, quantity: 50, unitPrice: 85, subtotal: 4250 }], totalAmount: 7050, paidAmount: 3000, unpaidAmount: 4050, totalQuantity: 130, shippedQuantity: 130, pendingShipQuantity: 0, status: '已全部发货', presaveDeduction: 0, finalReceivable: 4050 },
  { id: 'o017', orderNo: 'ORD-2025-017', customerId: 'c018', customerName: 'Lome Garments Export', country: "Côte d'Ivoire", orderDate: '2025-07-08', items: [{ styleNo: 'HW-001', productName: '加绒连帽卫衣', color: '灰色', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 100, quantity: 80, unitPrice: 110, subtotal: 8800 }], totalAmount: 8800, paidAmount: 8800, unpaidAmount: 0, totalQuantity: 80, shippedQuantity: 80, pendingShipQuantity: 0, status: '已完成', presaveDeduction: 0, finalReceivable: 0 },
  { id: 'o018', orderNo: 'ORD-2025-018', customerId: 'c012', customerName: 'Kumasi Fashion House', country: 'Ghana', orderDate: '2025-07-05', items: [{ styleNo: 'HJ-001', productName: '经典直筒牛仔裤', color: '深蓝', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 100, quantity: 80, unitPrice: 85, subtotal: 6800 }, { styleNo: 'HQ-001', productName: '高腰A字半裙', color: '黑色', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 40, quantity: 30, unitPrice: 78, subtotal: 2340 }], totalAmount: 9140, paidAmount: 9140, unpaidAmount: 0, totalQuantity: 110, shippedQuantity: 110, pendingShipQuantity: 0, status: '已完成', presaveDeduction: 0, finalReceivable: 0 },
  { id: 'o019', orderNo: 'ORD-2025-019', customerId: 'c014', customerName: 'Yaoundé Style Boutique', country: 'Cameroon', orderDate: '2025-04-20', items: [{ styleNo: 'HL-001', productName: '碎花连衣裙', color: '蓝白碎花', size: 'S', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 30, quantity: 20, unitPrice: 128, subtotal: 2560 }], totalAmount: 2560, paidAmount: 800, unpaidAmount: 1760, totalQuantity: 20, shippedQuantity: 20, pendingShipQuantity: 0, status: '已全部发货', presaveDeduction: 0, finalReceivable: 1760 },
  { id: 'o020', orderNo: 'ORD-2025-020', customerId: 'c003', customerName: 'Nairobi Garments Wholesale', country: 'Kenya', orderDate: '2025-07-10', items: [{ styleNo: 'HK-001', productName: '中长款风衣外套', color: '黑色', size: 'XL', warehouseId: 'wh3', warehouseName: '东莞虎门仓', availableStock: 20, quantity: 20, unitPrice: 198, subtotal: 3960 }], totalAmount: 3960, paidAmount: 3960, unpaidAmount: 0, totalQuantity: 20, shippedQuantity: 20, pendingShipQuantity: 0, status: '已完成', presaveDeduction: 0, finalReceivable: 0 },
  { id: 'o021', orderNo: 'ORD-2025-021', customerId: 'c008', customerName: 'Cape Town Fashion Distributors', country: 'South Africa', orderDate: '2025-07-15', items: [{ styleNo: 'HW-003', productName: '拉链卫衣', color: '藏蓝', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 60, quantity: 50, unitPrice: 118, subtotal: 5900 }], totalAmount: 5900, paidAmount: 5900, unpaidAmount: 0, totalQuantity: 50, shippedQuantity: 50, pendingShipQuantity: 0, status: '已完成', presaveDeduction: 0, finalReceivable: 0 },
  { id: 'o022', orderNo: 'ORD-2025-022', customerId: 'c016', customerName: 'Johannesburg Fashion Hub', country: 'South Africa', orderDate: '2025-07-20', items: [{ styleNo: 'HW-001', productName: '加绒连帽卫衣', color: '军绿', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 80, quantity: 60, unitPrice: 110, subtotal: 6600 }, { styleNo: 'HK-001', productName: '中长款风衣外套', color: '卡其', size: 'L', warehouseId: 'wh3', warehouseName: '东莞虎门仓', availableStock: 30, quantity: 20, unitPrice: 198, subtotal: 3960 }], totalAmount: 10560, paidAmount: 8000, unpaidAmount: 2560, totalQuantity: 80, shippedQuantity: 0, pendingShipQuantity: 80, status: '已确认', presaveDeduction: 0, finalReceivable: 2560 },
  { id: 'o023', orderNo: 'ORD-2025-023', customerId: 'c019', customerName: 'Bamako Fashion Distribution', country: 'Senegal', orderDate: '2025-03-15', items: [{ styleNo: 'HJ-001', productName: '经典直筒牛仔裤', color: '深蓝', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 30, quantity: 30, unitPrice: 85, subtotal: 2550 }], totalAmount: 2550, paidAmount: 1000, unpaidAmount: 1550, totalQuantity: 30, shippedQuantity: 30, pendingShipQuantity: 0, status: '已全部发货', presaveDeduction: 0, finalReceivable: 1550 },
  { id: 'o024', orderNo: 'ORD-2025-024', customerId: 'c001', customerName: 'Lagos Fashion Hub Ltd', country: 'Nigeria', orderDate: '2025-07-24', items: [{ styleNo: 'HJ-002', productName: '破洞修身牛仔裤', color: '浅蓝', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', availableStock: 60, quantity: 50, unitPrice: 95, subtotal: 4750 }], totalAmount: 4750, paidAmount: 0, unpaidAmount: 4750, totalQuantity: 50, shippedQuantity: 0, pendingShipQuantity: 50, status: '草稿', presaveDeduction: 0, finalReceivable: 4750 },
  { id: 'o025', orderNo: 'ORD-2025-025', customerId: 'c005', customerName: 'Kampala Clothing Centre', country: 'Uganda', orderDate: '2025-07-25', items: [{ styleNo: 'HT-004', productName: '条纹长袖T恤', color: '蓝白条纹', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', availableStock: 100, quantity: 80, unitPrice: 45, subtotal: 3600 }], totalAmount: 3600, paidAmount: 0, unpaidAmount: 3600, totalQuantity: 80, shippedQuantity: 0, pendingShipQuantity: 80, status: '草稿', presaveDeduction: 0, finalReceivable: 3600 },
];

// ============ 发货记录 ============
export const shipments: Shipment[] = [
  { id: 's001', shipmentNo: 'SHP-2025-001', orderId: 'o001', orderNo: 'ORD-2025-001', customerId: 'c001', customerName: 'Lagos Fashion Hub Ltd', shipDate: '2025-07-21', warehouseId: 'wh1', warehouseName: '广州白云仓', logisticsMethod: '海运', trackingNo: 'COSCO-2025-78901', items: [{ styleNo: 'HJ-001', color: '深蓝', size: 'L', orderQty: 100, shippedQty: 0, thisShipQty: 50, unitPrice: 85, thisShipAmount: 4250 }, { styleNo: 'HT-001', color: '白色', size: 'XL', orderQty: 200, shippedQty: 0, thisShipQty: 100, unitPrice: 35, thisShipAmount: 3500 }], totalItems: 150, totalAmount: 7750, notes: '第一批发货' },
  { id: 's002', shipmentNo: 'SHP-2025-002', orderId: 'o002', orderNo: 'ORD-2025-002', customerId: 'c002', customerName: 'Accra Textile Trading Co', shipDate: '2025-07-19', warehouseId: 'wh1', warehouseName: '广州白云仓', logisticsMethod: '海运', trackingNo: 'MSK-2025-45678', items: [{ styleNo: 'HQ-001', color: '黑色', size: 'S', orderQty: 50, shippedQty: 0, thisShipQty: 50, unitPrice: 78, thisShipAmount: 3900 }], totalItems: 50, totalAmount: 3900, notes: '' },
  { id: 's003', shipmentNo: 'SHP-2025-003', orderId: 'o003', orderNo: 'ORD-2025-003', customerId: 'c003', customerName: 'Nairobi Garments Wholesale', shipDate: '2025-07-23', warehouseId: 'wh3', warehouseName: '东莞虎门仓', logisticsMethod: '空运', trackingNo: 'ET-2025-12345', items: [{ styleNo: 'HK-001', color: '卡其', size: 'L', orderQty: 50, shippedQty: 0, thisShipQty: 50, unitPrice: 198, thisShipAmount: 9900 }, { styleNo: 'HW-001', color: '灰色', size: 'XL', orderQty: 80, shippedQty: 0, thisShipQty: 80, unitPrice: 110, thisShipAmount: 8800 }], totalItems: 130, totalAmount: 18700, notes: '空运急单' },
  { id: 's004', shipmentNo: 'SHP-2025-004', orderId: 'o004', orderNo: 'ORD-2025-004', customerId: 'c004', customerName: 'Dar Express Fashions', shipDate: '2025-06-15', warehouseId: 'wh1', warehouseName: '广州白云仓', logisticsMethod: '海运', trackingNo: 'CMA-2025-34567', items: [{ styleNo: 'HJ-002', color: '深蓝', size: 'M', orderQty: 100, shippedQty: 0, thisShipQty: 30, unitPrice: 95, thisShipAmount: 2850 }, { styleNo: 'HK-003', color: '黑色', size: 'L', orderQty: 40, shippedQty: 0, thisShipQty: 30, unitPrice: 238, thisShipAmount: 7140 }], totalItems: 60, totalAmount: 9990, notes: '部分发货' },
  { id: 's005', shipmentNo: 'SHP-2025-005', orderId: 'o005', orderNo: 'ORD-2025-005', customerId: 'c005', customerName: 'Kampala Clothing Centre', shipDate: '2025-07-16', warehouseId: 'wh2', warehouseName: '广州番禺仓', logisticsMethod: '海运', trackingNo: 'MSC-2025-67890', items: [{ styleNo: 'HT-001', color: '黑色', size: 'L', orderQty: 150, shippedQty: 0, thisShipQty: 60, unitPrice: 35, thisShipAmount: 2100 }, { styleNo: 'HW-001', color: '黑色', size: 'L', orderQty: 80, shippedQty: 0, thisShipQty: 40, unitPrice: 110, thisShipAmount: 4400 }], totalItems: 100, totalAmount: 6500, notes: '' },
  { id: 's006', shipmentNo: 'SHP-2025-006', orderId: 'o006', orderNo: 'ORD-2025-006', customerId: 'c008', customerName: 'Cape Town Fashion Distributors', shipDate: '2025-07-24', warehouseId: 'wh1', warehouseName: '广州白云仓', logisticsMethod: '海运', trackingNo: 'SAF-2025-11111', items: [{ styleNo: 'HL-001', color: '红白碎花', size: 'S', orderQty: 60, shippedQty: 0, thisShipQty: 60, unitPrice: 128, thisShipAmount: 7680 }, { styleNo: 'HK-001', color: '黑色', size: 'M', orderQty: 30, shippedQty: 0, thisShipQty: 30, unitPrice: 198, thisShipAmount: 5940 }], totalItems: 90, totalAmount: 13620, notes: '' },
  { id: 's007', shipmentNo: 'SHP-2025-007', orderId: 'o009', orderNo: 'ORD-2025-009', customerId: 'c020', customerName: 'Port Harcourt Textile Co', shipDate: '2025-07-22', warehouseId: 'wh2', warehouseName: '广州番禺仓', logisticsMethod: '海运', trackingNo: 'COSCO-2025-22222', items: [{ styleNo: 'HW-001', color: '军绿', size: 'L', orderQty: 50, shippedQty: 0, thisShipQty: 50, unitPrice: 110, thisShipAmount: 5500 }], totalItems: 50, totalAmount: 5500, notes: '' },
  { id: 's008', shipmentNo: 'SHP-2025-008', orderId: 'o011', orderNo: 'ORD-2025-011', customerId: 'c007', customerName: 'Dakar Wholesale Group', shipDate: '2025-07-20', warehouseId: 'wh3', warehouseName: '东莞虎门仓', logisticsMethod: '海运', trackingNo: 'MSK-2025-33333', items: [{ styleNo: 'HK-001', color: '卡其', size: 'M', orderQty: 30, shippedQty: 0, thisShipQty: 30, unitPrice: 198, thisShipAmount: 5940 }], totalItems: 30, totalAmount: 5940, notes: '' },
  { id: 's009', shipmentNo: 'SHP-2025-009', orderId: 'o012', orderNo: 'ORD-2025-012', customerId: 'c011', customerName: 'Mombasa Garments Ltd', shipDate: '2025-07-18', warehouseId: 'wh1', warehouseName: '广州白云仓', logisticsMethod: '海运', trackingNo: 'ET-2025-44444', items: [{ styleNo: 'HL-001', color: '蓝白碎花', size: 'S', orderQty: 40, shippedQty: 0, thisShipQty: 40, unitPrice: 128, thisShipAmount: 5120 }, { styleNo: 'HT-001', color: '白色', size: 'M', orderQty: 150, shippedQty: 0, thisShipQty: 40, unitPrice: 35, thisShipAmount: 1400 }], totalItems: 80, totalAmount: 6520, notes: '' },
  { id: 's010', shipmentNo: 'SHP-2025-010', orderId: 'o013', orderNo: 'ORD-2025-013', customerId: 'c010', customerName: 'Luanda Apparel Trading', shipDate: '2025-07-12', warehouseId: 'wh2', warehouseName: '广州番禺仓', logisticsMethod: '海运', trackingNo: 'CMA-2025-55555', items: [{ styleNo: 'HW-001', color: '黑色', size: 'XL', orderQty: 60, shippedQty: 0, thisShipQty: 30, unitPrice: 110, thisShipAmount: 3300 }], totalItems: 30, totalAmount: 3300, notes: '部分发货' },
];

// ============ 收款记录 ============
export const payments: Payment[] = [
  { id: 'pay001', paymentNo: 'PAY-2025-001', customerId: 'c001', customerName: 'Lagos Fashion Hub Ltd', paymentDate: '2025-07-21', amount: 8000, method: '银行转账', relatedOrderId: 'o001', relatedOrderNo: 'ORD-2025-001', voucher: 'receipt_001.jpg', notes: '第一笔款' },
  { id: 'pay002', paymentNo: 'PAY-2025-002', customerId: 'c002', customerName: 'Accra Textile Trading Co', paymentDate: '2025-07-19', amount: 5000, method: '微信', relatedOrderId: 'o002', relatedOrderNo: 'ORD-2025-002', voucher: 'receipt_002.jpg', notes: '' },
  { id: 'pay003', paymentNo: 'PAY-2025-003', customerId: 'c003', customerName: 'Nairobi Garments Wholesale', paymentDate: '2025-07-22', amount: 20000, method: '银行转账', relatedOrderId: 'o003', relatedOrderNo: 'ORD-2025-003', voucher: 'receipt_003.jpg', notes: '多付部分计入预存' },
  { id: 'pay004', paymentNo: 'PAY-2025-004', customerId: 'c004', customerName: 'Dar Express Fashions', paymentDate: '2025-06-15', amount: 8000, method: '银行转账', relatedOrderId: 'o004', relatedOrderNo: 'ORD-2025-004', voucher: 'receipt_004.jpg', notes: '' },
  { id: 'pay005', paymentNo: 'PAY-2025-005', customerId: 'c005', customerName: 'Kampala Clothing Centre', paymentDate: '2025-07-16', amount: 6000, method: '支付宝', relatedOrderId: 'o005', relatedOrderNo: 'ORD-2025-005', voucher: '', notes: '' },
  { id: 'pay006', paymentNo: 'PAY-2025-006', customerId: 'c008', customerName: 'Cape Town Fashion Distributors', paymentDate: '2025-07-24', amount: 15000, method: '银行转账', relatedOrderId: 'o006', relatedOrderNo: 'ORD-2025-006', voucher: 'receipt_006.jpg', notes: '含预存' },
  { id: 'pay007', paymentNo: 'PAY-2025-007', customerId: 'c006', customerName: 'Douala Style Market', paymentDate: '2025-07-22', amount: 12000, method: '银行转账', relatedOrderId: 'o007', relatedOrderNo: 'ORD-2025-007', voucher: 'receipt_007.jpg', notes: '含预存' },
  { id: 'pay008', paymentNo: 'PAY-2025-008', customerId: 'c013', customerName: 'Ibadan Clothing Supplies', paymentDate: '2025-07-22', amount: 6000, method: '微信', relatedOrderId: 'o008', relatedOrderNo: 'ORD-2025-008', voucher: '', notes: '' },
  { id: 'pay009', paymentNo: 'PAY-2025-009', customerId: 'c020', customerName: 'Port Harcourt Textile Co', paymentDate: '2025-07-21', amount: 5000, method: '银行转账', relatedOrderId: 'o009', relatedOrderNo: 'ORD-2025-009', voucher: 'receipt_009.jpg', notes: '' },
  { id: 'pay010', paymentNo: 'PAY-2025-010', customerId: 'c007', customerName: 'Dakar Wholesale Group', paymentDate: '2025-07-20', amount: 3000, method: '现金', relatedOrderId: 'o011', relatedOrderNo: 'ORD-2025-011', voucher: '', notes: '' },
  { id: 'pay011', paymentNo: 'PAY-2025-011', customerId: 'c011', customerName: 'Mombasa Garments Ltd', paymentDate: '2025-07-18', amount: 4000, method: '银行转账', relatedOrderId: 'o012', relatedOrderNo: 'ORD-2025-012', voucher: 'receipt_011.jpg', notes: '' },
  { id: 'pay012', paymentNo: 'PAY-2025-012', customerId: 'c010', customerName: 'Luanda Apparel Trading', paymentDate: '2025-07-11', amount: 5000, method: '银行转账', relatedOrderId: 'o013', relatedOrderNo: 'ORD-2025-013', voucher: 'receipt_012.jpg', notes: '' },
  { id: 'pay013', paymentNo: 'PAY-2025-013', customerId: 'c015', customerName: 'Thies Wholesale Textiles', paymentDate: '2025-07-13', amount: 3000, method: '微信', relatedOrderId: 'o014', relatedOrderNo: 'ORD-2025-014', voucher: '', notes: '' },
  { id: 'pay014', paymentNo: 'PAY-2025-014', customerId: 'c017', customerName: 'Kisumu Apparel Traders', paymentDate: '2025-06-29', amount: 1000, method: '其他', relatedOrderId: 'o015', relatedOrderNo: 'ORD-2025-015', voucher: '', notes: '' },
  { id: 'pay015', paymentNo: 'PAY-2025-015', customerId: 'c009', customerName: 'Abidjan Textile Import', paymentDate: '2025-05-16', amount: 3000, method: '银行转账', relatedOrderId: 'o016', relatedOrderNo: 'ORD-2025-016', voucher: 'receipt_015.jpg', notes: '' },
  { id: 'pay016', paymentNo: 'PAY-2025-016', customerId: 'c018', customerName: 'Lome Garments Export', paymentDate: '2025-07-09', amount: 8800, method: '银行转账', relatedOrderId: 'o017', relatedOrderNo: 'ORD-2025-017', voucher: 'receipt_016.jpg', notes: '' },
  { id: 'pay017', paymentNo: 'PAY-2025-017', customerId: 'c012', customerName: 'Kumasi Fashion House', paymentDate: '2025-07-06', amount: 9140, method: '银行转账', relatedOrderId: 'o018', relatedOrderNo: 'ORD-2025-018', voucher: 'receipt_017.jpg', notes: '全额付清' },
  { id: 'pay018', paymentNo: 'PAY-2025-018', customerId: 'c014', customerName: 'Yaoundé Style Boutique', paymentDate: '2025-04-21', amount: 800, method: '微信', relatedOrderId: 'o019', relatedOrderNo: 'ORD-2025-019', voucher: '', notes: '' },
  { id: 'pay019', paymentNo: 'PAY-2025-019', customerId: 'c003', customerName: 'Nairobi Garments Wholesale', paymentDate: '2025-07-11', amount: 3960, method: '银行转账', relatedOrderId: 'o020', relatedOrderNo: 'ORD-2025-020', voucher: 'receipt_019.jpg', notes: '' },
  { id: 'pay020', paymentNo: 'PAY-2025-020', customerId: 'c008', customerName: 'Cape Town Fashion Distributors', paymentDate: '2025-07-16', amount: 5900, method: '银行转账', relatedOrderId: 'o021', relatedOrderNo: 'ORD-2025-021', voucher: 'receipt_020.jpg', notes: '' },
];

// ============ 工厂付款 ============
export const factoryPayments: FactoryPayment[] = [
  { id: 'fp001', paymentNo: 'FP-2025-001', factoryId: 'f001', factoryName: '广州新塘牛仔制衣厂', paymentDate: '2025-01-25', amount: 24000, method: '银行转账', relatedBatchId: 'pb001', relatedBatchNo: 'PB-2025-001', voucher: 'fp_voucher_001.jpg', notes: '' },
  { id: 'fp002', paymentNo: 'FP-2025-002', factoryId: 'f001', factoryName: '广州新塘牛仔制衣厂', paymentDate: '2025-02-01', amount: 12000, method: '银行转账', relatedBatchId: 'pb002', relatedBatchNo: 'PB-2025-002', voucher: 'fp_voucher_002.jpg', notes: '部分付款' },
  { id: 'fp003', paymentNo: 'FP-2025-003', factoryId: 'f002', factoryName: '东莞大朗毛织厂', paymentDate: '2025-03-10', amount: 17400, method: '银行转账', relatedBatchId: 'pb003', relatedBatchNo: 'PB-2025-003', voucher: '', notes: '' },
  { id: 'fp004', paymentNo: 'FP-2025-004', factoryId: 'f002', factoryName: '东莞大朗毛织厂', paymentDate: '2025-01-15', amount: 14400, method: '银行转账', relatedBatchId: 'pb004', relatedBatchNo: 'PB-2025-004', voucher: '', notes: '' },
  { id: 'fp005', paymentNo: 'FP-2025-005', factoryId: 'f003', factoryName: '佛山盐步服装厂', paymentDate: '2025-05-01', amount: 8000, method: '银行转账', relatedBatchId: 'pb005', relatedBatchNo: 'PB-2025-005', voucher: '', notes: '部分付款' },
  { id: 'fp006', paymentNo: 'FP-2025-006', factoryId: 'f004', factoryName: '中山沙溪外套厂', paymentDate: '2025-02-05', amount: 15750, method: '银行转账', relatedBatchId: 'pb006', relatedBatchNo: 'PB-2025-006', voucher: '', notes: '' },
  { id: 'fp007', paymentNo: 'FP-2025-007', factoryId: 'f005', factoryName: '汕头潮南针织厂', paymentDate: '2025-07-06', amount: 9600, method: '银行转账', relatedBatchId: 'pb009', relatedBatchNo: 'PB-2025-009', voucher: '', notes: '' },
  { id: 'fp008', paymentNo: 'FP-2025-008', factoryId: 'f003', factoryName: '佛山盐步服装厂', paymentDate: '2025-04-05', amount: 10000, method: '银行转账', relatedBatchId: 'pb010', relatedBatchNo: 'PB-2025-010', voucher: '', notes: '' },
  { id: 'fp009', paymentNo: 'FP-2025-009', factoryId: 'f005', factoryName: '汕头潮南针织厂', paymentDate: '2025-06-20', amount: 6000, method: '微信', relatedBatchId: 'pb011', relatedBatchNo: 'PB-2025-011', voucher: '', notes: '部分付款' },
  { id: 'fp010', paymentNo: 'FP-2025-010', factoryId: 'f004', factoryName: '中山沙溪外套厂', paymentDate: '2025-05-15', amount: 15360, method: '银行转账', relatedBatchId: 'pb013', relatedBatchNo: 'PB-2025-013', voucher: '', notes: '' },
];

// ============ 库存记录 ============
export const inventoryRecords: InventoryRecord[] = [
  { id: 'inv001', styleNo: 'HJ-001', productName: '经典直筒牛仔裤', color: '深蓝', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', actualStock: 200, reservedStock: 80, sellableStock: 120, status: '正常' },
  { id: 'inv002', styleNo: 'HJ-001', productName: '经典直筒牛仔裤', color: '深蓝', size: 'L', warehouseId: 'wh1', warehouseName: '广州白云仓', actualStock: 180, reservedStock: 50, sellableStock: 130, status: '正常' },
  { id: 'inv003', styleNo: 'HJ-001', productName: '经典直筒牛仔裤', color: '黑色', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', actualStock: 150, reservedStock: 120, sellableStock: 30, status: '偏低' },
  { id: 'inv004', styleNo: 'HT-001', productName: '纯色圆领T恤', color: '白色', size: 'M', warehouseId: 'wh2', warehouseName: '广州番禺仓', actualStock: 500, reservedStock: 150, sellableStock: 350, status: '充足' },
  { id: 'inv005', styleNo: 'HT-001', productName: '纯色圆领T恤', color: '黑色', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', actualStock: 300, reservedStock: 100, sellableStock: 200, status: '正常' },
  { id: 'inv006', styleNo: 'HL-002', productName: '修身针织连衣裙', color: '黑色', size: 'S', warehouseId: 'wh1', warehouseName: '广州白云仓', actualStock: 10, reservedStock: 10, sellableStock: 0, status: '缺货' },
  { id: 'inv007', styleNo: 'HW-002', productName: '圆领休闲卫衣', color: '白色', size: 'M', warehouseId: 'wh2', warehouseName: '广州番禺仓', actualStock: 20, reservedStock: 10, sellableStock: 10, status: '低库存' },
  { id: 'inv008', styleNo: 'HK-002', productName: '短款皮夹克', color: '黑色', size: 'M', warehouseId: 'wh3', warehouseName: '东莞虎门仓', actualStock: 15, reservedStock: 5, sellableStock: 10, status: '低库存' },
  { id: 'inv009', styleNo: 'HQ-002', productName: '百褶半裙', color: '灰色', size: 'S', warehouseId: 'wh1', warehouseName: '广州白云仓', actualStock: 10, reservedStock: 5, sellableStock: 5, status: '低库存' },
  { id: 'inv010', styleNo: 'HJ-004', productName: '弹力小脚牛仔裤', color: '深蓝', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', actualStock: 8, reservedStock: 5, sellableStock: 3, status: '低库存' },
  { id: 'inv011', styleNo: 'HJ-005', productName: '高腰喇叭牛仔裤', color: '深蓝', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', actualStock: 5, reservedStock: 3, sellableStock: 2, status: '低库存' },
  { id: 'inv012', styleNo: 'HW-001', productName: '加绒连帽卫衣', color: '灰色', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', actualStock: 200, reservedStock: 60, sellableStock: 140, status: '正常' },
  { id: 'inv013', styleNo: 'HK-001', productName: '中长款风衣外套', color: '卡其', size: 'L', warehouseId: 'wh3', warehouseName: '东莞虎门仓', actualStock: 100, reservedStock: 50, sellableStock: 50, status: '正常' },
  { id: 'inv014', styleNo: 'HL-001', productName: '碎花连衣裙', color: '蓝白碎花', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', actualStock: 80, reservedStock: 40, sellableStock: 40, status: '正常' },
  { id: 'inv015', styleNo: 'HT-003', productName: 'POLO领T恤', color: '白色', size: 'XL', warehouseId: 'wh2', warehouseName: '广州番禺仓', actualStock: 350, reservedStock: 100, sellableStock: 250, status: '充足' },
  { id: 'inv016', styleNo: 'HW-003', productName: '拉链卫衣', color: '灰色', size: 'XL', warehouseId: 'wh2', warehouseName: '广州番禺仓', actualStock: 150, reservedStock: 60, sellableStock: 90, status: '正常' },
  { id: 'inv017', styleNo: 'HK-004', productName: '飞行员夹克', color: '军绿', size: 'L', warehouseId: 'wh3', warehouseName: '东莞虎门仓', actualStock: 60, reservedStock: 50, sellableStock: 10, status: '低库存' },
  { id: 'inv018', styleNo: 'HQ-001', productName: '高腰A字半裙', color: '黑色', size: 'M', warehouseId: 'wh1', warehouseName: '广州白云仓', actualStock: 120, reservedStock: 30, sellableStock: 90, status: '正常' },
  { id: 'inv019', styleNo: 'HT-004', productName: '条纹长袖T恤', color: '蓝白条纹', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', actualStock: 280, reservedStock: 80, sellableStock: 200, status: '充足' },
  { id: 'inv020', styleNo: 'HT-006', productName: '字母印花T恤', color: '白色', size: 'L', warehouseId: 'wh2', warehouseName: '广州番禺仓', actualStock: 400, reservedStock: 100, sellableStock: 300, status: '充足' },
];

// ============ 库存流水 ============
export const inventoryFlows: InventoryFlow[] = [
  { id: 'if001', date: '2025-07-24', type: '库存预留', product: '飞行员夹克', styleNo: 'HK-004', warehouse: '东莞虎门仓', quantity: -50, beforeStock: 110, afterStock: 60, relatedDoc: 'ORD-2025-010', notes: '订单预留' },
  { id: 'if002', date: '2025-07-23', type: '销售出库', product: '加绒连帽卫衣', styleNo: 'HW-001', warehouse: '广州番禺仓', quantity: -80, beforeStock: 280, afterStock: 200, relatedDoc: 'SHP-2025-003', notes: '空运发货' },
  { id: 'if003', date: '2025-07-22', type: '生产入库', product: '飞行员夹克', styleNo: 'HK-004', warehouse: '东莞虎门仓', quantity: 100, beforeStock: 10, afterStock: 110, relatedDoc: 'PB-2025-007', notes: '工厂入库' },
  { id: 'if004', date: '2025-07-21', type: '销售出库', product: '经典直筒牛仔裤', styleNo: 'HJ-001', warehouse: '广州白云仓', quantity: -50, beforeStock: 230, afterStock: 180, relatedDoc: 'SHP-2025-001', notes: '海运发货' },
  { id: 'if005', date: '2025-07-20', type: '库存预留', product: '经典直筒牛仔裤', styleNo: 'HJ-001', warehouse: '广州白云仓', quantity: 0, beforeStock: 200, afterStock: 200, relatedDoc: 'ORD-2025-001', notes: '预留80件' },
  { id: 'if006', date: '2025-07-18', type: '销售出库', product: '碎花连衣裙', styleNo: 'HL-001', warehouse: '广州白云仓', quantity: -40, beforeStock: 120, afterStock: 80, relatedDoc: 'SHP-2025-009', notes: '' },
  { id: 'if007', date: '2025-07-15', type: '仓库调拨', product: '纯色圆领T恤', styleNo: 'HT-001', warehouse: '广州番禺仓', quantity: -50, beforeStock: 550, afterStock: 500, relatedDoc: 'TR-2025-001', notes: '调拨至白云仓' },
  { id: 'if008', date: '2025-07-12', type: '手工调整', product: '加绒连帽卫衣', styleNo: 'HW-001', warehouse: '广州番禺仓', quantity: -5, beforeStock: 285, afterStock: 280, relatedDoc: '', notes: '盘点差异调整' },
  { id: 'if009', date: '2025-07-10', type: '生产入库', product: '条纹长袖T恤', styleNo: 'HT-004', warehouse: '广州番禺仓', quantity: 400, beforeStock: 0, afterStock: 400, relatedDoc: 'PB-2025-009', notes: '' },
  { id: 'if010', date: '2025-07-08', type: '取消预留', product: '纯色圆领T恤', styleNo: 'HT-001', warehouse: '广州番禺仓', quantity: 0, beforeStock: 550, afterStock: 550, relatedDoc: 'ORD-2025-C01', notes: '取消订单释放预留' },
];

// ============ 客户往来账 ============
export const customerLedgers: Record<string, CustomerLedger[]> = {
  'c001': [
    { id: 'cl001', date: '2025-01-01', businessType: '期初余额', docNo: '', description: '期初余额', increaseReceivable: 0, receivedAmount: 0, balance: 45000, notes: '' },
    { id: 'cl002', date: '2025-07-20', businessType: '订单', docNo: 'ORD-2025-001', description: '订单创建', increaseReceivable: 15500, receivedAmount: 0, balance: 60500, notes: '' },
    { id: 'cl003', date: '2025-07-21', businessType: '发货', docNo: 'SHP-2025-001', description: '第一批发货', increaseReceivable: 0, receivedAmount: 0, balance: 60500, notes: '发货不增加应收' },
    { id: 'cl004', date: '2025-07-21', businessType: '收款', docNo: 'PAY-2025-001', description: '银行转账收款', increaseReceivable: 0, receivedAmount: 8000, balance: 52500, notes: '' },
  ],
  'c002': [
    { id: 'cl005', date: '2025-01-01', businessType: '期初余额', docNo: '', description: '期初余额', increaseReceivable: 0, receivedAmount: 0, balance: 35000, notes: '' },
    { id: 'cl006', date: '2025-07-18', businessType: '订单', docNo: 'ORD-2025-002', description: '订单创建', increaseReceivable: 14140, receivedAmount: 0, balance: 49140, notes: '' },
    { id: 'cl007', date: '2025-07-19', businessType: '收款', docNo: 'PAY-2025-002', description: '微信收款', increaseReceivable: 0, receivedAmount: 5000, balance: 44140, notes: '' },
  ],
};

// ============ 月度销售数据（用于图表）============
export const monthlySalesData = [
  { month: '2月', sales: 198000, cost: 108000, profit: 90000 },
  { month: '3月', sales: 235000, cost: 128000, profit: 107000 },
  { month: '4月', sales: 212000, cost: 115000, profit: 97000 },
  { month: '5月', sales: 258000, cost: 140000, profit: 118000 },
  { month: '6月', sales: 275000, cost: 150000, profit: 125000 },
  { month: '7月', sales: 286500, cost: 155000, profit: 82300 },
];

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
    '已结清': 'bg-green-100 text-green-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}
