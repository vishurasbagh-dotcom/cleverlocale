"use client";

import { usePathname } from "next/navigation";

export function RouteHeaderVisibility({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/vendor")) {
    return null;
  }
  return <>{children}</>;
}
