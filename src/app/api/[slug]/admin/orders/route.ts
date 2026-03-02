import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "PAID";
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          restaurantId: session.restaurantId,
          status: status as "PAID" | "OPEN" | "CHECKOUT_REQUESTED" | "VOIDED",
        },
        include: {
          table: true,
          creator: { select: { id: true, name: true } },
          payment: true,
          rounds: {
            include: {
              items: {
                include: {
                  menuItem: { select: { id: true, name: true } },
                  voidLog: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({
        where: {
          restaurantId: session.restaurantId,
          status: status as "PAID" | "OPEN" | "CHECKOUT_REQUESTED" | "VOIDED",
        },
      }),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
