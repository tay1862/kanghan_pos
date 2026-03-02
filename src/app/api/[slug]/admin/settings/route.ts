import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.restaurantId },
    });
    return NextResponse.json({ settings: restaurant });
  } catch (error) { console.error(error); return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 }); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }
    const data = await request.json();
    const allowed = ["name", "serviceChargePercent", "qrImageUrl", "receiptConfig", "logoUrl"];
    const updateData: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in data) updateData[key] = data[key];
    }
    const restaurant = await prisma.restaurant.update({
      where: { id: session.restaurantId },
      data: updateData,
    });
    return NextResponse.json({ settings: restaurant });
  } catch (error) { console.error(error); return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 }); }
}
