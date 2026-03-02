import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ log: ["error"] });

async function main() {
  console.log("🌱 Seeding Kanghan POS...");

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "kanghan" },
    update: {},
    create: {
      name: "ຮ້ານຄ້ວ້ານຄານ",
      slug: "kanghan",
      serviceChargePercent: 0,
      currency: "LAK",
      active: true,
    },
  });
  console.log("✅ Restaurant:", restaurant.name);

  const usersData = [
    { name: "ຜູ້ດູແລລະບົບ", pin: "1234", role: "ADMIN" as const },
    { name: "ນ້ອງ A (ພະນັກງານ)", pin: "2222", role: "SERVER" as const },
    { name: "ນ້ອງ B (ພະນັກງານ)", pin: "3333", role: "SERVER" as const },
    { name: "ຄົວ 1", pin: "4444", role: "KITCHEN" as const },
    { name: "ຄົວ 2", pin: "5555", role: "KITCHEN" as const },
    { name: "ກາເຟ", pin: "6666", role: "CAFE" as const },
    { name: "ນ້ຳ", pin: "7777", role: "WATER" as const },
  ];

  for (const u of usersData) {
    const hashedPin = await bcrypt.hash(u.pin, 10);
    await prisma.user.upsert({
      where: { id: `seed-user-${u.pin}` },
      update: {},
      create: {
        id: `seed-user-${u.pin}`,
        restaurantId: restaurant.id,
        name: u.name,
        pin: hashedPin,
        role: u.role,
        active: true,
      },
    });
    console.log(`✅ User: ${u.name} (PIN: ${u.pin})`);
  }

  const categoriesData = [
    { name: "ອາຫານຈານດ່ວນ", station: "KITCHEN" as const, sortOrder: 1 },
    { name: "ອາຫານປີ້ງ", station: "KITCHEN" as const, sortOrder: 2 },
    { name: "ອາຫານທານຫຼິ້ນ", station: "KITCHEN" as const, sortOrder: 3 },
    { name: "ກາເຟ ແລະ ຊາ", station: "CAFE" as const, sortOrder: 4 },
    { name: "ເຄື່ອງດື່ມສົດ", station: "CAFE" as const, sortOrder: 5 },
    { name: "ນ້ຳດື່ມ ແລະ ນ້ຳດ່ຽວ", station: "WATER" as const, sortOrder: 6 },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { id: `seed-cat-${c.sortOrder}` },
      update: {},
      create: {
        id: `seed-cat-${c.sortOrder}`,
        restaurantId: restaurant.id,
        name: c.name,
        station: c.station,
        sortOrder: c.sortOrder,
        active: true,
      },
    });
    categories[c.name] = cat.id;
    console.log(`✅ Category: ${c.name}`);
  }

  const menuData = [
    { name: "ເຂົ້າໜົມຈີນ", price: 25000, cat: "ອາຫານຈານດ່ວນ", sort: 1 },
    { name: "ເຂົ້າໝ້ຽວ", price: 20000, cat: "ອາຫານຈານດ່ວນ", sort: 2 },
    { name: "ເຂົ້າຜັດ", price: 30000, cat: "ອາຫານຈານດ່ວນ", sort: 3 },
    { name: "ໝີ່ຜັດ", price: 25000, cat: "ອາຫານຈານດ່ວນ", sort: 4 },
    { name: "ໄກ່ປີ້ງ (ໜ່ວຍ)", price: 45000, cat: "ອາຫານປີ້ງ", sort: 1 },
    { name: "ໝູປີ້ງ (ໝໍ້)", price: 35000, cat: "ອາຫານປີ້ງ", sort: 2 },
    { name: "ປາປີ້ງ (ໜ່ວຍ)", price: 55000, cat: "ອາຫານປີ້ງ", sort: 3 },
    { name: "ແຊ່ວຫໝາກເຜັດ", price: 15000, cat: "ອາຫານທານຫຼິ້ນ", sort: 1 },
    { name: "ຕຳໝາກຫຸ່ງ", price: 20000, cat: "ອາຫານທານຫຼິ້ນ", sort: 2 },
    { name: "ລາບໄກ່", price: 35000, cat: "ອາຫານທານຫຼິ້ນ", sort: 3 },
    { name: "ກາເຟດຳ", price: 15000, cat: "ກາເຟ ແລະ ຊາ", sort: 1 },
    { name: "ກາເຟນົມ", price: 18000, cat: "ກາເຟ ແລະ ຊາ", sort: 2 },
    { name: "ຊາຮ້ອນ", price: 12000, cat: "ກາເຟ ແລະ ຊາ", sort: 3 },
    { name: "ກາເຟເຢັນ", price: 20000, cat: "ກາເຟ ແລະ ຊາ", sort: 4 },
    { name: "ນ້ຳໝາກໄມ້ (ແກ້ວ)", price: 25000, cat: "ເຄື່ອງດື່ມສົດ", sort: 1 },
    { name: "ນ້ຳໝາກນາວ", price: 20000, cat: "ເຄື່ອງດື່ມສົດ", sort: 2 },
    { name: "ນ້ຳໝາກຕ້ຽວ", price: 22000, cat: "ເຄື່ອງດື່ມສົດ", sort: 3 },
    { name: "ນ້ຳດື່ມ", price: 5000, cat: "ນ້ຳດື່ມ ແລະ ນ້ຳດ່ຽວ", sort: 1 },
    { name: "ນ້ຳອ່ວຍ", price: 10000, cat: "ນ້ຳດື່ມ ແລະ ນ້ຳດ່ຽວ", sort: 2 },
    { name: "ນ້ຳດ່ຽວ", price: 12000, cat: "ນ້ຳດື່ມ ແລະ ນ້ຳດ່ຽວ", sort: 3 },
  ];

  for (let i = 0; i < menuData.length; i++) {
    const m = menuData[i];
    const catId = categories[m.cat];
    if (!catId) continue;
    await prisma.menuItem.upsert({
      where: { id: `seed-menu-${i + 1}` },
      update: {},
      create: {
        id: `seed-menu-${i + 1}`,
        restaurantId: restaurant.id,
        categoryId: catId,
        name: m.name,
        price: m.price,
        available: true,
        sortOrder: m.sort,
      },
    });
    console.log(`✅ Menu: ${m.name} - ${m.price.toLocaleString()} ກີບ`);
  }

  for (let i = 1; i <= 20; i++) {
    await prisma.table.upsert({
      where: { id: `seed-table-${i}` },
      update: {},
      create: {
        id: `seed-table-${i}`,
        restaurantId: restaurant.id,
        number: i,
        status: "AVAILABLE",
        isActive: true,
      },
    });
  }
  console.log("✅ Tables 1-20 created");

  console.log("\n🎉 Seed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("URL: http://localhost:3000/kanghan/login");
  console.log("PINs:");
  console.log("  Admin:  1234");
  console.log("  ພະນັກງານ: 2222 / 3333");
  console.log("  ຄົວ:    4444 / 5555");
  console.log("  ກາເຟ:   6666");
  console.log("  ນ້ຳ:    7777");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
