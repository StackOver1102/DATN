import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req: NextRequest) {
    // Add any additional middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/signin',
    },
  }
);

// Protect these routes
export const config = {
  matcher: [
    // Add protected routes here, for example:
    "/profile/:path*",
    "/deposit/:path*",
  ],
};
