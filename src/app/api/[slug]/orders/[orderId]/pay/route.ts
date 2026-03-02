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
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ສະເພາະ Admin ເທົ່ານັ້ນ" }, { status: 403 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId: session.restaurantId },
      include: {
        table: true,
        rounds: {
          include: {
            items: { where: { status: { not: "VOIDED" } } },
          },
        },
      },
    });

    if (!order || order.status === "PAID" || order.status === "VOIDED") {
      return NextResponse.json({ error: "ບໍ່ສາມາດຊຳລະໄດ້" }, { status: 400 });
    }

    const { method, discountType = "NONE", discountValue = 0, cashReceived } = await request.json();

    if (!["CASH", "QR"].includes(method)) {
      return NextResponse.json({ error: "ວິທີຊຳລະບໍ່ຖືກຕ້ອງ" }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.restaurantId },
    });

    const allItems = order.rounds.flatMap((r: { items: Array<{ unitPrice: number; quantity: number }> }) => r.items);
    const subtotal = allItems.reduce((sum: number, item: { unitPrice: number; quantity: number }) => sum + item.unitPrice * item.quantity, 0);
    const serviceChargePercent = restaurant?.serviceChargePercent || 0;
    const serviceChargeAmount = Math.round(subtotal * serviceChargePercent / 100);

    let discountAmount = 0;
    if (discountType === "PERCENT") {
      discountAmount = Math.round(subtotal * discountValue / 100);
    } else if (discountType === "FIXED") {
      discountAmount = discountValue;
    }

    const total = Math.max(0, subtotal + serviceChargeAmount - discountAmount);

    if (method === "CASH") {
      if (!cashReceived || cashReceived < total) {
        return NextResponse.json({ error: "ຍອດຮັບຕ່ຳກວ່າຍອດລວມ" }, { status: 400 });
      }
    }

    const changeAmount = method === "CASH" ? (cashReceived || 0) - total : 0;

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          orderId,
          method,
          subtotal,
          discountType,
          discountValue,
          serviceChargePercent,
          serviceChargeAmount,
          total,
          cashReceived: method === "CASH" ? cashReceived : null,
          changeAmount: method === "CASH" ? changeAmount : null,
          paidBy: session.userId,
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      }),
      prisma.table.update({
        where: { id: order.tableId },
        data: { status: "AVAILABLE" },
      }),
    ]);

    return NextResponse.json({
      payment,
      receiptData: {
        orderId,
        tableLabel: order.table.number
          ? `ໂຕ໊ະ ${order.table.number}`
          : order.table.customName || "ໂຕ໊ະທົ່ວໄປ",
        items: allItems,
        subtotal,
        serviceChargePercent,
        serviceChargeAmount,
        discountType,
        discountValue,
        discountAmount,
        total,
        method,
        cashReceived: method === "CASH" ? cashReceived : null,
        changeAmount: method === "CASH" ? changeAmount : null,
        paidAt: payment.paidAt,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
