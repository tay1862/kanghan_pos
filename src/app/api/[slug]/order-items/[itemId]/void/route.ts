import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> }
) {
  try {
    const { slug, itemId } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ສະເພາະ Admin ເທົ່ານັ້ນ" }, { status: 403 });
    }

    const { reason } = await request.json();
    if (!reason || reason.trim() === "") {
      return NextResponse.json({ error: "ກະລຸນາລະບຸເຫດຜົນ" }, { status: 400 });
    }

    const item = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        round: { order: { restaurantId: session.restaurantId } },
      },
    });
    if (!item) {
      return NextResponse.json({ error: "ບໍ່ພົບລາຍການ" }, { status: 404 });
    }
    if (item.status === "VOIDED") {
      return NextResponse.json({ error: "ລາຍການຖືກຍົກເລີກແລ້ວ" }, { status: 400 });
    }

    const [updatedItem, voidLog] = await prisma.$transaction([
      prisma.orderItem.update({
        where: { id: itemId },
        data: { status: "VOIDED" },
      }),
      prisma.voidLog.create({
        data: {
          orderItemId: itemId,
          voidedBy: session.userId,
          reason: reason.trim(),
        },
      }),
    ]);

    return NextResponse.json({ item: updatedItem, voidLog });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
