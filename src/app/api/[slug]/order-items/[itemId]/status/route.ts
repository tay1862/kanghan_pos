import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> }
) {
  try {
    const { slug, itemId } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug) {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }

    const { status } = await request.json();
    const validStatuses = ["COOKING", "DONE", "SERVED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "ສະຖານະບໍ່ຖືກຕ້ອງ" }, { status: 400 });
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

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
      include: {
        menuItem: { include: { category: true } },
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
