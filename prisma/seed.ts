import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

interface SeedProduct {
  sku: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
}

const PRODUCTS: SeedProduct[] = [
  {
    sku: "TSHIRT-001",
    title: "Classic Cotton T-Shirt",
    description:
      "A soft, breathable 100% cotton t-shirt that goes with everything. Pre-shrunk and built to last.",
    price: 24.99,
    stock: 120,
    images: ["https://picsum.photos/seed/tshirt/600/600"],
  },
  {
    sku: "HOODIE-001",
    title: "Everyday Fleece Hoodie",
    description:
      "Cozy midweight fleece hoodie with a kangaroo pocket and adjustable drawstring hood.",
    price: 54.5,
    stock: 60,
    images: ["https://picsum.photos/seed/hoodie/600/600"],
  },
  {
    sku: "MUG-001",
    title: "Ceramic Coffee Mug (12oz)",
    description:
      "Dishwasher- and microwave-safe ceramic mug with a comfortable handle. Perfect for your morning brew.",
    price: 14.0,
    stock: 200,
    images: ["https://picsum.photos/seed/mug/600/600"],
  },
  {
    sku: "BOTTLE-001",
    title: "Insulated Water Bottle (750ml)",
    description:
      "Double-walled stainless steel bottle that keeps drinks cold for 24 hours or hot for 12.",
    price: 32.95,
    stock: 0,
    images: ["https://picsum.photos/seed/bottle/600/600"],
  },
  {
    sku: "CAP-001",
    title: "Six-Panel Baseball Cap",
    description:
      "Adjustable structured cap with an embroidered logo and a curved brim.",
    price: 19.99,
    stock: 85,
    images: ["https://picsum.photos/seed/cap/600/600"],
  },
  {
    sku: "TOTE-001",
    title: "Canvas Tote Bag",
    description:
      "Heavy-duty canvas tote with reinforced handles - great for groceries or the beach.",
    price: 18.5,
    stock: 140,
    images: ["https://picsum.photos/seed/tote/600/600"],
  },
];

async function main(): Promise<void> {
  const adminPasswordHash = await bcrypt.hash("admin1234", 12);
  const customerPasswordHash = await bcrypt.hash("customer1234", 12);

  await prisma.user.upsert({
    where: { email: "admin@nextshop.dev" },
    update: {},
    create: {
      email: "admin@nextshop.dev",
      name: "Store Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      cart: { create: {} },
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@nextshop.dev" },
    update: {},
    create: {
      email: "customer@nextshop.dev",
      name: "Jane Customer",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
      cart: { create: {} },
    },
  });

  for (const product of PRODUCTS) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        title: product.title,
        description: product.description,
        price: product.price,
        stock: product.stock,
        images: product.images,
      },
      create: product,
    });
  }

  console.log(
    `Seeded ${PRODUCTS.length} products and 2 users.\n` +
      "  Admin:    admin@nextshop.dev / admin1234\n" +
      "  Customer: customer@nextshop.dev / customer1234",
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
