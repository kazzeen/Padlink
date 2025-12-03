import { withAuth } from "next-auth/middleware";

export default withAuth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/matches/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/notifications/:path*",
    "/support/:path*",
  ],
};
