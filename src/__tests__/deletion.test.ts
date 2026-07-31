import { describe, expect, it } from 'vitest';
import {
  deleteCustomersTransaction,
  deleteFactoriesTransaction,
  deleteInboundFlowsTransaction,
  deleteOrdersTransaction,
  deleteProductsTransaction,
} from '@/lib/services/deletion';
import {
  BUSINESS_STORAGE_VERSION,
  type BusinessState,
} from '@/lib/types/business';

function stateFixture(): BusinessState {
  return {
    storageVersion: BUSINESS_STORAGE_VERSION,
    customers: [
      {
        id: 'cus0000001',
        name: '客户一',
        country: 'Ghana',
        city: '',
        whatsapp: '1',
        categories: [],
        frequentCategories: [],
        lastPurchaseDate: '',
        totalSales: 0,
        orderReceivable: 0,
        shippedDebt: 0,
        presaveBalance: 0,
        preDeposit: 0,
        lastPaymentDate: '',
        pendingShipQty: 0,
        status: '一般',
        commonSizes: [],
        avgOrderAmount: 0,
        purchaseFrequency: '',
        notes: '',
      },
      {
        id: 'cus0000002',
        name: '客户二',
        country: 'Kenya',
        city: '',
        whatsapp: '2',
        categories: [],
        frequentCategories: [],
        lastPurchaseDate: '',
        totalSales: 0,
        orderReceivable: 0,
        shippedDebt: 0,
        presaveBalance: 0,
        preDeposit: 0,
        lastPaymentDate: '',
        pendingShipQty: 0,
        status: '一般',
        commonSizes: [],
        avgOrderAmount: 0,
        purchaseFrequency: '',
        notes: '',
      },
    ],
    products: [
      {
        id: 'prd0000001',
        styleNo: 'TEST-1',
        name: '测试商品',
        category: 'T恤',
        colors: [{ name: '黑色', hex: '#000000' }],
        sizes: ['M'],
        images: [],
        currentStock: 0,
        suggestedPrice: 10,
        lastCost: 0,
        newDate: '2026-07-31',
        status: '设计中',
        description: '',
      },
    ],
    warehouses: [{ id: 'wh1', name: '测试仓', address: '' }],
    factories: [
      {
        id: 'fac0000001',
        name: '测试工厂',
        contact: '',
        phone: '',
        mainCategory: '',
        totalProductionAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        lastCoopDate: '',
        address: '',
        notes: '',
      },
    ],
    productionBatches: [],
    factoryPayments: [],
    inventoryRecords: [],
    inventoryFlows: [],
    inventoryReservations: [],
    orders: [],
    shipments: [],
    payments: [],
    paymentAllocations: [],
    depositApplications: [],
    customerLedgers: {
      cus0000001: [],
      cus0000002: [],
    },
  };
}

describe('安全删除事务', () => {
  it('支持批量删除未被引用的客户并清理账本入口', () => {
    const result = deleteCustomersTransaction(
      stateFixture(),
      ['cus0000001', 'cus0000002'],
    );
    expect(result.customers).toHaveLength(0);
    expect(result.customerLedgers).toEqual({});
  });

  it('批量删除中任一客户有关联订单时整批拒绝', () => {
    const state = stateFixture();
    state.orders.push({
      id: 'ord0000001',
      orderNo: 'SO-20260731-ABC123',
      customerId: 'cus0000001',
      customerName: '客户一',
      country: 'Ghana',
      orderDate: '2026-07-31',
      items: [],
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      totalQuantity: 0,
      shippedQuantity: 0,
      pendingShipQuantity: 0,
      status: '草稿',
      presaveDeduction: 0,
      finalReceivable: 0,
      notes: '',
    });
    expect(() =>
      deleteCustomersTransaction(state, ['cus0000001', 'cus0000002']),
    ).toThrow('已有关联订单');
    expect(state.customers).toHaveLength(2);
  });

  it('商品存在库存时阻止删除', () => {
    const state = stateFixture();
    state.inventoryRecords.push({
      id: 'inv0000001',
      styleNo: 'TEST-1',
      productName: '测试商品',
      color: '黑色',
      size: 'M',
      warehouseId: 'wh1',
      warehouseName: '测试仓',
      actualStock: 1,
      reservedStock: 0,
      sellableStock: 1,
      status: '低库存',
    });
    expect(() => deleteProductsTransaction(state, ['prd0000001'])).toThrow(
      '已有生产、订单或库存记录',
    );
  });

  it('工厂存在生产批次时阻止删除', () => {
    const state = stateFixture();
    state.productionBatches.push({
      id: 'bat0000001',
      batchNo: 'PB-20260731-ABC123',
      factoryId: 'fac0000001',
      productId: 'prd0000001',
      styleNo: 'TEST-1',
      productName: '测试商品',
      color: '黑色',
      size: 'M',
      quantity: 10,
      unitCost: 1,
      totalCost: 10,
      inboundWarehouseId: 'wh1',
      warehouseId: 'wh1',
      inboundDate: '',
      inboundQuantity: 0,
      paidAmount: 0,
      unpaidAmount: 10,
      status: '待生产',
    });
    expect(() => deleteFactoriesTransaction(state, ['fac0000001'])).toThrow(
      '已有生产批次或付款记录',
    );
  });

  it('删除已取消订单时同步清理预留、库存流水和客户账本', () => {
    const state = stateFixture();
    const orderNo = 'SO-20260731-ABC123';
    state.orders.push({
      id: 'ord0000001',
      orderNo,
      customerId: 'cus0000001',
      customerName: '客户一',
      country: 'Ghana',
      orderDate: '2026-07-31',
      items: [],
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      totalQuantity: 0,
      shippedQuantity: 0,
      pendingShipQuantity: 0,
      status: '已取消',
      presaveDeduction: 0,
      finalReceivable: 0,
      notes: '',
    });
    state.inventoryReservations.push({
      id: 'res0000001',
      orderId: 'ord0000001',
      orderItemId: 'oi00000001',
      customerId: 'cus0000001',
      warehouseId: 'wh1',
      styleNo: 'TEST-1',
      color: '黑色',
      size: 'M',
      reservedQuantity: 1,
      shippedQuantity: 0,
      releasedQuantity: 1,
      status: '已释放',
      reservedAt: '2026-07-31',
      releasedAt: '2026-07-31',
    });
    state.inventoryFlows.push({
      id: 'if00000001',
      date: '2026-07-31',
      type: '取消预留',
      product: '测试商品',
      styleNo: 'TEST-1',
      color: '黑色',
      size: 'M',
      warehouse: '测试仓',
      quantity: 1,
      beforeStock: 1,
      afterStock: 1,
      relatedDoc: orderNo,
      notes: '',
    });
    state.customerLedgers.cus0000001.push({
      id: 'led0000001',
      date: '2026-07-31',
      businessType: '订单',
      docNo: orderNo,
      description: '',
      increaseReceivable: 0,
      receivedAmount: 0,
      balance: 0,
      depositChange: 0,
      depositBalance: 0,
      notes: '',
    });

    const result = deleteOrdersTransaction(state, ['ord0000001']);
    expect(result.orders).toHaveLength(0);
    expect(result.inventoryReservations).toHaveLength(0);
    expect(result.inventoryFlows).toHaveLength(0);
    expect(result.customerLedgers.cus0000001).toHaveLength(0);
  });

  it('批量撤销连续的最新入库，并同步回退库存与生产批次', () => {
    const state = stateFixture();
    state.productionBatches.push({
      id: 'bat0000001',
      batchNo: 'PB-20260731-ABC123',
      factoryId: 'fac0000001',
      productId: 'prd0000001',
      styleNo: 'TEST-1',
      productName: '测试商品',
      color: '黑色',
      size: 'M',
      quantity: 20,
      unitCost: 1,
      totalCost: 20,
      inboundWarehouseId: 'wh1',
      warehouseId: 'wh1',
      inboundDate: '2026-07-31',
      inboundQuantity: 20,
      paidAmount: 0,
      unpaidAmount: 20,
      status: '已入库',
    });
    state.inventoryRecords.push({
      id: 'inv0000001',
      styleNo: 'TEST-1',
      productName: '测试商品',
      color: '黑色',
      size: 'M',
      warehouseId: 'wh1',
      warehouseName: '测试仓',
      actualStock: 20,
      reservedStock: 0,
      sellableStock: 20,
      status: '正常',
    });
    state.inventoryFlows.push(
      {
        id: 'if00000001',
        date: '2026-07-31',
        type: '生产入库',
        product: '测试商品',
        styleNo: 'TEST-1',
        color: '黑色',
        size: 'M',
        warehouse: '测试仓',
        quantity: 10,
        beforeStock: 10,
        afterStock: 20,
        relatedDoc: 'PB-20260731-ABC123',
        notes: '',
      },
      {
        id: 'if00000002',
        date: '2026-07-31',
        type: '生产入库',
        product: '测试商品',
        styleNo: 'TEST-1',
        color: '黑色',
        size: 'M',
        warehouse: '测试仓',
        quantity: 10,
        beforeStock: 0,
        afterStock: 10,
        relatedDoc: 'PB-20260731-ABC123',
        notes: '',
      },
    );

    const result = deleteInboundFlowsTransaction(state, [
      'if00000001',
      'if00000002',
    ]);
    expect(result.inventoryFlows).toHaveLength(0);
    expect(result.inventoryRecords).toHaveLength(0);
    expect(result.productionBatches[0].inboundQuantity).toBe(0);
    expect(result.productionBatches[0].status).toBe('待生产');
  });

  it('入库后已有其他库存变更时阻止撤销', () => {
    const state = stateFixture();
    state.inventoryRecords.push({
      id: 'inv0000001',
      styleNo: 'TEST-1',
      productName: '测试商品',
      color: '黑色',
      size: 'M',
      warehouseId: 'wh1',
      warehouseName: '测试仓',
      actualStock: 8,
      reservedStock: 0,
      sellableStock: 8,
      status: '低库存',
    });
    state.inventoryFlows.push({
      id: 'if00000001',
      date: '2026-07-31',
      type: '手工调整',
      product: '测试商品',
      styleNo: 'TEST-1',
      color: '黑色',
      size: 'M',
      warehouse: '测试仓',
      quantity: 10,
      beforeStock: 0,
      afterStock: 10,
      relatedDoc: '',
      notes: '',
    });

    expect(() =>
      deleteInboundFlowsTransaction(state, ['if00000001']),
    ).toThrow('已有出库、调拨或其他库存变更');
  });
});
