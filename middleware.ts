import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/user/(.*)",
  "/server"
]);

// Allow unauthenticated access to GitHub OAuth page
const isGithubPage = (request: Request) => {
  const url = new URL(request.url);
  return url.pathname === '/user/githubAccount';
};

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isProtectedRoute(request) && !isGithubPage(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/");
  }
});

export const config = {
  matcher: ["/((?!.*\\.|_next).*)", "/(api|trpc)(.*)"],
};
