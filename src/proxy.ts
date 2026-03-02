import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kanghan-pos-secret"
);

const ROLE_REDIRECTS: Record<string, string> = {
  ADMIN: "/tables",
  SERVER: "/tables",
  KITCHEN: "/kitchen",
  CAFE: "/cafe",
  WATER: "/water",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const slugMatch = pathname.match(/^\/([^/]+)(\/.*)?$/);
  const slug = slugMatch?.[1];

  if (
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/superadmin") ||
    !slug
  ) {
    return NextResponse.next();
  }

  if (pathname.match(/^\/[^/]+\/login$/)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("pos_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL(`/${slug}/login`, request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    const restaurantSlug = payload.restaurantSlug as string;

    if (restaurantSlug !== slug) {
      return NextResponse.redirect(new URL(`/${slug}/login`, request.url));
    }

    const subPath = slugMatch?.[2] || "/tables";

    if (subPath === "/tables" || subPath === "/") {
      if (role === "KITCHEN") {
        return NextResponse.redirect(new URL(`/${slug}/kitchen`, request.url));
      }
      if (role === "CAFE") {
        return NextResponse.redirect(new URL(`/${slug}/cafe`, request.url));
      }
      if (role === "WATER") {
        return NextResponse.redirect(new URL(`/${slug}/water`, request.url));
      }
    }

    if (subPath.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(
        new URL(`/${slug}/${ROLE_REDIRECTS[role] || "tables"}`, request.url)
      );
    }

    if (subPath.startsWith("/checkout") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${slug}/tables`, request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(
      new URL(`/${slug}/login`, request.url)
    );
    response.cookies.delete("pos_token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
