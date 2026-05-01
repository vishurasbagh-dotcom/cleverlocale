import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/product-image-constants";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export function getProductImageDir(productId: string): string {
  return path.join(process.cwd(), ".data", "product-images", productId);
}

export async function saveProductImageFile(productId: string, file: File): Promise<string> {
  if (file.size === 0) {
    throw new Error("Empty image.");
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error("Each image must be 5 MB or smaller.");
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    throw new Error("Images must be JPEG, PNG, GIF, or WebP.");
  }
  const ext =
    mime === "image/jpeg" ? ".jpg" : mime === "image/png" ? ".png" : mime === "image/gif" ? ".gif" : ".webp";
  const storedName = `${randomBytes(16).toString("hex")}${ext}`;
  const dir = getProductImageDir(productId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storedName), Buffer.from(await file.arrayBuffer()));
  return storedName;
}
