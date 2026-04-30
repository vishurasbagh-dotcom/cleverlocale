/** Approved shop is publicly visible and vendor may edit catalog / requested profile updates. */
export function vendorShopfrontLive(v: {
  status: string;
  isShopOpen: boolean;
  isAdminShopClosed: boolean;
}): boolean {
  return v.status === "APPROVED" && v.isShopOpen && !v.isAdminShopClosed;
}
