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
    { name: "ອາຫານທອດ", station: "KITCHEN" as const, sortOrder: 1 },
    { name: "ອາຫານຈືນ", station: "KITCHEN" as const, sortOrder: 2 },
    { name: "ສະປາເກັດຕີ້", station: "KITCHEN" as const, sortOrder: 3 },
    { name: "ອາຫານປາ", station: "KITCHEN" as const, sortOrder: 4 },
    { name: "ເມນູພັນ", station: "KITCHEN" as const, sortOrder: 5 },
    { name: "ສະຫຼັດ ແລະ ໄຂ່", station: "KITCHEN" as const, sortOrder: 6 },
    { name: "ຜັດຜັກ", station: "KITCHEN" as const, sortOrder: 7 },
    { name: "ຍຳ", station: "KITCHEN" as const, sortOrder: 8 },
    { name: "ລວກ", station: "KITCHEN" as const, sortOrder: 9 },
    { name: "ຕຳ", station: "KITCHEN" as const, sortOrder: 10 },
    { name: "ຕົ້ມ/ແກງ", station: "KITCHEN" as const, sortOrder: 11 },
    { name: "ກ້ອຍ ແລະ ແຊວມ້ອນ", station: "KITCHEN" as const, sortOrder: 12 },
    { name: "ເຂົ້າຜັດ", station: "KITCHEN" as const, sortOrder: 13 },
    { name: "ເຂົ້າຈ້າວ/ເຂົ້າໜຽວ", station: "KITCHEN" as const, sortOrder: 14 },
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
    // ອາຫານທອດ
    { name: "ທອດມັນຝຣັ່ງ", price: 50000, cat: "ອາຫານທອດ", sort: 1 },
    { name: "ທອດເອັນເຫຼືອງ", price: 89000, cat: "ອາຫານທອດ", sort: 2 },
    { name: "ທອດເອັນໄກ່", price: 69000, cat: "ອາຫານທອດ", sort: 3 },
    { name: "ທອດກະດູກຂ້າງ", price: 89000, cat: "ອາຫານທອດ", sort: 4 },
    { name: "ປີກໄກ່ທອດນໍ້າປາ", price: 69000, cat: "ອາຫານທອດ", sort: 5 },
    { name: "ທອດນັກເກັດໄກ່", price: 49000, cat: "ອາຫານທອດ", sort: 6 },
    { name: "ໄກ່ທອດເກົາຫຼີ", price: 59000, cat: "ອາຫານທອດ", sort: 7 },
    { name: "ປໍເປ້ຍທອດ", price: 65000, cat: "ອາຫານທອດ", sort: 8 },
    { name: "ທອດເຫັດສາມສະຫາຍ", price: 60000, cat: "ອາຫານທອດ", sort: 9 },
    { name: "ທອດຂາໄກ່", price: 79000, cat: "ອາຫານທອດ", sort: 10 },

    // ອາຫານຈືນ
    { name: "ຈືນລູກຊີ້ນ", price: 40000, cat: "ອາຫານຈືນ", sort: 1 },
    { name: "ຈືນຮ໋ອດດ໋ອກ", price: 40000, cat: "ອາຫານຈືນ", sort: 2 },
    { name: "ຈືນລວມ", price: 50000, cat: "ອາຫານຈືນ", sort: 3 },

    // ສະປາເກັດຕີ້
    { name: "ສະປາເກັດຕີ້ຊອສໝາກເລັ່ນ", price: 80000, cat: "ສະປາເກັດຕີ້", sort: 1 },
    { name: "ສະປາເກັດຕີ້ຂີ້ເມົາທະເລ", price: 99000, cat: "ສະປາເກັດຕີ້", sort: 2 },

    // ອາຫານປາ
    { name: "ປາລາດພິກ", price: 139000, cat: "ອາຫານປາ", sort: 1 },
    { name: "ປາທອດກະທຽມ", price: 129000, cat: "ອາຫານປາ", sort: 2 },
    { name: "ປາທອດສະໝຸນໄພ", price: 139000, cat: "ອາຫານປາ", sort: 3 },
    { name: "ປາໜຶ້ງໝາກນາວ", price: 139000, cat: "ອາຫານປາ", sort: 4 },
    { name: "ປາຊາບະລົມຄວັນ", price: 99000, cat: "ອາຫານປາ", sort: 5 },

    // ເມນູພັນ
    { name: "ພັນປາ", price: 110000, cat: "ເມນູພັນ", sort: 1 },
    { name: "ພັນໝ້ຽງທະເລ", price: 115000, cat: "ເມນູພັນ", sort: 2 },
    { name: "ພັນໝ້ຽງກຸ້ງ", price: 120000, cat: "ເມນູພັນ", sort: 3 },

    // ສະຫຼັດ ແລະ ໄຂ່
    { name: "ສະຫຼັດລາວ", price: 79000, cat: "ສະຫຼັດ ແລະ ໄຂ່", sort: 1 },
    { name: "ປີ້ງນົມໝູ", price: 89000, cat: "ສະຫຼັດ ແລະ ໄຂ່", sort: 2 },
    { name: "ປິ້ງລວມ", price: 60000, cat: "ສະຫຼັດ ແລະ ໄຂ່", sort: 3 },
    { name: "ໄຂ່ຈຽວໝູສັບ", price: 45000, cat: "ສະຫຼັດ ແລະ ໄຂ່", sort: 4 },
    { name: "ໄຂ່ຈຽວກຸ້ງສັບ", price: 60000, cat: "ສະຫຼັດ ແລະ ໄຂ່", sort: 5 },

    // ຜັດຜັກ
    { name: "ກະລໍ່ານໍ້າປາ", price: 40000, cat: "ຜັດຜັກ", sort: 1 },
    { name: "ຜັດຜັກບົ້ງໄຟແດງ", price: 49000, cat: "ຜັດຜັກ", sort: 2 },
    { name: "ຜັດຜັກລວມມິດ", price: 59000, cat: "ຜັດຜັກ", sort: 3 },
    { name: "ຜັດເຫັດລວມ", price: 69000, cat: "ຜັດຜັກ", sort: 4 },

    // ຍຳ
    { name: "ຍຳທະເລລວມ", price: 129000, cat: "ຍຳ", sort: 1 },
    { name: "ຍຳກຸ້ງ", price: 119000, cat: "ຍຳ", sort: 2 },
    { name: "ຍຳປາມຶກ", price: 119000, cat: "ຍຳ", sort: 3 },
    { name: "ຍຳຢໍ່", price: 79000, cat: "ຍຳ", sort: 4 },

    // ລວກ
    { name: "ລວກທະເລ", price: 129000, cat: "ລວກ", sort: 1 },
    { name: "ລວກກຸ້ງ", price: 110000, cat: "ລວກ", sort: 2 },
    { name: "ລວກປາມຶກ", price: 110000, cat: "ລວກ", sort: 3 },

    // ຕຳ
    { name: "ຕຳໝາກຮຸ່ງ", price: 40000, cat: "ຕຳ", sort: 1 },
    { name: "ຕຳໝີ່ໄວໆ", price: 50000, cat: "ຕຳ", sort: 2 },
    { name: "ຕຳເສັ້ນແກ້ວ", price: 50000, cat: "ຕຳ", sort: 3 },
    { name: "ຕຳຕ່ອນ", price: 65000, cat: "ຕຳ", sort: 4 },
    { name: "ຕຳເສັ້ນປາມຶກກອບ", price: 55000, cat: "ຕຳ", sort: 5 },
    { name: "ຕຳກຸ້ງ", price: 89000, cat: "ຕຳ", sort: 6 },
    { name: "ຕຳໝີ່ຂາວ", price: 50000, cat: "ຕຳ", sort: 7 },
    { name: "ຕຳເຂົ້າປຽກ", price: 50000, cat: "ຕຳ", sort: 8 },
    { name: "ຕຳທະເລລວມ", price: 119000, cat: "ຕຳ", sort: 9 },

    // ຕົ້ມ/ແກງ
    { name: "ຕົ້ມຍຳກຸ້ງ ນໍ້າຂຸ້ນ", price: 129000, cat: "ຕົ້ມ/ແກງ", sort: 1 },
    { name: "ຕົ້ມຍຳກຸ້ງນໍ້າໃສ", price: 129000, cat: "ຕົ້ມ/ແກງ", sort: 2 },
    { name: "ຕົ້ມຍຳທະເລ ນໍ້າຂຸ້ນ", price: 139000, cat: "ຕົ້ມ/ແກງ", sort: 3 },
    { name: "ຕົ້ມຍຳນໍ້າໃສ", price: 139000, cat: "ຕົ້ມ/ແກງ", sort: 4 },
    { name: "ຕົ້ມແຊ່ບກະດູກຂ້າງ", price: 110000, cat: "ຕົ້ມ/ແກງ", sort: 5 },
    { name: "ຕົ້ມຍຳປານິນ", price: 80000, cat: "ຕົ້ມ/ແກງ", sort: 6 },
    { name: "ຕົ້ມຍຳໝູ", price: 110000, cat: "ຕົ້ມ/ແກງ", sort: 7 },
    { name: "ຕົ້ມຍຳໄກ່", price: 110000, cat: "ຕົ້ມ/ແກງ", sort: 8 },
    { name: "ຕົ້ມຍຳງົວ", price: 110000, cat: "ຕົ້ມ/ແກງ", sort: 9 },
    { name: "ແກງປາເຄິງ", price: 110000, cat: "ຕົ້ມ/ແກງ", sort: 10 },
    { name: "ຕົ້ມປາເຄິງ", price: 110000, cat: "ຕົ້ມ/ແກງ", sort: 11 },

    // ກ້ອຍ ແລະ ແຊວມ້ອນ
    { name: "ກ້ອຍປາເຄິງ", price: 100000, cat: "ກ້ອຍ ແລະ ແຊວມ້ອນ", sort: 1 },
    { name: "ກ້ອຍປານິນ", price: 89000, cat: "ກ້ອຍ ແລະ ແຊວມ້ອນ", sort: 2 },
    { name: "ກ້ອຍປາແຊວມ້ອນ", price: 139000, cat: "ກ້ອຍ ແລະ ແຊວມ້ອນ", sort: 3 },
    { name: "ແຊວມ້ອນຊາຊິມິ", price: 119000, cat: "ກ້ອຍ ແລະ ແຊວມ້ອນ", sort: 4 },

    // ເຂົ້າຜັດ
    { name: "ເຂົ້າຜັດໄຂ່ ນ້ອຍ", price: 50000, cat: "ເຂົ້າຜັດ", sort: 1 },
    { name: "ເຂົ້າຜັດໄຂ່ ໃຫຍ່", price: 80000, cat: "ເຂົ້າຜັດ", sort: 2 },
    { name: "ເຂົ້າຜັດໝູ ນ້ອຍ", price: 50000, cat: "ເຂົ້າຜັດ", sort: 3 },
    { name: "ເຂົ້າຜັດໝູ ໃຫຍ່", price: 99000, cat: "ເຂົ້າຜັດ", sort: 4 },
    { name: "ເຂົ້າຜັດໄກ່ ນ້ອຍ", price: 50000, cat: "ເຂົ້າຜັດ", sort: 5 },
    { name: "ເຂົ້າຜັດໄກ່ ໃຫຍ່", price: 99000, cat: "ເຂົ້າຜັດ", sort: 6 },
    { name: "ເຂົ້າຜັດງົວ ນ້ອຍ", price: 60000, cat: "ເຂົ້າຜັດ", sort: 7 },
    { name: "ເຂົ້າຜັດງົວ ໃຫຍ່", price: 110000, cat: "ເຂົ້າຜັດ", sort: 8 },
    { name: "ເຂົ້າຜັດທະເລ ນ້ອຍ", price: 60000, cat: "ເຂົ້າຜັດ", sort: 9 },
    { name: "ເຂົ້າຜັດທະເລ ໃຫຍ່", price: 110000, cat: "ເຂົ້າຜັດ", sort: 10 },

    // ເຂົ້າຈ້າວ/ເຂົ້າໜຽວ
    { name: "ເຂົ້າຈ້າວ ຈານ", price: 20000, cat: "ເຂົ້າຈ້າວ/ເຂົ້າໜຽວ", sort: 1 },
    { name: "ເຂົ້າຈ້າວ ໝໍ້", price: 50000, cat: "ເຂົ້າຈ້າວ/ເຂົ້າໜຽວ", sort: 2 },
    { name: "ເຂົ້າໜຽວ ຕິບ", price: 18000, cat: "ເຂົ້າຈ້າວ/ເຂົ້າໜຽວ", sort: 3 },
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
