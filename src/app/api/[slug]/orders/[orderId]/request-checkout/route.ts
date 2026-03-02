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

    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId: session.restaurantId, status: "OPEN" },
    });
    if (!order) {
      return NextResponse.json({ error: "ບໍ່ພົບອໍເດີ" }, { status: 404 });
    }

    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: "CHECKOUT_REQUESTED" },
      }),
      prisma.table.update({
        where: { id: order.tableId },
        data: { status: "CHECKOUT" },
      }),
    ]);

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
