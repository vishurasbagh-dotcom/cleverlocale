import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVendorCertificateDir } from "@/lib/vendor-cert-upload";

type Props = { params: Promise<{ vendorId: string }> };

export async function GET(_req: Request, { params }: Props) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const { vendorId } = await params;
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      certificate: {
        select: { storedName: true, originalName: true, mimeType: true },
      },
    },
  });

  if (!vendor?.certificate?.storedName) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(getVendorCertificateDir(vendorId), vendor.certificate.storedName);
  try {
    const buf = await readFile(filePath);
    const name = vendor.certificate.originalName || "certificate";
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": vendor.certificate.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      },
    });
  } catch {
    return new Response("File missing on server", { status: 404 });
  }
}
