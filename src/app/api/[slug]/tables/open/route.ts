import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug) {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }

    const shift = await prisma.shift.findFirst({
      where: { restaurantId: session.restaurantId, status: "OPEN" },
    });
    if (!shift) {
      return NextResponse.json({ error: "ບໍ່ມີກະທີ່ເປີດ" }, { status: 409 });
    }

    const { tableId, customName, guestCount } = await request.json();

    let table;
    if (tableId) {
      table = await prisma.table.findFirst({
        where: { id: tableId, restaurantId: session.restaurantId },
      });
      if (!table) {
        return NextResponse.json({ error: "ບໍ່ພົບໂຕ໊ະ" }, { status: 404 });
      }
      if (table.status !== "AVAILABLE") {
        return NextResponse.json(
          { error: "ໂຕ໊ະນີ້ມີລູກຄ້າຢູ່ແລ້ວ" },
          { status: 409 }
        );
      }
    } else if (customName) {
      table = await prisma.table.create({
        data: {
          restaurantId: session.restaurantId,
          customName,
          status: "AVAILABLE",
          isActive: true,
        },
      });
    } else {
      return NextResponse.json(
        { error: "ກະລຸນາເລືອກໂຕ໊ະ ຫຼື ໃສ່ຊື່ໂຕ໊ະ" },
        { status: 400 }
      );
    }

    await prisma.table.update({
      where: { id: table.id },
      data: { status: "OCCUPIED" },
    });

    const order = await prisma.order.create({
      data: {
        restaurantId: session.restaurantId,
        tableId: table.id,
        shiftId: shift.id,
        status: "OPEN",
        guestCount: guestCount || 1,
        createdBy: session.userId,
      },
      include: {
        table: true,
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
