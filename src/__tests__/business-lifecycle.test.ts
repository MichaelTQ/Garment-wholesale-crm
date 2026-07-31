import { describe, expect, it } from 'vitest';
import {
  addCustomerTransaction,
  addFactoryTransaction,
  applyDepositTransaction,
  createFactoryPaymentTransaction,
  createOrderTransaction,
  createPaymentTransaction,
  createProductionBatchTransaction,
  createShipmentTransaction,
  deriveBusinessState,
} from '@/lib/services/business';
import {
  BUSINESS_STORAGE_VERSION,
  type BusinessState,
} from '@/lib/types/business';

function emptyState(): BusinessState {
  return {
    storageVersion: BUSINESS_STORAGE_VERSION,
    customers: [],
    products: [
      {
        id: 'prd-1',
        styleNo: 'ST-001',
        name: '测试商品',
        category: 'T恤',
        colors: [{ name: '黑色', hex: '#000000' }],
        sizes: ['M'],
        images: [],
        currentStock: 10,
        suggestedPrice: 20,
        lastCost: 0,
        newDate: '2026-07-30',
        status: '正常销售',
        description: '',
      },
    ],
    warehouses: [{ id: 'wh1', name: '测试仓', address: '广州' }],
    factories: [],
    productionBatches: [],
    factoryPayments: [],
    inventoryRecords: [
      {
        id: 'inv-1',
        styleNo: 'ST-001',
        productName: '测试商品',
        color: '黑色',
        size: 'M',
        warehouseId: 'wh1',
        warehouseName: '测试仓',
        actualStock: 10,
        reservedStock: 0,
        sellableStock: 10,
        status: '低库存',
      },
    ],
    inventoryFlows: [],
    inventoryReservations: [],
    orders: [],
    shipments: [],
    payments: [],
    paymentAllocations: [],
    depositApplications: [],
    customerLedgers: {},
  };
}

describe('完整业务生命周期', () => {
  it('客户、订单预留、部分发货、全部发货和超额收款保持联通', () => {
    let state = addCustomerTransaction(
      emptyState(),
      {
        name: 'Africa Fashion',
        country: '尼日利亚',
        city: 'Lagos',
        whatsapp: '+2341000000',
        frequentCategories: ['T恤'],
        notes: '',
      },
      '2026-07-30T08:00:00.000Z',
    );
    const customerId = state.customers[0].id;

    const orderResult = createOrderTransaction(
      state,
      {
        customerId,
        orderDate: '2026-07-30',
        items: [
          {
            productId: 'prd-1',
            styleNo: 'ST-001',
            productName: '测试商品',
            color: '黑色',
            size: 'M',
            warehouseId: 'wh1',
            warehouseName: '测试仓',
            quantity: 10,
            unitPrice: 20,
          },
        ],
        notes: '',
        confirm: true,
        depositDeduction: 0,
      },
      '2026-07-30T09:00:00.000Z',
    );
    state = orderResult.state;
    expect(state.inventoryRecords[0].actualStock).toBe(10);
    expect(state.inventoryRecords[0].reservedStock).toBe(10);
    expect(state.inventoryRecords[0].sellableStock).toBe(0);
    expect(state.customers[0].orderReceivable).toBe(200);

    const orderItemId = state.orders[0].items[0].id;
    const partialShipment = createShipmentTransaction(
      state,
      {
        orderId: orderResult.orderId,
        shipDate: '2026-07-31',
        logisticsMethod: '海运',
        trackingNo: 'TRACK-1',
        notes: '',
        items: [{ orderItemId, quantity: 4 }],
      },
      '2026-07-31T09:00:00.000Z',
    );
    state = partialShipment.state;
    expect(state.orders[0].status).toBe('部分发货');
    expect(state.inventoryRecords[0].actualStock).toBe(6);
    expect(state.inventoryRecords[0].reservedStock).toBe(6);
    expect(state.customers[0].shippedDebt).toBe(80);

    const payment = createPaymentTransaction(
      state,
      {
        customerId,
        paymentDate: '2026-08-01',
        amount: 250,
        method: '银行转账',
        relatedOrderId: orderResult.orderId,
        voucher: '',
        notes: '',
      },
      '2026-08-01T09:00:00.000Z',
    );
    state = payment.state;
    expect(state.orders[0].unpaidAmount).toBe(0);
    expect(state.customers[0].presaveBalance).toBe(50);
    expect(state.payments[0].allocatedAmount).toBe(200);
    expect(state.payments[0].depositAmount).toBe(50);
    expect(state.customers[0].shippedDebt).toBe(0);

    const finalShipment = createShipmentTransaction(
      state,
      {
        orderId: orderResult.orderId,
        shipDate: '2026-08-02',
        logisticsMethod: '海运',
        trackingNo: 'TRACK-2',
        notes: '',
        items: [{ orderItemId, quantity: 6 }],
      },
      '2026-08-02T09:00:00.000Z',
    );
    state = deriveBusinessState(finalShipment.state);
    expect(state.orders[0].status).toBe('已完成');
    expect(state.inventoryRecords[0].actualStock).toBe(0);
    expect(state.inventoryRecords[0].reservedStock).toBe(0);
    expect(state.customers[0].orderReceivable).toBe(0);
    expect(state.customerLedgers[customerId]).toHaveLength(4);
  });

  it('库存不足时拒绝确认订单', () => {
    const withCustomer = addCustomerTransaction(
      emptyState(),
      {
        name: 'Buyer',
        country: '加纳',
        city: '',
        whatsapp: '+2331000000',
        frequentCategories: [],
        notes: '',
      },
      '2026-07-30T08:00:00.000Z',
    );
    expect(() =>
      createOrderTransaction(
        withCustomer,
        {
          customerId: withCustomer.customers[0].id,
          orderDate: '2026-07-30',
          items: [
            {
              productId: 'prd-1',
              styleNo: 'ST-001',
              productName: '测试商品',
              color: '黑色',
              size: 'M',
              warehouseId: 'wh1',
              warehouseName: '测试仓',
              quantity: 11,
              unitPrice: 20,
            },
          ],
          notes: '',
          confirm: true,
          depositDeduction: 0,
        },
        '2026-07-30T09:00:00.000Z',
      ),
    ).toThrow('可销售库存不足');
  });

  it('工厂、生产批次和工厂付款同步更新应付金额', () => {
    let state = addFactoryTransaction(emptyState(), {
      name: '测试制衣厂',
      contact: '李师傅',
      phone: '13800000000',
      mainCategory: 'T恤',
      address: '广州',
      notes: '',
    });
    const factoryId = state.factories[0].id;
    state = createProductionBatchTransaction(state, {
      factoryId,
      productId: 'prd-1',
      color: '黑色',
      size: 'M',
      quantity: 100,
      unitCost: 8,
      inboundWarehouseId: 'wh1',
      startDate: '2026-07-30',
      notes: '',
    });
    expect(state.factories[0].totalProductionAmount).toBe(800);
    expect(state.factories[0].unpaidAmount).toBe(800);

    state = createFactoryPaymentTransaction(
      state,
      {
        factoryId,
        batchId: state.productionBatches[0].id,
        paymentDate: '2026-07-31',
        amount: 300,
        method: '银行转账',
        voucher: '',
        notes: '',
      },
      '2026-07-31T09:00:00.000Z',
    );
    expect(state.productionBatches[0].paidAmount).toBe(300);
    expect(state.productionBatches[0].unpaidAmount).toBe(500);
    expect(state.factories[0].paidAmount).toBe(300);
    expect(state.factories[0].unpaidAmount).toBe(500);
    expect(state.factoryPayments).toHaveLength(1);
  });

  it('客户预存款与订单欠款相等时可以一次抵扣结清', () => {
    let state = addCustomerTransaction(
      emptyState(),
      {
        name: 'Deposit Buyer',
        country: '肯尼亚',
        city: 'Nairobi',
        whatsapp: '+2541000000',
        frequentCategories: [],
        notes: '',
      },
      '2026-07-30T08:00:00.000Z',
    );
    const customerId = state.customers[0].id;
    state = createPaymentTransaction(
      state,
      {
        customerId,
        paymentDate: '2026-07-30',
        amount: 200,
        method: '银行转账',
        relatedOrderId: '',
        voucher: '',
        notes: '预存',
      },
      '2026-07-30T08:30:00.000Z',
    ).state;
    expect(state.customers[0].presaveBalance).toBe(200);

    const orderResult = createOrderTransaction(
      state,
      {
        customerId,
        orderDate: '2026-07-31',
        items: [
          {
            productId: 'prd-1',
            styleNo: 'ST-001',
            productName: '测试商品',
            color: '黑色',
            size: 'M',
            warehouseId: 'wh1',
            warehouseName: '测试仓',
            quantity: 10,
            unitPrice: 20,
          },
        ],
        notes: '',
        confirm: true,
        depositDeduction: 0,
      },
      '2026-07-31T09:00:00.000Z',
    );
    state = orderResult.state;
    expect(state.orders[0].unpaidAmount).toBe(200);

    state = applyDepositTransaction(
      state,
      {
        customerId,
        orderId: orderResult.orderId,
        applicationDate: '2026-07-31',
        amount: 200,
        notes: '',
      },
      '2026-07-31T10:00:00.000Z',
    ).state;
    expect(state.customers[0].presaveBalance).toBe(0);
    expect(state.orders[0].paidAmount).toBe(200);
    expect(state.orders[0].unpaidAmount).toBe(0);
    expect(state.depositApplications).toHaveLength(1);
    expect(state.customerLedgers[customerId][0].businessType).toBe('预存款抵扣');
  });

  it('库存预警按可销售库存而不是实际库存计算', () => {
    const state = emptyState();
    state.inventoryRecords[0] = {
      ...state.inventoryRecords[0],
      actualStock: 100,
      reservedStock: 95,
      sellableStock: 100,
      status: '正常',
    };
    const derived = deriveBusinessState(state);
    expect(derived.inventoryRecords[0].actualStock).toBe(100);
    expect(derived.inventoryRecords[0].sellableStock).toBe(5);
    expect(derived.inventoryRecords[0].status).toBe('低库存');
  });
});
