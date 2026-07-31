import { BUSINESS_STORAGE_VERSION } from '@/lib/types/business';

/**
 * 给服务端加载出的业务快照标记当前客户端格式版本。
 * 版本只在一处维护，避免升级本地缓存格式后云端仍返回旧版本。
 */
export function withCurrentStorageVersion<T extends object>(
  snapshot: T,
): T & { storageVersion: number } {
  return {
    ...snapshot,
    storageVersion: BUSINESS_STORAGE_VERSION,
  };
}
