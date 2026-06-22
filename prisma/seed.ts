import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { catalog } from "./catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始种子数据...");

  const adminPwd = await bcrypt.hash("admin123", 10);
  const userPwd = await bcrypt.hash("user123", 10);

  await prisma.user.upsert({
    where: { email: "admin@sale.local" },
    update: {},
    create: {
      email: "admin@sale.local",
      passwordHash: adminPwd,
      name: "管理员",
      role: "ADMIN",
    },
  });
  await prisma.user.upsert({
    where: { email: "demo@sale.local" },
    update: {},
    create: {
      email: "demo@sale.local",
      passwordHash: userPwd,
      name: "演示用户",
      role: "USER",
    },
  });
  console.log("✓ 用户: admin@sale.local / admin123, demo@sale.local / user123");

  let catIdx = 0;
  let productCount = 0;
  let variantCount = 0;

  for (const cat of catalog) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, sortOrder: catIdx },
      create: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        sortOrder: catIdx,
      },
    });
    catIdx++;

    const activeSlugs = cat.products.map((p) => p.slug);
    await prisma.product.updateMany({
      where: {
        categoryId: category.id,
        slug: { notIn: activeSlugs },
      },
      data: { status: "HIDDEN" },
    });

    let prodIdx = 0;
    for (const p of cat.products) {
      const product = await prisma.product.upsert({
        where: { slug: p.slug },
        update: {
          name: p.name,
          description: p.description,
          image: p.image ?? null,
          region: p.region,
          deliveryType: p.deliveryType,
          status: "ACTIVE",
          accountFields: JSON.stringify(p.accountFields),
          categoryId: category.id,
          sortOrder: prodIdx,
        },
        create: {
          slug: p.slug,
          name: p.name,
          description: p.description,
          image: p.image ?? null,
          region: p.region,
          deliveryType: p.deliveryType,
          status: "ACTIVE",
          accountFields: JSON.stringify(p.accountFields),
          categoryId: category.id,
          sortOrder: prodIdx,
        },
      });
      prodIdx++;
      productCount++;

      await prisma.productVariant.deleteMany({ where: { productId: product.id } });
      let vIdx = 0;
      for (const v of p.variants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: v.name,
            price: v.price,
            cost: v.cost ?? 0,
            currency: v.currency ?? p.currency,
            stock: v.stock ?? -1,
            sortOrder: vIdx,
          },
        });
        vIdx++;
        variantCount++;
      }
    }
  }

  console.log(
    `✓ ${catalog.length} 个分类, ${productCount} 个商品, ${variantCount} 个规格`
  );
  console.log("🌱 完成");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
