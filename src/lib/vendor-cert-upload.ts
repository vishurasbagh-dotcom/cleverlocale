import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 12 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function getVendorCertificateDir(vendorId: string): string {
  return path.join(process.cwd(), ".data", "vendor-certificates", vendorId);
}

export async function saveVendorCertificate(
  vendorId: string,
  file: File | null | undefined,
): Promise<{ storedName: string; originalName: string; mimeType: string } | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_BYTES) {
    throw new Error("Certificate file must be 12 MB or smaller.");
  }
  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error("Certificate must be an image (JPEG/PNG/GIF/WebP), PDF, or Word document (.doc/.docx).");
  }

  const ext = extensionForMime(mimeType, file.name);
  const storedName = `${randomBytes(16).toString("hex")}${ext}`;
  const dir = getVendorCertificateDir(vendorId);
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), buf);

  return {
    storedName,
    originalName: file.name.replace(/[^\w.\- ()[\]]+/g, "").slice(0, 200) || "upload",
    mimeType,
  };
}

function extensionForMime(mime: string, originalName: string): string {
  const lower = originalName.toLowerCase();
  if (lower.endsWith(".docx")) return ".docx";
  if (lower.endsWith(".doc")) return ".doc";
  if (lower.endsWith(".pdf")) return ".pdf";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/gif") return ".gif";
  if (mime === "image/webp") return ".webp";
  return ".bin";
}
