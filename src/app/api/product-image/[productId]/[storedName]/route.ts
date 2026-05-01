import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getProductImageDir } from "@/lib/product-image-storage";

const nameRe = /^[a-f0-9]{32}\.(jpg|jpeg|png|gif|webp)$/i;

function contentType(storedName: string): string {
  const lower = storedName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

type Props = { params: Promise<{ productId: string; storedName: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { productId, storedName } = await params;
  if (!nameRe.test(storedName) || !productId || productId.length > 40) {
    return new Response("Bad request", { status: 400 });
  }

  const row = await prisma.productImage.findFirst({
    where: { productId, storedName },
    include: { product: { select: { isPublished: true } } },
  });
  if (!row?.product.isPublished) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(getProductImageDir(productId), storedName);
  try {
    const buf = await readFile(filePath);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": contentType(storedName),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
