export interface StorageInfo {
  usage: number;
  quota: number;
  percent: number;
  persisted: boolean;
}

export async function getStorageInfo(): Promise<StorageInfo> {
  if (!navigator.storage?.estimate) {
    return { usage: 0, quota: 0, percent: 0, persisted: false };
  }
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  const percent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
  let persisted = false;
  if (navigator.storage?.persisted) {
    persisted = await navigator.storage.persisted();
  }
  return { usage, quota, percent, persisted };
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  return navigator.storage.persist();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function isIncognitoWarning(): boolean {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return false;
  } catch {
    return true;
  }
}
