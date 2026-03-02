import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string; categoryId: string }> }) {
  try {
    const { slug, categoryId } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }
    const data = await request.json();
    const category = await prisma.category.update({
      where: { id: categoryId, restaurantId: session.restaurantId },
      data,
    });
    return NextResponse.json({ category });
  } catch (error) { console.error(error); return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string; categoryId: string }> }) {
  try {
    const { slug, categoryId } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }
    await prisma.category.update({
      where: { id: categoryId, restaurantId: session.restaurantId },
      data: { active: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) { console.error(error); return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 }); }
}
