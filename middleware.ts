import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    const isAuthPath =
      pathname === "/" ||
      pathname === "/welcomePage" ||
      pathname.startsWith("/auth");

    if (token && isAuthPath) {
      return NextResponse.redirect(
        new URL("/videoGeneration", req.url)
      );
    }

    if (!token && pathname.startsWith("/videoGeneration")) {
      return NextResponse.redirect(
        new URL("/auth", req.url)
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
    matcher: [
      "/",
      "/auth/:path*",
      "/welcomePage",
      "/videoGeneration/:path*",
      "/dashboard/:path*",
      "/profile/:path*",
    ],
  };