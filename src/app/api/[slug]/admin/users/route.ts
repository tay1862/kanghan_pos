import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }
    const users = await prisma.user.findMany({
      where: { restaurantId: session.restaurantId },
      select: { id: true, name: true, role: true, active: true, createdAt: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ users });
  } catch (error) { console.error(error); return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 }); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session || session.restaurantSlug !== slug || session.role !== "ADMIN") {
      return NextResponse.json({ error: "ບໍ່ໄດ້ຮັບອະນຸຍາດ" }, { status: 401 });
    }
    const { name, pin, role } = await request.json();
    if (!name || !pin || !role) return NextResponse.json({ error: "ຂໍ້ມູນບໍ່ຄົບ" }, { status: 400 });
    if (pin.length < 4 || pin.length > 6) return NextResponse.json({ error: "PIN ຕ້ອງມີ 4-6 ຕົວເລກ" }, { status: 400 });
    const hashedPin = await bcrypt.hash(pin, 10);
    const user = await prisma.user.create({
      data: { restaurantId: session.restaurantId, name, pin: hashedPin, role },
      select: { id: true, name: true, role: true, active: true, createdAt: true },
    });
    return NextResponse.json({ user });
  } catch (error) { console.error(error); return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 }); }
}
