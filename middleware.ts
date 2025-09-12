import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isGithubOAuthPage = createRouteMatcher(["/githubAccount"]);
const isGithubOAuthCallback = createRouteMatcher(["/githubAccount/callback"]);
const isProtectedRoute = createRouteMatcher(["/server"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // Completely skip ALL GitHub OAuth routes - don't even check authentication
  if (request.nextUrl.pathname.startsWith('/githubAccount')) {
    return; // Skip all middleware processing for any GitHub OAuth routes
  }

  // Additional safety checks for OAuth routes
  if (isGithubOAuthPage(request) || isGithubOAuthCallback(request)) {
    return; // Skip all middleware processing for OAuth flows
  }

  // Skip GitHub callback route by path check as well
  if (request.nextUrl.pathname.includes('/githubAccount/callback')) {
    return;
  }

  if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/");
  }
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets and OAuth routes.
  matcher: ["/((?!.*\\.|_next|github).*)", "/", "/(api|trpc)(.*)"],
};
