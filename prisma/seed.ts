import "dotenv/config";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_SEED_ROOT_CATEGORIES } from "../src/lib/catalog-categories";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding");
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const passwordHash = await bcrypt.hash("cl@123", 12);

  const adminAccounts = [
    { email: "admin1@cleverlocale.local", name: "CL Admin 1" },
    { email: "admin2@cleverlocale.local", name: "CL Admin 2" },
    { email: "admin3@cleverlocale.local", name: "CL Admin 3" },
  ] as const;

  for (const a of adminAccounts) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: { passwordHash, role: "ADMIN", name: a.name },
      create: {
        email: a.email,
        passwordHash,
        name: a.name,
        role: "ADMIN",
      },
    });
  }

  const vendorAccounts = [
    { email: "vendor1@cleverlocale.local", name: "Vendor 1", shopName: "Vendor One", slug: "vendor-1" },
    { email: "vendor2@cleverlocale.local", name: "Vendor 2", shopName: "Vendor Two", slug: "vendor-2" },
    { email: "vendor3@cleverlocale.local", name: "Vendor 3", shopName: "Vendor Three", slug: "vendor-3" },
  ] as const;

  for (const v of vendorAccounts) {
    const vendorUser = await prisma.user.upsert({
      where: { email: v.email },
      update: { passwordHash, role: "VENDOR", name: v.name },
      create: {
        email: v.email,
        passwordHash,
        name: v.name,
        role: "VENDOR",
      },
    });

    await prisma.vendor.upsert({
      where: { userId: vendorUser.id },
      update: { shopName: v.shopName, slug: v.slug, status: "APPROVED", isShopOpen: true, isAdminShopClosed: false },
      create: {
        userId: vendorUser.id,
        shopName: v.shopName,
        slug: v.slug,
        status: "APPROVED",
        isShopOpen: true,
        isAdminShopClosed: false,
      },
    });
  }

  const vendorPrimary = await prisma.vendor.findUniqueOrThrow({
    where: { slug: "vendor-1" },
  });

  const customerAccounts = [
    { email: "user1@cleverlocale.local", name: "User 1" },
    { email: "user2@cleverlocale.local", name: "User 2" },
    { email: "user3@cleverlocale.local", name: "User 3" },
  ] as const;

  for (const c of customerAccounts) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { passwordHash, name: c.name, role: "CUSTOMER" },
      create: {
        email: c.email,
        passwordHash,
        name: c.name,
        role: "CUSTOMER",
      },
    });
    await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }

  /** Legacy single-demo emails (same password `cl@123`) — kept for bookmarks and older docs. */
  await prisma.user.upsert({
    where: { email: "admin@cleverlocale.local" },
    update: { passwordHash, role: "ADMIN", name: "Platform Admin (legacy)" },
    create: {
      email: "admin@cleverlocale.local",
      passwordHash,
      name: "Platform Admin (legacy)",
      role: "ADMIN",
    },
  });

  const legacyVendorUser = await prisma.user.upsert({
    where: { email: "vendor@cleverlocale.local" },
    update: { passwordHash, role: "VENDOR", name: "Demo Vendor (legacy)" },
    create: {
      email: "vendor@cleverlocale.local",
      passwordHash,
      name: "Demo Vendor (legacy)",
      role: "VENDOR",
    },
  });

  await prisma.vendor.upsert({
    where: { userId: legacyVendorUser.id },
    update: {
      shopName: "GreenLeaf Organics",
      slug: "greenleaf-organics",
      status: "APPROVED",
      isShopOpen: true,
      isAdminShopClosed: false,
    },
    create: {
      userId: legacyVendorUser.id,
      shopName: "GreenLeaf Organics",
      slug: "greenleaf-organics",
      status: "APPROVED",
      isShopOpen: true,
      isAdminShopClosed: false,
    },
  });

  const legacyCustomer = await prisma.user.upsert({
    where: { email: "customer@cleverlocale.local" },
    update: { passwordHash, name: "Demo Customer (legacy)", role: "CUSTOMER" },
    create: {
      email: "customer@cleverlocale.local",
      passwordHash,
      name: "Demo Customer (legacy)",
      role: "CUSTOMER",
    },
  });

  await prisma.cart.upsert({
    where: { userId: legacyCustomer.id },
    update: {},
    create: { userId: legacyCustomer.id },
  });

  const categoryBySlug: Record<string, { id: string }> = {};
  for (const c of DEFAULT_SEED_ROOT_CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, parentId: null },
      create: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        parentId: null,
      },
    });
    categoryBySlug[c.slug] = { id: row.id };
  }

  const catElectronics = categoryBySlug.electronics;
  const catGroceries = categoryBySlug["groceries-provision"];
  if (!catElectronics || !catGroceries) {
    throw new Error("Seed: expected electronics and groceries-provision categories.");
  }

  const products = [
    {
      slug: "usb-c-cable-2m",
      name: "USB-C cable (2m)",
      description: "Braided cable for phones and laptops.",
      pricePaise: 49900,
      stock: 120,
      categoryId: catElectronics.id,
    },
    {
      slug: "wireless-mouse",
      name: "Wireless mouse",
      description: "Compact ergonomic mouse with long battery life.",
      pricePaise: 89900,
      stock: 45,
      categoryId: catElectronics.id,
    },
    {
      slug: "ceramic-mug-set",
      name: "Ceramic mug set (4)",
      description: "Microwave-safe mugs, 350ml each.",
      pricePaise: 64900,
      stock: 30,
      categoryId: catGroceries.id,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: {
        vendorId_slug: { vendorId: vendorPrimary.id, slug: p.slug },
      },
      update: {
        name: p.name,
        description: p.description,
        pricePaise: p.pricePaise,
        stock: p.stock,
        categoryId: p.categoryId,
        isPublished: true,
      },
      create: {
        vendorId: vendorPrimary.id,
        categoryId: p.categoryId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        pricePaise: p.pricePaise,
        stock: p.stock,
        isPublished: true,
      },
    });
  }

  console.log("Seed complete.");
  console.log(`  Default root categories: ${DEFAULT_SEED_ROOT_CATEGORIES.map((c) => c.slug).join(", ")}`);
  console.log("  Password for all accounts below: cl@123");
  console.log("  CL Admin:  admin1@… admin2@… admin3@… @cleverlocale.local");
  console.log("  Vendors:   vendor1@… vendor2@… vendor3@… @cleverlocale.local");
  console.log("  Customers: user1@… user2@… user3@… @cleverlocale.local");
  console.log("  Legacy (same password): admin@ vendor@ customer@ @cleverlocale.local");
  console.log("    vendor@ → shop slug greenleaf-organics (no demo products; samples are on vendor-1)");
  console.log("  Demo products are under vendor slug: vendor-1");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
