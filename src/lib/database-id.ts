/**
 * Supabase 现有业务表的主键字段为 varchar(10)。
 * 所有在前端生成、最终会写入数据库的内部 ID 都必须遵守这个上限。
 */
export const DATABASE_ID_MAX_LENGTH = 10;

const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
let fallbackSequence = 0;

function normalizePrefix(prefix: string): string {
  const normalized = prefix.toLowerCase().replace(/[^a-z0-9]/g, '');
  return (normalized || 'id').slice(0, 3);
}

function randomSuffix(length: number): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    const bytes = new Uint8Array(length);
    cryptoApi.getRandomValues(bytes);
    return Array.from(bytes, (byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join('');
  }

  fallbackSequence = (fallbackSequence + 1) % 1_679_616;
  const fallback = `${Date.now().toString(36)}${fallbackSequence.toString(36).padStart(4, '0')}`;
  return fallback.slice(-length).padStart(length, '0');
}

/**
 * 生成可直接写入 varchar(10) 主键列的紧凑 ID。
 *
 * 生产环境使用 Web Crypto 生成随机后缀；传入 now 时生成确定性 ID，
 * 便于纯函数测试和历史调用兼容。
 */
export function createDatabaseId(prefix: string, now?: number): string {
  const compactPrefix = normalizePrefix(prefix);
  const suffixLength = DATABASE_ID_MAX_LENGTH - compactPrefix.length;
  const suffix = now === undefined
    ? randomSuffix(suffixLength)
    : now.toString(36).slice(-suffixLength).padStart(suffixLength, '0');
  return `${compactPrefix}${suffix}`;
}

/**
 * shipment_items 没有独立的前端实体 ID，使用发货单和订单明细生成稳定主键。
 */
function hashShipmentItemSource(source: string, seed: number): string {
  let hash = seed >>> 0;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
    hash ^= hash >>> 13;
  }
  return (hash >>> 0).toString(36).padStart(7, '0');
}

export function createShipmentItemId(
  shipmentId: string,
  orderItemId: string,
  index: number,
): string {
  // 旧实现直接截断 `${shipmentId}${orderItemId}`，当订单明细仅末尾不同时
  // 会产生相同 ID。这里对完整来源做双重 32 位散列，并始终包含数组序号。
  const source = `${shipmentId}|${orderItemId}|${index}`;
  const first = hashShipmentItemSource(source, 2_166_136_261);
  const second = hashShipmentItemSource(
    source.split('').reverse().join(''),
    2_654_435_769,
  );
  return `si${first}${second}`;
}
