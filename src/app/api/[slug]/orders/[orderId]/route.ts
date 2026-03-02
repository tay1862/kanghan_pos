import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; orderId: string }> }
) {
  try {
    const { slug, orderId } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug) {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId: session.restaurantId },
      include: {
        table: true,
        creator: { select: { id: true, name: true } },
        rounds: {
          orderBy: { roundNumber: "asc" },
          include: {
            creator: { select: { id: true, name: true } },
            items: {
              include: {
                menuItem: {
                  include: { category: true },
                },
                voidLog: true,
              },
              orderBy: { menuItem: { name: "asc" } },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ບໍ່ພົບອໍເດີ" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
