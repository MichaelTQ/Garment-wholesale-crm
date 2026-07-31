import { describe, expect, it } from 'vitest';
import { createEmptyBusinessState } from '@/lib/state/empty-state';

describe('createEmptyBusinessState', () => {
  it('清空全部商业数据并原样保留当前仓库', () => {
    const warehouses = [
      { id: 'wh-custom', name: '自定义仓库', address: '广州' },
    ];

    const state = createEmptyBusinessState(warehouses);

    expect(state.warehouses).toEqual(warehouses);
    expect(state.warehouses).not.toBe(warehouses);
    expect(state).toMatchObject({
      customers: [],
      products: [],
      factories: [],
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
      customerLedgers: {},
    });
  });
});
