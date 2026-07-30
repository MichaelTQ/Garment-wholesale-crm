import {
  calcInventoryStatus,
  calculateSellableStock,
  findInventoryIndex,
} from '@/lib/services/inventory';
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
  Shipment,
} from '@/lib/mock-data';
import type {
  BusinessState,
  CreateFactoryPaymentCommand,
  CreateOrderCommand,
  CreatePaymentCommand,
  CreateProductionBatchCommand,
  CreateShipmentCommand,
  CustomerInput,
  FactoryInput,
  InventoryReservation,
  PaymentAllocation,
  TransferStockCommand,
} from '@/lib/types/business';

const ACTIVE_ORDER_STATUSES: Order['status'][] = [
  '已确认',
  '部分发货',
  '已全部发货',
  '已完成',
];

export function createBusinessId(prefix: string): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replaceAll('-', '').slice(0, 12)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  return `${prefix}-${randomPart}`;
}

export function createDocumentNo(prefix: string, date: string, sequence: number): string {
  const compactDate = date.replaceAll('-', '') || '00000000';
  return `${prefix}-${compactDate}-${String(sequence + 1).padStart(3, '0')}`;
}

function cloneState(state: BusinessState): BusinessState {
  return {
    ...state,
    customers: state.customers.map((item) => ({ ...item, categories: [...item.categories], frequentCategories: [...item.frequentCategories], commonSizes: [...item.commonSizes] })),
    products: state.products.map((item) => ({ ...item, colors: item.colors.map((color) => ({ ...color })), sizes: [...item.sizes], images: [...item.images] })),
    warehouses: state.warehouses.map((item) => ({ ...item })),
    factories: state.factories.map((item) => ({ ...item })),
    productionBatches: state.productionBatches.map((item) => ({ ...item })),
    factoryPayments: state.factoryPayments.map((item) => ({ ...item })),
    inventoryRecords: state.inventoryRecords.map((item) => ({ ...item })),
    inventoryFlows: state.inventoryFlows.map((item) => ({ ...item })),
    inventoryReservations: state.inventoryReservations.map((item) => ({ ...item })),
    orders: state.orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({ ...item })),
    })),
    shipments: state.shipments.map((shipment) => ({
      ...shipment,
      items: shipment.items.map((item) => ({ ...item })),
    })),
    payments: state.payments.map((item) => ({ ...item })),
    paymentAllocations: state.paymentAllocations.map((item) => ({ ...item })),
    customerLedgers: Object.fromEntries(
      Object.entries(state.customerLedgers).map(([customerId, entries]) => [
        customerId,
        entries.map((entry) => ({ ...entry })),
      ]),
    ),
  };
}

function shipmentValueForOrder(order: Order): number {
  return order.items.reduce(
    (sum, item) => sum + item.shippedQuantity * item.unitPrice,
    0,
  );
}

function deriveOrder(order: Order): Order {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const shippedQuantity = order.items.reduce((sum, item) => sum + item.shippedQuantity, 0);
  const totalAmount = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const paidAmount = Math.min(totalAmount, Math.max(0, order.paidAmount));
  const unpaidAmount = Math.max(0, totalAmount - paidAmount);
  let status = order.status;

  if (!['草稿', '待确认', '已取消'].includes(status)) {
    if (shippedQuantity === 0) status = '已确认';
    else if (shippedQuantity < totalQuantity) status = '部分发货';
    else if (unpaidAmount === 0) status = '已完成';
    else status = '已全部发货';
  }

  return {
    ...order,
    totalQuantity,
    totalAmount,
    paidAmount,
    unpaidAmount,
    shippedQuantity,
    pendingShipQuantity: Math.max(0, totalQuantity - shippedQuantity),
    finalReceivable: Math.max(0, totalAmount - order.presaveDeduction),
    status,
  };
}

function deriveCustomer(customer: Customer, orders: Order[], payments: Payment[]): Customer {
  const activeOrders = orders.filter(
    (order) =>
      order.customerId === customer.id &&
      ACTIVE_ORDER_STATUSES.includes(order.status),
  );
  const customerPayments = payments.filter((payment) => payment.customerId === customer.id);
  const totalSales = activeOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const orderReceivable = activeOrders.reduce((sum, order) => sum + order.unpaidAmount, 0);
  const shippedDebt = activeOrders.reduce(
    (sum, order) => sum + Math.max(0, shipmentValueForOrder(order) - order.paidAmount),
    0,
  );
  const pendingShipQty = activeOrders.reduce(
    (sum, order) => sum + order.pendingShipQuantity,
    0,
  );
  const purchaseDates = activeOrders.map((order) => order.orderDate).filter(Boolean).sort();
  const paymentDates = customerPayments.map((payment) => payment.paymentDate).filter(Boolean).sort();
  const lastPurchaseDate = purchaseDates.at(-1) ?? '';
  const lastPaymentDate = paymentDates.at(-1) ?? '';
  const status: Customer['status'] =
    shippedDebt > 0
      ? '有欠款'
      : customer.presaveBalance > 0
        ? '有预存款'
        : activeOrders.length > 0
          ? '活跃'
          : '一般';

  return {
    ...customer,
    lastPurchaseDate,
    totalSales,
    orderReceivable,
    shippedDebt,
    preDeposit: customer.presaveBalance,
    lastPaymentDate,
    pendingShipQty,
    avgOrderAmount: activeOrders.length > 0 ? totalSales / activeOrders.length : 0,
    purchaseFrequency: activeOrders.length > 1 ? `${activeOrders.length}次` : activeOrders.length === 1 ? '首次购买' : '',
    status,
  };
}

export function deriveBusinessState(state: BusinessState): BusinessState {
  const orders = state.orders.map(deriveOrder);
  const inventoryRecords = state.inventoryRecords.map((record) => ({
    ...record,
    sellableStock: calculateSellableStock(record.actualStock, record.reservedStock),
    status: calcInventoryStatus(record.actualStock),
  }));
  const products = state.products.map((product) => {
    const currentStock = inventoryRecords
      .filter((record) => record.styleNo === product.styleNo)
      .reduce((sum, record) => sum + record.actualStock, 0);
    const latestBatch = state.productionBatches
      .filter((batch) => batch.styleNo === product.styleNo)
      .sort((left, right) => right.inboundDate.localeCompare(left.inboundDate))[0];
    return { ...product, currentStock, lastCost: latestBatch?.unitCost ?? product.lastCost };
  });
  const customers = state.customers.map((customer) =>
    deriveCustomer(customer, orders, state.payments),
  );
  const factories = state.factories.map((factory) => {
    const batches = state.productionBatches.filter((batch) => batch.factoryId === factory.id);
    const cooperationDates = batches.map((batch) => batch.inboundDate).filter(Boolean).sort();
    return {
      ...factory,
      totalProductionAmount: batches.reduce((sum, batch) => sum + batch.totalCost, 0),
      paidAmount: batches.reduce((sum, batch) => sum + batch.paidAmount, 0),
      unpaidAmount: batches.reduce((sum, batch) => sum + batch.unpaidAmount, 0),
      lastCoopDate: cooperationDates.at(-1) ?? factory.lastCoopDate,
    };
  });
  return { ...state, orders, inventoryRecords, products, customers, factories };
}

function appendLedger(
  state: BusinessState,
  customerId: string,
  entry: Omit<CustomerLedger, 'id' | 'balance' | 'depositBalance'>,
): void {
  const customer = state.customers.find((item) => item.id === customerId);
  const currentEntries = state.customerLedgers[customerId] ?? [];
  state.customerLedgers[customerId] = [
    {
      ...entry,
      id: createBusinessId('ledger'),
      balance: customer?.orderReceivable ?? 0,
      depositBalance: customer?.presaveBalance ?? 0,
    },
    ...currentEntries,
  ];
}

export function addCustomerTransaction(
  state: BusinessState,
  input: CustomerInput,
  createdAt: string,
): BusinessState {
  const name = input.name.trim();
  if (!name) throw new Error('请输入客户名称');
  if (!input.country.trim()) throw new Error('请输入国家');
  if (!input.whatsapp.trim()) throw new Error('请输入 WhatsApp 号码');

  const customer: Customer = {
    id: createBusinessId('cus'),
    name,
    country: input.country.trim(),
    city: input.city.trim(),
    whatsapp: input.whatsapp.trim(),
    categories: [...input.frequentCategories],
    frequentCategories: [...input.frequentCategories],
    lastPurchaseDate: '',
    totalSales: 0,
    orderReceivable: 0,
    shippedDebt: 0,
    presaveBalance: 0,
    preDeposit: 0,
    lastPaymentDate: '',
    pendingShipQty: 0,
    status: '一般',
    commonSizes: [...(input.commonSizes ?? [])],
    avgOrderAmount: 0,
    purchaseFrequency: '',
    notes: input.notes.trim(),
    createdAt,
  };
  return {
    ...state,
    customers: [...state.customers, customer],
    customerLedgers: { ...state.customerLedgers, [customer.id]: [] },
  };
}

export function addProductTransaction(state: BusinessState, product: Product): BusinessState {
  if (
    state.products.some(
      (item) => item.styleNo.trim().toLowerCase() === product.styleNo.trim().toLowerCase(),
    )
  ) {
    throw new Error('该款号已经存在');
  }
  return deriveBusinessState({ ...state, products: [...state.products, product] });
}

export function addFactoryTransaction(
  state: BusinessState,
  input: FactoryInput,
): BusinessState {
  if (!input.name.trim()) throw new Error('请输入工厂名称');
  if (state.factories.some((factory) => factory.name.trim() === input.name.trim())) {
    throw new Error('该工厂名称已经存在');
  }
  const factory: Factory = {
    id: createBusinessId('fac'),
    name: input.name.trim(),
    contact: input.contact.trim(),
    phone: input.phone.trim(),
    mainCategory: input.mainCategory.trim(),
    totalProductionAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    lastCoopDate: '',
    address: input.address.trim(),
    notes: input.notes.trim(),
  };
  return deriveBusinessState({ ...state, factories: [...state.factories, factory] });
}

export function createProductionBatchTransaction(
  state: BusinessState,
  command: CreateProductionBatchCommand,
): BusinessState {
  const factory = state.factories.find((item) => item.id === command.factoryId);
  const product = state.products.find((item) => item.id === command.productId);
  const warehouse = state.warehouses.find((item) => item.id === command.inboundWarehouseId);
  if (!factory) throw new Error('请选择有效工厂');
  if (!product) throw new Error('请选择有效商品');
  if (!product.colors.some((color) => color.name === command.color)) throw new Error('请选择有效颜色');
  if (!product.sizes.includes(command.size)) throw new Error('请选择有效尺码');
  if (!warehouse) throw new Error('请选择计划入库仓库');
  if (!Number.isInteger(command.quantity) || command.quantity <= 0) {
    throw new Error('生产数量必须为正整数');
  }
  if (!Number.isFinite(command.unitCost) || command.unitCost < 0) {
    throw new Error('单件成本不能为负数');
  }
  if (!command.startDate) throw new Error('请选择生产日期');
  const totalCost = command.quantity * command.unitCost;
  const batchNo = createDocumentNo('PB', command.startDate, state.productionBatches.length);
  const batch = {
    id: createBusinessId('batch'),
    batchNo,
    factoryId: factory.id,
    factoryName: factory.name,
    productId: product.id,
    styleNo: product.styleNo,
    productName: product.name,
    color: command.color,
    size: command.size,
    quantity: command.quantity,
    unitCost: command.unitCost,
    totalCost,
    inboundWarehouseId: warehouse.id,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    inboundDate: '',
    startDate: command.startDate,
    notes: command.notes.trim(),
    inboundQuantity: 0,
    paidAmount: 0,
    unpaidAmount: totalCost,
    status: '待入库' as const,
  };
  return deriveBusinessState({
    ...state,
    productionBatches: [batch, ...state.productionBatches],
  });
}

export function createFactoryPaymentTransaction(
  state: BusinessState,
  command: CreateFactoryPaymentCommand,
  createdAt: string,
): BusinessState {
  const next = cloneState(state);
  const factory = next.factories.find((item) => item.id === command.factoryId);
  const batch = next.productionBatches.find(
    (item) => item.id === command.batchId && item.factoryId === command.factoryId,
  );
  if (!factory) throw new Error('请选择有效工厂');
  if (!batch) throw new Error('请选择该工厂的生产批次');
  if (!Number.isFinite(command.amount) || command.amount <= 0) {
    throw new Error('付款金额必须大于 0');
  }
  if (command.amount > batch.unpaidAmount) {
    throw new Error(`付款金额不能超过批次未付金额 ${batch.unpaidAmount}`);
  }
  batch.paidAmount += command.amount;
  batch.unpaidAmount = Math.max(0, batch.totalCost - batch.paidAmount);
  if (batch.unpaidAmount === 0 && batch.inboundQuantity >= batch.quantity) {
    batch.status = '已结清';
  }
  const payment: FactoryPayment = {
    id: createBusinessId('fpay'),
    paymentNo: createDocumentNo('FPAY', command.paymentDate, next.factoryPayments.length),
    factoryId: factory.id,
    factoryName: factory.name,
    paymentDate: command.paymentDate,
    amount: command.amount,
    method: command.method,
    relatedBatchId: batch.id,
    relatedBatchNo: batch.batchNo,
    voucher: command.voucher.trim(),
    notes: command.notes.trim() || `登记于 ${createdAt.slice(0, 10)}`,
  };
  next.factoryPayments.unshift(payment);
  return deriveBusinessState(next);
}

function inventoryRecordForOrderItem(
  state: BusinessState,
  item: CreateOrderCommand['items'][number],
): InventoryRecord | undefined {
  return state.inventoryRecords.find(
    (record) =>
      record.warehouseId === item.warehouseId &&
      record.styleNo === item.styleNo &&
      record.color === item.color &&
      record.size === item.size,
  );
}

function validateOrderCommand(state: BusinessState, command: CreateOrderCommand): void {
  if (!state.customers.some((customer) => customer.id === command.customerId)) {
    throw new Error('请选择有效客户');
  }
  if (command.items.length === 0) throw new Error('请至少添加一件商品');

  const requestedByStock = new Map<string, number>();
  for (const item of command.items) {
    if (!item.productId || !item.styleNo || !item.color || !item.size || !item.warehouseId) {
      throw new Error('请完整选择每行的款号、颜色、尺码和仓库');
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('订单数量必须为正整数');
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      throw new Error('销售单价不能为负数');
    }
    if (command.confirm) {
      const stock = inventoryRecordForOrderItem(state, item);
      const stockKey = `${item.warehouseId}|${item.styleNo}|${item.color}|${item.size}`;
      const requested = (requestedByStock.get(stockKey) ?? 0) + item.quantity;
      requestedByStock.set(stockKey, requested);
      if (!stock || stock.sellableStock < requested) {
        throw new Error(
          `${item.styleNo} ${item.color}/${item.size} 在${item.warehouseName}可销售库存不足`,
        );
      }
    }
  }
}

export function createOrderTransaction(
  state: BusinessState,
  command: CreateOrderCommand,
  createdAt: string,
): { state: BusinessState; orderId: string } {
  validateOrderCommand(state, command);
  const next = cloneState(state);
  const customerIndex = next.customers.findIndex((item) => item.id === command.customerId);
  const customer = next.customers[customerIndex];
  const orderId = createBusinessId('ord');
  const totalAmount = command.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const depositDeduction = command.confirm
    ? Math.min(
      Math.max(0, command.depositDeduction),
      customer.presaveBalance,
      totalAmount,
    )
    : 0;
  const orderNo = createDocumentNo('ORD', command.orderDate, next.orders.length);
  const items: Order['items'] = command.items.map((item) => ({
    id: createBusinessId('oi'),
    productId: item.productId,
    styleNo: item.styleNo,
    productName: item.productName,
    color: item.color,
    size: item.size,
    warehouseId: item.warehouseId,
    warehouseName: item.warehouseName,
    availableStock: inventoryRecordForOrderItem(next, item)?.sellableStock ?? 0,
    quantity: item.quantity,
    shippedQuantity: 0,
    unitPrice: item.unitPrice,
    subtotal: item.quantity * item.unitPrice,
  }));
  const order: Order = {
    id: orderId,
    orderNo,
    customerId: customer.id,
    customerName: customer.name,
    country: customer.country,
    orderDate: command.orderDate,
    items,
    totalAmount,
    paidAmount: depositDeduction,
    unpaidAmount: totalAmount - depositDeduction,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    shippedQuantity: 0,
    pendingShipQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    status: command.confirm ? '已确认' : '草稿',
    presaveDeduction: depositDeduction,
    finalReceivable: totalAmount - depositDeduction,
    notes: command.notes.trim(),
    createdAt,
    updatedAt: createdAt,
  };
  next.orders.push(order);

  if (command.confirm) {
    for (const item of items) {
      const recordIndex = findInventoryIndex(next.inventoryRecords, {
        styleNo: item.styleNo,
        color: item.color,
        size: item.size,
        warehouseId: item.warehouseId,
      });
      const record = next.inventoryRecords[recordIndex];
      const beforeReserved = record.reservedStock;
      record.reservedStock += item.quantity;
      record.sellableStock = calculateSellableStock(record.actualStock, record.reservedStock);
      const reservation: InventoryReservation = {
        id: createBusinessId('res'),
        orderId,
        orderItemId: item.id,
        customerId: customer.id,
        warehouseId: item.warehouseId,
        styleNo: item.styleNo,
        color: item.color,
        size: item.size,
        reservedQuantity: item.quantity,
        shippedQuantity: 0,
        releasedQuantity: 0,
        status: '有效',
        reservedAt: createdAt,
        releasedAt: '',
      };
      next.inventoryReservations.push(reservation);
      next.inventoryFlows.unshift({
        id: createBusinessId('if'),
        date: command.orderDate,
        type: '库存预留',
        product: item.productName,
        styleNo: item.styleNo,
        color: item.color,
        size: item.size,
        warehouse: item.warehouseName,
        quantity: item.quantity,
        beforeStock: beforeReserved,
        afterStock: record.reservedStock,
        relatedDoc: orderNo,
        notes: '订单确认，增加预留库存',
      });
    }
    customer.presaveBalance -= depositDeduction;
  }

  const derived = deriveBusinessState(next);
  if (command.confirm) {
    appendLedger(derived, customer.id, {
      date: command.orderDate,
      businessType: '订单',
      docNo: orderNo,
      description: `确认销售订单 ${orderNo}`,
      increaseReceivable: totalAmount,
      receivedAmount: depositDeduction,
      depositChange: -depositDeduction,
      notes: command.notes.trim(),
    });
  }
  return { state: deriveBusinessState(derived), orderId };
}

export function confirmOrderTransaction(
  state: BusinessState,
  orderId: string,
  confirmedAt: string,
): BusinessState {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order || order.status !== '草稿') throw new Error('只有草稿订单可以确认');
  const command: CreateOrderCommand = {
    customerId: order.customerId,
    orderDate: order.orderDate,
    items: order.items.map((item) => ({
      productId: item.productId,
      styleNo: item.styleNo,
      productName: item.productName,
      color: item.color,
      size: item.size,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouseName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    notes: order.notes,
    confirm: true,
    depositDeduction: 0,
  };
  validateOrderCommand(state, command);
  const next = cloneState(state);
  const target = next.orders.find((item) => item.id === orderId);
  if (!target) throw new Error('订单不存在');
  target.status = '已确认';
  target.updatedAt = confirmedAt;
  for (const item of target.items) {
    const recordIndex = findInventoryIndex(next.inventoryRecords, {
      styleNo: item.styleNo,
      color: item.color,
      size: item.size,
      warehouseId: item.warehouseId,
    });
    const record = next.inventoryRecords[recordIndex];
    const beforeReserved = record.reservedStock;
    record.reservedStock += item.quantity;
    next.inventoryReservations.push({
      id: createBusinessId('res'),
      orderId,
      orderItemId: item.id,
      customerId: target.customerId,
      warehouseId: item.warehouseId,
      styleNo: item.styleNo,
      color: item.color,
      size: item.size,
      reservedQuantity: item.quantity,
      shippedQuantity: 0,
      releasedQuantity: 0,
      status: '有效',
      reservedAt: confirmedAt,
      releasedAt: '',
    });
    next.inventoryFlows.unshift({
      id: createBusinessId('if'),
      date: confirmedAt.slice(0, 10),
      type: '库存预留',
      product: item.productName,
      styleNo: item.styleNo,
      color: item.color,
      size: item.size,
      warehouse: item.warehouseName,
      quantity: item.quantity,
      beforeStock: beforeReserved,
      afterStock: record.reservedStock,
      relatedDoc: target.orderNo,
      notes: '草稿订单确认，增加预留库存',
    });
  }
  const derived = deriveBusinessState(next);
  appendLedger(derived, target.customerId, {
    date: confirmedAt.slice(0, 10),
    businessType: '订单',
    docNo: target.orderNo,
    description: `确认销售订单 ${target.orderNo}`,
    increaseReceivable: target.totalAmount,
    receivedAmount: 0,
    depositChange: 0,
    notes: target.notes,
  });
  return deriveBusinessState(derived);
}

export function cancelOrderTransaction(
  state: BusinessState,
  orderId: string,
  cancelledAt: string,
): BusinessState {
  const next = cloneState(state);
  const order = next.orders.find((item) => item.id === orderId);
  if (!order || !['草稿', '已确认'].includes(order.status)) {
    throw new Error('只有草稿或尚未发货的已确认订单可以取消');
  }
  if (order.shippedQuantity > 0) throw new Error('已有发货记录的订单不能直接取消');
  if (order.paidAmount > order.presaveDeduction) {
    throw new Error('订单已有客户收款，请先处理收款分配后再取消');
  }
  const wasConfirmed = order.status === '已确认';
  if (wasConfirmed) {
    for (const item of order.items) {
      const remaining = item.quantity - item.shippedQuantity;
      const record = next.inventoryRecords.find(
        (stock) =>
          stock.warehouseId === item.warehouseId &&
          stock.styleNo === item.styleNo &&
          stock.color === item.color &&
          stock.size === item.size,
      );
      if (!record) continue;
      const beforeReserved = record.reservedStock;
      record.reservedStock = Math.max(0, record.reservedStock - remaining);
      record.sellableStock = calculateSellableStock(record.actualStock, record.reservedStock);
      const reservation = next.inventoryReservations.find(
        (entry) => entry.orderItemId === item.id && entry.status !== '已释放',
      );
      if (reservation) {
        reservation.releasedQuantity += remaining;
        reservation.status = '已释放';
        reservation.releasedAt = cancelledAt;
      }
      next.inventoryFlows.unshift({
        id: createBusinessId('if'),
        date: cancelledAt.slice(0, 10),
        type: '取消预留',
        product: item.productName,
        styleNo: item.styleNo,
        color: item.color,
        size: item.size,
        warehouse: item.warehouseName,
        quantity: -remaining,
        beforeStock: beforeReserved,
        afterStock: record.reservedStock,
        relatedDoc: order.orderNo,
        notes: '订单取消，释放未发货预留库存',
      });
    }
    const customer = next.customers.find((item) => item.id === order.customerId);
    if (customer && order.presaveDeduction > 0) {
      customer.presaveBalance += order.presaveDeduction;
    }
  }
  order.status = '已取消';
  order.updatedAt = cancelledAt;
  const derived = deriveBusinessState(next);
  if (wasConfirmed) {
    appendLedger(derived, order.customerId, {
      date: cancelledAt.slice(0, 10),
      businessType: '余额调整',
      docNo: order.orderNo,
      description: `取消销售订单 ${order.orderNo}`,
      increaseReceivable: -order.totalAmount,
      receivedAmount: 0,
      depositChange: order.presaveDeduction,
      notes:
        order.presaveDeduction > 0
          ? `订单取消，应收不再计入客户汇总；退回预存款 ${order.presaveDeduction}`
          : '订单取消，应收不再计入客户汇总',
    });
  }
  return deriveBusinessState(derived);
}

export function createShipmentTransaction(
  state: BusinessState,
  command: CreateShipmentCommand,
  createdAt: string,
): { state: BusinessState; shipmentId: string } {
  const next = cloneState(state);
  const order = next.orders.find((item) => item.id === command.orderId);
  if (!order || !['已确认', '部分发货'].includes(order.status)) {
    throw new Error('该订单当前不可发货');
  }
  const positiveItems = command.items.filter((item) => item.quantity > 0);
  if (positiveItems.length === 0) throw new Error('请填写至少一行本次发货数量');
  if (new Set(positiveItems.map((item) => item.orderItemId)).size !== positiveItems.length) {
    throw new Error('同一订单明细不能重复填写发货数量');
  }

  for (const input of positiveItems) {
    if (!Number.isInteger(input.quantity)) throw new Error('发货数量必须为整数');
    const orderItem = order.items.find((item) => item.id === input.orderItemId);
    if (!orderItem) throw new Error('订单明细不存在');
    const remaining = orderItem.quantity - orderItem.shippedQuantity;
    if (input.quantity > remaining) {
      throw new Error(`${orderItem.styleNo} 本次发货不能超过待发数量 ${remaining}`);
    }
    const stock = next.inventoryRecords.find(
      (record) =>
        record.warehouseId === orderItem.warehouseId &&
        record.styleNo === orderItem.styleNo &&
        record.color === orderItem.color &&
        record.size === orderItem.size,
    );
    if (!stock || stock.actualStock < input.quantity || stock.reservedStock < input.quantity) {
      throw new Error(`${orderItem.styleNo} 对应仓库库存或预留数量不足`);
    }
  }

  const shipmentId = createBusinessId('ship');
  const shipmentNo = createDocumentNo('SHP', command.shipDate, next.shipments.length);
  const shipmentItems: Shipment['items'] = [];
  const warehouseIds = new Set<string>();
  const warehouseNames = new Set<string>();

  for (const input of positiveItems) {
    const orderItem = order.items.find((item) => item.id === input.orderItemId);
    if (!orderItem) continue;
    const stock = next.inventoryRecords.find(
      (record) =>
        record.warehouseId === orderItem.warehouseId &&
        record.styleNo === orderItem.styleNo &&
        record.color === orderItem.color &&
        record.size === orderItem.size,
    );
    if (!stock) continue;
    const beforeStock = stock.actualStock;
    stock.actualStock -= input.quantity;
    stock.reservedStock -= input.quantity;
    stock.sellableStock = calculateSellableStock(stock.actualStock, stock.reservedStock);
    stock.status = calcInventoryStatus(stock.actualStock);
    orderItem.shippedQuantity += input.quantity;
    warehouseIds.add(orderItem.warehouseId);
    warehouseNames.add(orderItem.warehouseName);

    const reservation = next.inventoryReservations.find(
      (item) => item.orderItemId === orderItem.id && item.status !== '已释放',
    );
    if (reservation) {
      reservation.shippedQuantity += input.quantity;
      reservation.status =
        reservation.shippedQuantity >= reservation.reservedQuantity
          ? '已履行'
          : '部分履行';
    }
    shipmentItems.push({
      orderItemId: orderItem.id,
      styleNo: orderItem.styleNo,
      color: orderItem.color,
      size: orderItem.size,
      orderQty: orderItem.quantity,
      shippedQty: orderItem.shippedQuantity,
      thisShipQty: input.quantity,
      unitPrice: orderItem.unitPrice,
      thisShipAmount: input.quantity * orderItem.unitPrice,
    });
    next.inventoryFlows.unshift({
      id: createBusinessId('if'),
      date: command.shipDate,
      type: '销售出库',
      product: orderItem.productName,
      styleNo: orderItem.styleNo,
      color: orderItem.color,
      size: orderItem.size,
      warehouse: orderItem.warehouseName,
      quantity: -input.quantity,
      beforeStock,
      afterStock: stock.actualStock,
      relatedDoc: shipmentNo,
      notes: `订单 ${order.orderNo} 发货，实际库存和预留库存同步减少`,
    });
  }

  const shipment: Shipment = {
    id: shipmentId,
    shipmentNo,
    orderId: order.id,
    orderNo: order.orderNo,
    customerId: order.customerId,
    customerName: order.customerName,
    shipDate: command.shipDate,
    warehouseId: warehouseIds.size === 1 ? [...warehouseIds][0] : 'multiple',
    warehouseName: warehouseNames.size === 1 ? [...warehouseNames][0] : '多仓库',
    logisticsMethod: command.logisticsMethod,
    trackingNo: command.trackingNo.trim(),
    items: shipmentItems,
    totalItems: shipmentItems.reduce((sum, item) => sum + item.thisShipQty, 0),
    totalAmount: shipmentItems.reduce((sum, item) => sum + item.thisShipAmount, 0),
    notes: command.notes.trim(),
  };
  next.shipments.unshift(shipment);
  order.updatedAt = createdAt;
  const derived = deriveBusinessState(next);
  appendLedger(derived, order.customerId, {
    date: command.shipDate,
    businessType: '发货',
    docNo: shipmentNo,
    description: `销售订单 ${order.orderNo} 发货`,
    increaseReceivable: 0,
    receivedAmount: 0,
    depositChange: 0,
    notes: command.notes.trim(),
  });
  return { state: deriveBusinessState(derived), shipmentId };
}

export function createPaymentTransaction(
  state: BusinessState,
  command: CreatePaymentCommand,
  createdAt: string,
): { state: BusinessState; paymentId: string } {
  if (!Number.isFinite(command.amount) || command.amount <= 0) {
    throw new Error('收款金额必须大于 0');
  }
  const next = cloneState(state);
  const customer = next.customers.find((item) => item.id === command.customerId);
  if (!customer) throw new Error('请选择有效客户');
  const paymentId = createBusinessId('pay');
  const paymentNo = createDocumentNo('PAY', command.paymentDate, next.payments.length);
  const unpaidOrders = next.orders
    .filter(
      (order) =>
        order.customerId === customer.id &&
        ACTIVE_ORDER_STATUSES.includes(order.status) &&
        order.unpaidAmount > 0,
    )
    .sort((a, b) => a.orderDate.localeCompare(b.orderDate));
  if (command.relatedOrderId) {
    unpaidOrders.sort((a, b) => {
      if (a.id === command.relatedOrderId) return -1;
      if (b.id === command.relatedOrderId) return 1;
      return a.orderDate.localeCompare(b.orderDate);
    });
  }

  let remaining = command.amount;
  const allocations: PaymentAllocation[] = [];
  for (const order of unpaidOrders) {
    if (remaining <= 0) break;
    const allocatedAmount = Math.min(remaining, order.unpaidAmount);
    if (allocatedAmount <= 0) continue;
    order.paidAmount += allocatedAmount;
    remaining -= allocatedAmount;
    allocations.push({
      id: createBusinessId('pa'),
      paymentId,
      orderId: order.id,
      amount: allocatedAmount,
    });
  }
  const allocatedAmount = command.amount - remaining;
  customer.presaveBalance += remaining;
  const primaryOrder = command.relatedOrderId
    ? next.orders.find((order) => order.id === command.relatedOrderId)
    : next.orders.find((order) => order.id === allocations[0]?.orderId);
  const payment: Payment = {
    id: paymentId,
    paymentNo,
    customerId: customer.id,
    customerName: customer.name,
    paymentDate: command.paymentDate,
    amount: command.amount,
    method: command.method,
    relatedOrderId: primaryOrder?.id ?? '',
    relatedOrderNo: primaryOrder?.orderNo ?? (remaining > 0 ? '客户预存款' : ''),
    voucher: command.voucher.trim(),
    notes: command.notes.trim(),
    allocatedAmount,
    depositAmount: remaining,
    createdAt,
  };
  next.payments.unshift(payment);
  next.paymentAllocations.push(...allocations);
  const derived = deriveBusinessState(next);
  appendLedger(derived, customer.id, {
    date: command.paymentDate,
    businessType: '收款',
    docNo: paymentNo,
    description:
      remaining > 0
        ? `收款核销 ${allocatedAmount}，余款 ${remaining} 转为预存款`
        : `客户收款，核销订单 ${allocatedAmount}`,
    increaseReceivable: 0,
    receivedAmount: allocatedAmount,
    depositChange: remaining,
    notes: command.notes.trim(),
  });
  return { state: deriveBusinessState(derived), paymentId };
}

export function transferStockTransaction(
  state: BusinessState,
  command: TransferStockCommand,
): BusinessState {
  if (command.fromWarehouseId === command.toWarehouseId) {
    throw new Error('调出仓库和调入仓库不能相同');
  }
  if (!Number.isInteger(command.quantity) || command.quantity <= 0) {
    throw new Error('调拨数量必须为正整数');
  }
  const next = cloneState(state);
  const sourceIndex = findInventoryIndex(next.inventoryRecords, {
    styleNo: command.styleNo,
    color: command.color,
    size: command.size,
    warehouseId: command.fromWarehouseId,
  });
  const source = next.inventoryRecords[sourceIndex];
  if (!source || source.sellableStock < command.quantity) {
    throw new Error('调出仓库可销售库存不足');
  }
  const targetWarehouse = next.warehouses.find((item) => item.id === command.toWarehouseId);
  if (!targetWarehouse) throw new Error('调入仓库不存在');
  const transferNo = createDocumentNo('TRF', command.date, next.inventoryFlows.filter((flow) => flow.type === '仓库调拨').length / 2);
  const sourceBefore = source.actualStock;
  source.actualStock -= command.quantity;
  source.sellableStock = calculateSellableStock(source.actualStock, source.reservedStock);
  source.status = calcInventoryStatus(source.actualStock);

  let target = next.inventoryRecords.find(
    (record) =>
      record.warehouseId === command.toWarehouseId &&
      record.styleNo === command.styleNo &&
      record.color === command.color &&
      record.size === command.size,
  );
  const targetBefore = target?.actualStock ?? 0;
  if (!target) {
    target = {
      id: createBusinessId('inv'),
      styleNo: source.styleNo,
      productName: source.productName,
      color: source.color,
      size: source.size,
      warehouseId: targetWarehouse.id,
      warehouseName: targetWarehouse.name,
      actualStock: 0,
      reservedStock: 0,
      sellableStock: 0,
      status: '缺货',
    };
    next.inventoryRecords.push(target);
  }
  target.actualStock += command.quantity;
  target.sellableStock = calculateSellableStock(target.actualStock, target.reservedStock);
  target.status = calcInventoryStatus(target.actualStock);
  const commonFlow = {
    date: command.date,
    type: '仓库调拨' as const,
    product: source.productName,
    styleNo: source.styleNo,
    color: source.color,
    size: source.size,
    relatedDoc: transferNo,
    notes: command.notes.trim(),
  };
  const flows: InventoryFlow[] = [
    {
      ...commonFlow,
      id: createBusinessId('if'),
      warehouse: target.warehouseName,
      quantity: command.quantity,
      beforeStock: targetBefore,
      afterStock: target.actualStock,
    },
    {
      ...commonFlow,
      id: createBusinessId('if'),
      warehouse: source.warehouseName,
      quantity: -command.quantity,
      beforeStock: sourceBefore,
      afterStock: source.actualStock,
    },
  ];
  next.inventoryFlows.unshift(...flows);
  return deriveBusinessState(next);
}
