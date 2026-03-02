import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string; userId: string }> }) {
  try {
    const { slug, userId } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }
    const { name, pin, role, active } = await request.json();
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (typeof active === "boolean") updateData.active = active;
    if (pin) {
      if (pin.length < 4 || pin.length > 6) return NextResponse.json({ error: "PIN ຕ້ອງມີ 4-6 ຕົວເລກ" }, { status: 400 });
      updateData.pin = await bcrypt.hash(pin, 10);
    }
    const user = await prisma.user.update({
      where: { id: userId, restaurantId: session.restaurantId },
      data: updateData,
      select: { id: true, name: true, role: true, active: true },
    });
    return NextResponse.json({ user });
  } catch (error) { console.error(error); return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 }); }
}
