export type BusinessDocumentPrefix =
  | 'SO'
  | 'PB'
  | 'SH'
  | 'PM'
  | 'FP'
  | 'DEP'
  | 'TRF';

const DOCUMENT_TOKEN_LENGTH = 6;

function compactDate(date: string): string {
  const digits = date.replace(/\D/g, '').slice(0, 8);
  return digits.length === 8 ? digits : '00000000';
}

function stableToken(seed: string, length = DOCUMENT_TOKEN_LENGTH): string {
  const normalized = seed.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return normalized.slice(-length).padStart(length, '0');
}

/**
 * 用户可见业务单号：类型-业务日期-稳定短码。
 *
 * 短码来自已生成的随机内部 ID，因此多设备同时建单也不会依赖本地数组长度，
 * 且所有单号都能放入现有 varchar(20) 字段。
 */
export function createDocumentNo(
  prefix: BusinessDocumentPrefix,
  date: string,
  entityId: string,
): string {
  return `${prefix}-${compactDate(date)}-${stableToken(entityId)}`;
}

function formatMasterDataNo(
  publicPrefix: 'CUS' | 'FAC',
  internalPrefix: 'cus' | 'fac',
  id: string,
): string {
  const normalizedId = id.toLowerCase();
  const token = normalizedId.startsWith(internalPrefix)
    ? id.slice(internalPrefix.length)
    : id;
  return `${publicPrefix}-${token.toUpperCase()}`;
}

/** 客户资料编号，仅用于展示；数据库关联仍使用内部 ID。 */
export function formatCustomerNo(id: string): string {
  return formatMasterDataNo('CUS', 'cus', id);
}

/** 工厂资料编号，仅用于展示；数据库关联仍使用内部 ID。 */
export function formatFactoryNo(id: string): string {
  return formatMasterDataNo('FAC', 'fac', id);
}
