import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { pin } = await request.json();

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "ກະລຸນາໃສ່ PIN" }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug, active: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "ບໍ່ພົບຮ້ານ" }, { status: 404 });
    }

    const users = await prisma.user.findMany({
      where: { restaurantId: restaurant.id, active: true },
    });

    let matchedUser = null;
    for (const user of users) {
      const isMatch = await bcrypt.compare(pin, user.pin);
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        { error: "ລະຫັດ PIN ບໍ່ຖືກຕ້ອງ" },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: matchedUser.id,
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      name: matchedUser.name,
      role: matchedUser.role,
    });

    const response = NextResponse.json({
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        role: matchedUser.role,
        restaurantSlug: restaurant.slug,
      },
    });

    response.cookies.set("pos_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດ" }, { status: 500 });
  }
}
