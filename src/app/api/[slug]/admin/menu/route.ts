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
    const allowed = ["ADMIN", "SERVER"];
    if (!session || session.restaurantSlug !== slug || !allowed.includes(session.role)) {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: { restaurantId: session.restaurantId },
      orderBy: { sortOrder: "asc" },
      include: {
        menuItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
