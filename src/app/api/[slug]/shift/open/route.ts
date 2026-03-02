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

    const existing = await prisma.shift.findFirst({
      where: { restaurantId: session.restaurantId, status: "OPEN" },
    });
    if (existing) {
      return NextResponse.json({ error: "ມີກະທີ່ເປີດຢູ່ແລ້ວ" }, { status: 409 });
    }

    const { openingCash = 0 } = await request.json();

    const shift = await prisma.shift.create({
      data: {
        restaurantId: session.restaurantId,
        openedBy: session.userId,
        openingCash,
        status: "OPEN",
      },
      include: { opener: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ shift });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
