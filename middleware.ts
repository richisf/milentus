import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isGithubOAuthPage = createRouteMatcher(["/user/githubAccount"]);
const isProtectedRoute = createRouteMatcher(["/server"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // Completely skip ALL GitHub OAuth routes - don't even check authentication
  if (request.nextUrl.pathname.startsWith('/user/githubAccount')) {
    return; // Skip all middleware processing for any GitHub OAuth routes
  }

  // Additional safety checks for OAuth routes
  if (isGithubOAuthPage(request)) {
    return; // Skip all middleware processing for OAuth flows
  }

  if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/");
  }
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets, OAuth routes, and the root page.
  matcher: ["/((?!.*\\.|_next|user/github).+)", "/(api|trpc)(.*)"],
};
