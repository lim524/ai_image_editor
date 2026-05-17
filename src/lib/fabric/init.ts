let initialized = false;

/** Fabric 직렬화 시 assetId·data 등 커스텀 필드 유지 */
export async function initFabricCustomProps(): Promise<void> {
  if (initialized) return;
  const { FabricObject, FabricImage } = await import("fabric");
  const props = ["assetId", "data"] as const;
  for (const p of props) {
    if (!FabricObject.customProperties.includes(p)) {
      FabricObject.customProperties.push(p);
    }
  }
  for (const p of props) {
    if (!FabricImage.customProperties.includes(p)) {
      FabricImage.customProperties.push(p);
    }
  }
  initialized = true;
}
