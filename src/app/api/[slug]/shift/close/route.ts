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
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }

    const shift = await prisma.shift.findFirst({
      where: { restaurantId: session.restaurantId, status: "OPEN" },
    });
    if (!shift) {
      return NextResponse.json({ error: "ບໍ່ພົບກະທີ່ເປີດ" }, { status: 404 });
    }

    const openTables = await prisma.order.count({
      where: {
        shiftId: shift.id,
        status: { in: ["OPEN", "CHECKOUT_REQUESTED"] },
      },
    });
    if (openTables > 0) {
      return NextResponse.json(
        { error: `ຍັງມີ ${openTables} ໂຕ໊ະທີ່ຍັງບໍ່ໄດ້ຊຳລະ` },
        { status: 409 }
      );
    }

    const { closingCash = 0, notes = "" } = await request.json();

    const [cashPayments, qrPayments, discountTotal, voidItems] =
      await Promise.all([
        prisma.payment.aggregate({
          where: { order: { shiftId: shift.id }, method: "CASH" },
          _sum: { total: true },
        }),
        prisma.payment.aggregate({
          where: { order: { shiftId: shift.id }, method: "QR" },
          _sum: { total: true },
        }),
        prisma.payment.aggregate({
          where: { order: { shiftId: shift.id } },
          _sum: { discountValue: true },
        }),
        prisma.orderItem.count({
          where: {
            round: { order: { shiftId: shift.id } },
            status: "VOIDED",
          },
        }),
      ]);

    const updatedShift = await prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closingCash,
        notes,
      },
    });

    await prisma.table.updateMany({
      where: { restaurantId: session.restaurantId, customName: { not: null } },
      data: { isActive: false, status: "AVAILABLE" },
    });

    return NextResponse.json({
      shift: updatedShift,
      summary: {
        cashTotal: cashPayments._sum.total || 0,
        qrTotal: qrPayments._sum.total || 0,
        discountTotal: discountTotal._sum.discountValue || 0,
        voidCount: voidItems,
        expectedCash: shift.openingCash + (cashPayments._sum.total || 0),
        actualCash: closingCash,
        difference: closingCash - shift.openingCash - (cashPayments._sum.total || 0),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
