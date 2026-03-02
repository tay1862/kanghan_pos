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

    const { orderId, toTableId } = await request.json();

    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId: session.restaurantId },
    });
    if (!order) {
      return NextResponse.json({ error: "ບໍ່ພົບອໍເດີ" }, { status: 404 });
    }

    const targetTable = await prisma.table.findFirst({
      where: { id: toTableId, restaurantId: session.restaurantId },
    });
    if (!targetTable || targetTable.status !== "AVAILABLE") {
      return NextResponse.json({ error: "ໂຕ໊ະປາຍທາງບໍ່ວ່າງ" }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.table.update({
        where: { id: order.tableId },
        data: { status: "AVAILABLE" },
      }),
      prisma.table.update({
        where: { id: toTableId },
        data: { status: order.status === "CHECKOUT_REQUESTED" ? "CHECKOUT" : "OCCUPIED" },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { tableId: toTableId },
      }),
    ]);

    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
