import { describe, expect, it } from 'vitest';
import {
  createDatabaseId,
  createShipmentItemId,
  DATABASE_ID_MAX_LENGTH,
} from '@/lib/database-id';
import { createBusinessId } from '@/lib/services/business';
import { generateId } from '@/lib/services/inventory';

describe('数据库 ID', () => {
  it('所有业务前缀生成的 ID 都不超过 varchar(10)', () => {
    const prefixes = [
      'customer',
      'prd',
      'fac',
      'batch',
      'fpay',
      'order',
      'shipment',
      'inventory',
      'ledger',
    ];

    for (const prefix of prefixes) {
      expect(createBusinessId(prefix).length).toBeLessThanOrEqual(
        DATABASE_ID_MAX_LENGTH,
      );
    }
  });

  it('连续生成的 ID 保持唯一', () => {
    const ids = new Set(
      Array.from({ length: 1_000 }, () => createDatabaseId('inv')),
    );
    expect(ids.size).toBe(1_000);
  });

  it('库存 ID 兼容确定性时间参数且不超过字段长度', () => {
    const first = generateId('inv', 1_754_000_000_000);
    const second = generateId('inv', 1_754_000_000_001);

    expect(first).toHaveLength(DATABASE_ID_MAX_LENGTH);
    expect(second).toHaveLength(DATABASE_ID_MAX_LENGTH);
    expect(first).not.toBe(second);
  });

  it('发货明细 ID 稳定且不超过 varchar(20)', () => {
    const first = createShipmentItemId('ship123456', 'item123456', 0);
    const second = createShipmentItemId('ship123456', 'item123456', 0);

    expect(first).toBe(second);
    expect(first.length).toBeLessThanOrEqual(20);
  });

  it('订单明细 ID 仅末尾不同时也不会生成重复发货明细 ID', () => {
    const first = createShipmentItemId('sh12345678', 'oi12345670', 0);
    const second = createShipmentItemId('sh12345678', 'oi12345671', 1);

    expect(first).not.toBe(second);
  });

  it('相同订单明细在不同位置仍生成唯一 ID', () => {
    const first = createShipmentItemId('sh12345678', 'oi12345670', 0);
    const second = createShipmentItemId('sh12345678', 'oi12345670', 1);

    expect(first).not.toBe(second);
  });
});
