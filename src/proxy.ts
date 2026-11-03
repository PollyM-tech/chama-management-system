import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { safeReturnPath } from "../shared/workspace";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in",
  "/join(.*)",
  "/api/auth(.*)",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authenticated = await convexAuth.isAuthenticated();
  if (request.nextUrl.pathname === "/sign-in" && authenticated)
    return nextjsMiddlewareRedirect(
      request,
      safeReturnPath(request.nextUrl.searchParams.get("next")),
    );
  if (!isPublic(request) && !authenticated)
    return nextjsMiddlewareRedirect(request, "/sign-in");
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
