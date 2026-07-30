import type {
  Customer,
  CustomerLedger,
  Factory,
  FactoryPayment,
  InventoryFlow,
  InventoryRecord,
  Order,
  Payment,
  Product,
  ProductionBatch,
  Shipment,
  Warehouse,
} from '@/lib/mock-data';

export const BUSINESS_STORAGE_KEY = 'helen-crm-business-state';
export const BUSINESS_STORAGE_VERSION = 1;

export interface InventoryReservation {
  id: string;
  orderId: string;
  orderItemId: string;
  customerId: string;
  warehouseId: string;
  styleNo: string;
  color: string;
  size: string;
  reservedQuantity: number;
  shippedQuantity: number;
  releasedQuantity: number;
  status: '有效' | '部分履行' | '已履行' | '已释放';
  reservedAt: string;
  releasedAt: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
}

export interface DepositApplication {
  id: string;
  applicationNo: string;
  customerId: string;
  customerName: string;
  orderId: string;
  orderNo: string;
  applicationDate: string;
  amount: number;
  notes: string;
  createdAt: string;
}

export interface BusinessState {
  storageVersion: number;
  customers: Customer[];
  products: Product[];
  warehouses: Warehouse[];
  factories: Factory[];
  productionBatches: ProductionBatch[];
  factoryPayments: FactoryPayment[];
  inventoryRecords: InventoryRecord[];
  inventoryFlows: InventoryFlow[];
  inventoryReservations: InventoryReservation[];
  orders: Order[];
  shipments: Shipment[];
  payments: Payment[];
  paymentAllocations: PaymentAllocation[];
  depositApplications: DepositApplication[];
  customerLedgers: Record<string, CustomerLedger[]>;
}

export interface CustomerInput {
  name: string;
  country: string;
  city: string;
  whatsapp: string;
  frequentCategories: string[];
  commonSizes?: string[];
  notes: string;
}

export interface OrderItemInput {
  productId: string;
  styleNo: string;
  productName: string;
  color: string;
  size: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderCommand {
  customerId: string;
  orderDate: string;
  items: OrderItemInput[];
  notes: string;
  confirm: boolean;
  depositDeduction: number;
}

export interface CreateShipmentCommand {
  orderId: string;
  shipDate: string;
  logisticsMethod: string;
  trackingNo: string;
  notes: string;
  items: Array<{
    orderItemId: string;
    quantity: number;
  }>;
}

export interface CreatePaymentCommand {
  customerId: string;
  paymentDate: string;
  amount: number;
  method: Payment['method'];
  relatedOrderId: string;
  voucher: string;
  notes: string;
}

export interface ApplyDepositCommand {
  customerId: string;
  orderId: string;
  applicationDate: string;
  amount: number;
  notes: string;
}

export interface TransferStockCommand {
  fromWarehouseId: string;
  toWarehouseId: string;
  styleNo: string;
  color: string;
  size: string;
  quantity: number;
  date: string;
  notes: string;
}

export interface FactoryInput {
  name: string;
  contact: string;
  phone: string;
  mainCategory: string;
  address: string;
  notes: string;
}

export interface CreateProductionBatchCommand {
  factoryId: string;
  productId: string;
  color: string;
  size: string;
  quantity: number;
  unitCost: number;
  inboundWarehouseId: string;
  startDate: string;
  notes: string;
}

export interface CreateFactoryPaymentCommand {
  factoryId: string;
  batchId: string;
  paymentDate: string;
  amount: number;
  method: FactoryPayment['method'];
  voucher: string;
  notes: string;
}

export interface BusinessOperationResult {
  ok: boolean;
  id?: string;
  error?: string;
}
