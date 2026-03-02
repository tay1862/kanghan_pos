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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";

    const now = new Date();
    let startDate: Date;
    if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [payments, topItems] = await Promise.all([
      prisma.payment.findMany({
        where: { order: { restaurantId: session.restaurantId }, paidAt: { gte: startDate } },
        select: { total: true, method: true, paidAt: true },
      }),
      prisma.orderItem.groupBy({
        by: ["menuItemId"],
        where: {
          status: { not: "VOIDED" },
          round: { order: { restaurantId: session.restaurantId, status: "PAID", updatedAt: { gte: startDate } } },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),
    ]);

    const menuItemIds = topItems.map((i: { menuItemId: string }) => i.menuItemId);
    const menuItemNames = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, price: true },
    });
    const nameMap = new Map<string, { id: string; name: string; price: number }>(
      menuItemNames.map((m: { id: string; name: string; price: number }) => [m.id, m] as [string, { id: string; name: string; price: number }])
    );

    const totalRevenue = payments.reduce((sum: number, p: { total: number }) => sum + p.total, 0);
    const cashRevenue = payments.filter((p: { method: string }) => p.method === "CASH").reduce((sum: number, p: { total: number }) => sum + p.total, 0);
    const qrRevenue = payments.filter((p: { method: string }) => p.method === "QR").reduce((sum: number, p: { total: number }) => sum + p.total, 0);

    const dailyMap = new Map<string, number>();
    for (const p of payments as Array<{ total: number; paidAt: Date }>) {
      const day = p.paidAt.toISOString().split("T")[0];
      dailyMap.set(day, (dailyMap.get(day) || 0) + p.total);
    }

    return NextResponse.json({
      summary: { totalRevenue, cashRevenue, qrRevenue, orderCount: payments.length },
      dailySales: Array.from(dailyMap.entries()).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date)),
      topItems: topItems.map((item: { menuItemId: string; _sum: { quantity: number | null } }) => ({
        menuItemId: item.menuItemId,
        name: nameMap.get(item.menuItemId)?.name || "ບໍ່ຮູ້",
        totalQty: item._sum.quantity || 0,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
