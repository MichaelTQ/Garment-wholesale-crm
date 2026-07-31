import { describe, expect, it } from 'vitest';
import {
  createDocumentNo,
  formatCustomerNo,
  formatFactoryNo,
  type BusinessDocumentPrefix,
} from '@/lib/business-number';

describe('业务编号', () => {
  it('按统一的类型-日期-短码格式生成单据号', () => {
    expect(createDocumentNo('SO', '2026-07-31', 'ord1234k9q')).toBe(
      'SO-20260731-234K9Q',
    );
  });

  it('所有业务单号都不超过数据库 varchar(20)', () => {
    const prefixes: BusinessDocumentPrefix[] = [
      'SO',
      'PB',
      'SH',
      'PM',
      'FP',
      'DEP',
      'TRF',
    ];

    for (const prefix of prefixes) {
      expect(
        createDocumentNo(prefix, '2026-07-31', 'abc1234567').length,
      ).toBeLessThanOrEqual(20);
    }
  });

  it('不同内部 ID 在同一天生成不同单号', () => {
    const first = createDocumentNo('SO', '2026-07-31', 'ord1234k9q');
    const second = createDocumentNo('SO', '2026-07-31', 'ord5678m2x');
    expect(first).not.toBe(second);
  });

  it('客户和工厂展示编号隐藏内部前缀并兼容历史 ID', () => {
    expect(formatCustomerNo('cus1234abc')).toBe('CUS-1234ABC');
    expect(formatFactoryNo('fac5678xyz')).toBe('FAC-5678XYZ');
    expect(formatCustomerNo('c001')).toBe('CUS-C001');
    expect(formatFactoryNo('f001')).toBe('FAC-F001');
  });
});
