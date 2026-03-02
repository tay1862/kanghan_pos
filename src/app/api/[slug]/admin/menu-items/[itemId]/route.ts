import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string; itemId: string }> }) {
  try {
    const { slug, itemId } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }
    const data = await request.json();
    const item = await prisma.menuItem.update({
      where: { id: itemId, restaurantId: session.restaurantId },
      data,
      include: { category: true },
    });
    return NextResponse.json({ item });
  } catch (error) { console.error(error); return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string; itemId: string }> }) {
  try {
    const { slug, itemId } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }
    await prisma.menuItem.delete({ where: { id: itemId, restaurantId: session.restaurantId } });
    return NextResponse.json({ success: true });
  } catch (error) { console.error(error); return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 }); }
}
