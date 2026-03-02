import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug) {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }

    const tables = await prisma.table.findMany({
      where: { restaurantId: session.restaurantId, isActive: true },
      orderBy: [{ number: "asc" }, { customName: "asc" }],
      include: {
        orders: {
          where: { status: { in: ["OPEN", "CHECKOUT_REQUESTED"] } },
          select: { id: true, status: true },
          take: 1,
        },
      },
    });

    const tablesWithOrder = tables.map((t) => ({
      id: t.id,
      number: t.number,
      customName: t.customName,
      status: t.status,
      isActive: t.isActive,
      activeOrderId: t.orders[0]?.id || null,
      activeOrderStatus: t.orders[0]?.status || null,
    }));

    return NextResponse.json({ tables: tablesWithOrder });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
