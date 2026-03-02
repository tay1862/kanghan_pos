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

    const allowedRoles = ["ADMIN", "KITCHEN", "CAFE", "WATER"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 403 });
    }

    const { available } = await request.json();
    const item = await prisma.menuItem.update({
      where: { id: itemId, restaurantId: session.restaurantId },
      data: { available },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
