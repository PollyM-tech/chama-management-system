import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublic = createRouteMatcher(["/", "/sign-in", "/api/auth(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authenticated = await convexAuth.isAuthenticated();
  if (request.nextUrl.pathname === "/sign-in" && authenticated)
    return nextjsMiddlewareRedirect(request, "/dashboard");
  if (!isPublic(request) && !authenticated)
    return nextjsMiddlewareRedirect(request, "/sign-in");
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
