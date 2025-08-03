import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const publicPaths = ["/login"];
  const isPublicPath = publicPaths.includes(path);
  
  // Get the token from the session
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Redirect logic
  if (!token && !isPublicPath) {
    // Redirect to login if not authenticated and trying to access protected route
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  if (token && isPublicPath) {
    // Redirect to dashboard if authenticated and trying to access login page
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
  ],
};