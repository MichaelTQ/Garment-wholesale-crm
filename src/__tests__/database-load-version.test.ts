import { describe, expect, it } from 'vitest';
import { BUSINESS_STORAGE_VERSION } from '@/lib/types/business';
import { withCurrentStorageVersion } from '@/lib/state/storage-version';

describe('database load storage version', () => {
  it('云端快照使用当前客户端存储版本，而不是硬编码旧版本', () => {
    const snapshot = withCurrentStorageVersion({
      warehouses: [],
      customers: [],
    });

    expect(snapshot.storageVersion).toBe(BUSINESS_STORAGE_VERSION);
  });
});
