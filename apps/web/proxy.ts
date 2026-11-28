import { NextResponse, type NextRequest } from "next/server";

/**
 * Usability redirect. Auth paused: allow immediate access across all routes.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/command/:path*", "/admin/:path*", "/login"],
};
