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
    const tables = await prisma.table.findMany({
      where: { restaurantId: session.restaurantId, customName: null },
      orderBy: { number: "asc" },
    });
    return NextResponse.json({ tables });
  } catch (error) { console.error(error); return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 }); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }
    const body = await request.json();

    if (body.id !== undefined) {
      const table = await prisma.table.update({
        where: { id: body.id, restaurantId: session.restaurantId },
        data: { isActive: body.isActive },
      });
      return NextResponse.json({ table });
    }

    const { number } = body;
    if (!number) return NextResponse.json({ error: "ກະລຸນາໃສ່ເລກໂຕ໊ະ" }, { status: 400 });
    const existing = await prisma.table.findFirst({
      where: { restaurantId: session.restaurantId, number },
    });
    if (existing) return NextResponse.json({ error: "ມີໂຕ໊ະເລກນີ້ແລ້ວ" }, { status: 409 });
    const table = await prisma.table.create({
      data: { restaurantId: session.restaurantId, number, status: "AVAILABLE", isActive: true },
    });
    return NextResponse.json({ table });
  } catch (error) { console.error(error); return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 }); }
}
