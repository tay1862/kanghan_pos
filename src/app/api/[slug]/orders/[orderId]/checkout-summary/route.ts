import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; orderId: string }> }
) {
  try {
    const { slug, orderId } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug) {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId: session.restaurantId },
      include: {
        table: true,
        rounds: {
          include: {
            items: {
              where: { status: { not: "VOIDED" } },
              include: { menuItem: { include: { category: true } }, voidLog: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ບໍ່ພົບອໍເດີ" }, { status: 404 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.restaurantId },
    });

    const allItems = order.rounds.flatMap((r) => r.items);
    const subtotal = allItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const serviceChargePercent = restaurant?.serviceChargePercent || 0;
    const serviceChargeAmount = Math.round(subtotal * serviceChargePercent / 100);

    return NextResponse.json({
      summary: {
        subtotal,
        serviceChargePercent,
        serviceChargeAmount,
        total: subtotal + serviceChargeAmount,
        items: allItems,
        tableLabel: order.table.number
          ? `ໂຕ໊ະ ${order.table.number}`
          : order.table.customName || "ໂຕ໊ະທົ່ວໄປ",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
