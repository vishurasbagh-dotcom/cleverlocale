import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding");
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const passwordHash = await bcrypt.hash("Cleverlocale123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@cleverlocale.local" },
    update: { passwordHash, role: "ADMIN", name: "Platform Admin" },
    create: {
      email: "admin@cleverlocale.local",
      passwordHash,
      name: "Platform Admin",
      role: "ADMIN",
    },
  });

  const vendorUser = await prisma.user.upsert({
    where: { email: "vendor@cleverlocale.local" },
    update: { passwordHash, role: "VENDOR", name: "Demo Vendor" },
    create: {
      email: "vendor@cleverlocale.local",
      passwordHash,
      name: "Demo Vendor",
      role: "VENDOR",
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: { shopName: "GreenLeaf Organics", status: "APPROVED" },
    create: {
      userId: vendorUser.id,
      shopName: "GreenLeaf Organics",
      slug: "greenleaf-organics",
      status: "APPROVED",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@cleverlocale.local" },
    update: { passwordHash, name: "Demo Customer" },
    create: {
      email: "customer@cleverlocale.local",
      passwordHash,
      name: "Demo Customer",
      role: "CUSTOMER",
    },
  });

  await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id },
  });

  const catElectronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "Electronics",
      slug: "electronics",
      description: "Gadgets and accessories",
    },
  });

  const catHome = await prisma.category.upsert({
    where: { slug: "home-kitchen" },
    update: {},
    create: {
      name: "Home & Kitchen",
      slug: "home-kitchen",
      description: "Cookware and decor",
    },
  });

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
      categoryId: catHome.id,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: {
        vendorId_slug: { vendorId: vendor.id, slug: p.slug },
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
        vendorId: vendor.id,
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
  console.log("  Admin:    admin@cleverlocale.local    / Cleverlocale123!");
  console.log("  Vendor:   vendor@cleverlocale.local   / Cleverlocale123!");
  console.log("  Customer: customer@cleverlocale.local / Cleverlocale123!");
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
