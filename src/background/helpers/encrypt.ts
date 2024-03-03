import { getAppLogger } from "@/background/log";
import { requireElectron, getElectron } from "@/background/helpers/portability";

export function isEncryptionAvailable(): boolean {
  return !!getElectron()?.safeStorage.isEncryptionAvailable();
}

export function EncryptString(plainText: string): string {
  return requireElectron().safeStorage.encryptString(plainText).toString("base64");
}

export function DecryptString(encrypted: string, defaultValue?: string): string {
  try {
    return requireElectron().safeStorage.decryptString(Buffer.from(encrypted, "base64"));
  } catch (e) {
    getAppLogger().error("failed to decrypt CSA server password: %s", e);
    return defaultValue || "";
  }
}
