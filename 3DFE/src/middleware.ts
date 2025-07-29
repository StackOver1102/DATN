import { withAuth } from "next-auth/middleware";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware() {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect these routes
export const config = {
  matcher: [
    // Add protected routes here, for example:
    // "/dashboard/:path*",
    // "/admin/:path*",
    // "/profile/:path*"
  ],
};
