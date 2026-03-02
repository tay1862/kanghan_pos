import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; station: string }> }
) {
  try {
    const { slug, station } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug) {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }

    const stationMap: Record<string, string> = {
      kitchen: "KITCHEN",
      cafe: "CAFE",
      water: "WATER",
    };
    const stationEnum = stationMap[station];
    if (!stationEnum) {
      return NextResponse.json({ error: "ສະຖານີບໍ່ຖືກຕ້ອງ" }, { status: 400 });
    }

    const activeShift = await prisma.shift.findFirst({
      where: { restaurantId: session.restaurantId, status: "OPEN" },
    });

    if (!activeShift) {
      return NextResponse.json({ items: [] });
    }

    const rounds = await prisma.orderRound.findMany({
      where: {
        order: {
          restaurantId: session.restaurantId,
          shiftId: activeShift.id,
          status: { in: ["OPEN", "CHECKOUT_REQUESTED"] },
        },
        items: {
          some: {
            status: { in: ["PENDING", "COOKING", "DONE"] },
            menuItem: { category: { station: stationEnum as "KITCHEN" | "CAFE" | "WATER" } },
          },
        },
      },
      include: {
        order: {
          include: { table: true },
        },
        items: {
          where: {
            status: { in: ["PENDING", "COOKING", "DONE"] },
            menuItem: { category: { station: stationEnum as "KITCHEN" | "CAFE" | "WATER" } },
          },
          include: {
            menuItem: { include: { category: true } },
            voidLog: true,
          },
          orderBy: { menuItem: { name: "asc" } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const kdsItems = rounds.map((round) => ({
      roundId: round.id,
      orderId: round.orderId,
      roundNumber: round.roundNumber,
      createdAt: round.createdAt,
      tableLabel: round.order.table.number
        ? `ໂຕ໊ະ ${round.order.table.number}`
        : round.order.table.customName || "ໂຕ໊ະທົ່ວໄປ",
      items: round.items,
    }));

    return NextResponse.json({ items: kdsItems });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
