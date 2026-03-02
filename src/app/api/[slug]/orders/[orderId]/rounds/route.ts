import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; orderId: string }> }
) {
  try {
    const { slug, orderId } = await params;
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

    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId: session.restaurantId },
    });
    if (!order || order.status === "PAID" || order.status === "VOIDED") {
      return NextResponse.json({ error: "ບໍ່ສາມາດເພີ່ມລາຍການໄດ້" }, { status: 400 });
    }

    const { items } = await request.json();
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "ກະລຸນາເລືອກເມນູ" }, { status: 400 });
    }

    const menuItemIds = items.map((i: { menuItemId: string }) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: session.restaurantId,
      },
    });

    const unavailable = menuItems.filter((m) => !m.available);
    if (unavailable.length > 0) {
      return NextResponse.json(
        { error: `${unavailable[0].name} ໝົດແລ້ວ` },
        { status: 400 }
      );
    }

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

    const lastRound = await prisma.orderRound.findFirst({
      where: { orderId },
      orderBy: { roundNumber: "desc" },
    });
    const nextRoundNumber = (lastRound?.roundNumber || 0) + 1;

    const round = await prisma.orderRound.create({
      data: {
        orderId,
        roundNumber: nextRoundNumber,
        createdBy: session.userId,
        items: {
          create: items.map((item: { menuItemId: string; quantity: number; notes?: string }) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity || 1,
            unitPrice: menuItemMap.get(item.menuItemId)?.price || 0,
            notes: item.notes || null,
            status: "PENDING",
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: { include: { category: true } },
          },
        },
      },
    });

    return NextResponse.json({ round });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
